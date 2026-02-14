# Agentic Development: Automated Template Testing

## Overview

This document describes the **agentic development** process used to test seclaw AI agent templates. The system tests itself: the development agent sends messages to the production agent via Telegram webhook, waits for responses, analyzes tool usage, and reports quality metrics — fully automated, no human in the loop.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────────┐
│  Development Agent   │     │  Production Agent (Docker)    │
│  (Claude Code CLI)   │     │  seclaw-agent-1               │
│                      │     │                                │
│  1. Write test       │────▶│  /webhook endpoint             │
│  2. Activate template│     │  ↓                             │
│  3. Restart container│     │  handleWebhook()               │
│  4. Send webhook     │     │  ↓                             │
│  5. Parse logs       │     │  runAgent() → LLM → tools      │
│  6. Evaluate quality │     │  ↓                             │
│                      │◀────│  Docker logs + Telegram API    │
└─────────────────────┘     └──────────────────────────────┘
```

## The Test Loop

### Step 1: Activate Template

Update `config/installed.json` to set the target template:

```json
{
  "version": 2,
  "base": "productivity-agent",
  "active": "sales-agent",
  "capabilities": ["productivity-agent", "sales-agent"]
}
```

### Step 2: Restart Agent

```bash
docker restart seclaw-agent-1
```

Wait for health check:

```bash
docker exec seclaw-agent-1 wget -qO- http://localhost:3000/health
# → {"status":"ok","tools":61,"schedules":0,"capabilities":["productivity-agent","sales-agent"]}
```

### Step 3: Send Test Message via Webhook

Simulate a Telegram update by POSTing directly to the webhook endpoint inside the container:

```bash
TIMESTAMP=$(date +%s)
CHAT_ID="457815778"

PAYLOAD='{
  "update_id": '$TIMESTAMP',
  "message": {
    "message_id": '$TIMESTAMP',
    "from": {"id": '$CHAT_ID', "is_bot": false, "first_name": "TestRunner"},
    "chat": {"id": '$CHAT_ID', "type": "private"},
    "date": '$TIMESTAMP',
    "text": "Find recent leads on Twitter mentioning AI automation tools"
  }
}'

docker exec seclaw-agent-1 wget -qO- \
  --header="Content-Type: application/json" \
  --post-data="$PAYLOAD" \
  http://localhost:3000/webhook
```

**Key insight**: We don't use the Telegram Bot API directly. We POST a simulated update to the agent's `/webhook` endpoint. This avoids rate limits, doesn't require the bot token for sending, and works entirely inside the Docker network.

### Step 4: Wait for Response

The agent processes the message asynchronously. We poll Docker logs for completion markers:

```bash
# Wait for LLM to finish (indicated by "[llm] Total:" log line)
docker logs --since "$TIMESTAMP" seclaw-agent-1 2>&1 | grep -q "\[llm\] Total:"
```

Timeout after 60 seconds. If no response, mark as FAIL.

### Step 5: Analyze Tool Usage

Parse Docker logs to determine which tools the LLM called:

```bash
# Extract all tool calls
TOOLS_USED=$(grep -o "\[llm\] Tool call: [^ ]*" "$LOG_FILE" | \
  sed 's/\[llm\] Tool call: //' | sort -u | tr '\n' ',')

# Check for hallucination indicators
HAS_EXECUTE=$(grep -c "\[llm\] Tool call: execute_command" "$LOG_FILE" || true)
HAS_CONNECT=$(grep -c "\[llm\] Tool call: connect_integration" "$LOG_FILE" || true)

# Extract response time
TOTAL_TIME=$(grep -o "\[llm\] Total: [0-9]*ms" "$LOG_FILE" | head -1)

# Extract Telegram reply
TELEGRAM_REPLY=$(grep "\[telegram\] Reply" "$LOG_FILE" | head -1)
```

### Step 6: Classify Result

| Classification | Criteria |
|---------------|----------|
| **PASS - CONNECT_INTEGRATION** | Called `connect_integration` to get OAuth URL (correct behavior when integration missing) |
| **PASS - GRACEFUL** | Informed user about missing integration without shell fallback |
| **PASS** | Responded using proper tools, no shell fallback |
| **HALLUCINATION** | Used `execute_command` — fell back to shell commands |
| **FAIL** | No response within 60 seconds |

## Quality Metrics

### Anti-Hallucination Checks

1. **execute_command detection**: Any call to `execute_command` is flagged as hallucination. Templates should use `list_files`, `list_directory`, `read_file`, `write_file` for workspace operations.

2. **Fake data detection**: Check if the agent fabricated URLs, usernames, or data that couldn't come from real tool results.

3. **Integration awareness**: When a required integration is missing, the agent should call `connect_integration` to generate an OAuth link — not fake the data.

### Performance Tiers

| Tier | Response Time | Classification |
|------|--------------|----------------|
| Fast | < 7 seconds | Excellent |
| Medium | 7-15 seconds | Good |
| Slow | > 15 seconds | Acceptable |
| Timeout | > 60 seconds | FAIL |

## Automated Test Script

The test harness (`scripts/test-templates.sh`) automates the full loop for all 15+ templates:

```bash
#!/bin/bash
for template in "${TEMPLATES[@]}"; do
  # 1. Activate template in installed.json
  # 2. docker restart
  # 3. Wait for health
  # 4. Send webhook payload
  # 5. Wait for [llm] Total: in logs
  # 6. Parse tools used
  # 7. Classify: PASS / HALLUCINATION / FAIL
done
```

### Running Tests

```bash
# Full suite (all 15 templates, ~15 minutes)
bash scripts/test-templates.sh

# Targeted re-test (specific templates)
bash scripts/retest-fixed.sh
```

## Structural Fixes for Hallucination

### Problem

When a template requires external data (Twitter posts, HN stories, earnings reports) but the Composio integration isn't connected, the LLM falls back to `execute_command` + `curl` to simulate API calls — producing hallucinated data.

### Solution: Three-Layer Defense

#### Layer 1: System Prompt Rules

Every template's `system-prompt.md` includes:

```markdown
### Data Integrity (CRITICAL)

- NEVER use `execute_command` for ANY purpose — not for API calls, not for file browsing, not for anything.
- Use `list_files`, `list_directory`, `read_file`, and `write_file` for workspace operations.
- If the required integration is not connected, call the `connect_integration` tool to generate an OAuth link.
```

#### Layer 2: `connect_integration` Tool

A builtin tool that lets the LLM programmatically generate Composio OAuth URLs:

```typescript
// LLM calls: connect_integration({ integration_key: "twitter" })
// Returns: "Authorization link for X (Twitter): https://composio.dev/auth/..."
```

Handles three cases:
- **Already connected** → reloads tools, returns "already connected"
- **No managed OAuth** (Tavily) → explains API key configuration needed
- **No auth required** (HN) → reloads tools, suggests trying tools directly

#### Layer 3: Error-Aware Responses

Even when `connect_integration` fails (e.g., Tavily has no OAuth), the error message explicitly says "Do NOT fall back to execute_command" — reinforcing the system prompt rule in context.

## Hot-Deploy Workflow

Changes are deployed without rebuilding the Docker image:

```bash
# 1. Build TypeScript
cd packages/runtime && npx tsup *.ts --format esm --out-dir dist

# 2. Copy to running container
for f in dist/*.js; do
  docker cp "$f" seclaw-agent-1:/app/$(basename $f)
done

# 3. Restart to pick up changes
docker restart seclaw-agent-1
```

This enables rapid iteration: edit → build → deploy → test → evaluate → fix → repeat.

## Test Results History

### v1: Initial Test (Prompt-only fix)
- 4/6 templates still hallucinated
- `execute_command` used by: sales-agent, research-agent, reddit-hn-digest, youtube-digest, youtube-creator, earnings-tracker

### v2: Added `connect_integration` tool
- 4/6 PASS (sales-agent, research-agent, youtube-creator, reddit-hn-digest)
- 2/6 FAIL (youtube-digest used `ls -R`, earnings-tracker used `execute_command` after Tavily OAuth failed)

### v3: Strengthened prompts + error handling
- 5/6 PASS
- 1/6 intermittent (reddit-hn-digest — non-deterministic LLM behavior)

### v4 (Final): Handled NoAuth integrations
- **6/6 PASS**
- All templates either use `connect_integration` or respond gracefully

## Future: HITL Testing

Templates with Human-in-the-Loop features (e.g., "approve before sending outreach") can be tested by:

1. Sending a message that triggers HITL (e.g., "send outreach to this lead")
2. Waiting for the inline keyboard (Approve/Reject buttons)
3. Simulating a callback_query with `confirm_yes:{confirmId}`
4. Verifying the approved action executes correctly

This extends the webhook-based testing to cover confirmation workflows.

## Key Design Principles

1. **Test via webhook, not Telegram API** — avoids rate limits and external dependencies
2. **Parse Docker logs, not API responses** — gives full visibility into tool calls and timing
3. **Classify by tool usage, not content** — `execute_command` = hallucination, `connect_integration` = correct behavior
4. **Hot-deploy for rapid iteration** — no Docker rebuild needed
5. **Three-layer defense against hallucination** — prompt rules + structural tool + error-aware responses

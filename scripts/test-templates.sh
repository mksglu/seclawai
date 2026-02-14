#!/bin/bash
# =============================================================================
# Template Smoke Test Harness
# Tests each paid template by activating it, sending a webhook message,
# and capturing the agent's response from Docker logs.
# =============================================================================

set -euo pipefail

WORKSPACE="/Users/mksglu/il5"
CONTAINER="seclaw-agent-1"
CHAT_ID="457815778"
RESULTS_FILE="/Users/mksglu/Server/Mert/secure-openclaw/docs/template-test-results.md"
LOG_DIR="/tmp/seclaw-template-tests"
mkdir -p "$LOG_DIR"

# Template test cases: id|test_message
TEMPLATES=(
  "inbox-agent|Check my inbox for any urgent emails"
  "content-agent|Help me draft a tweet about AI productivity tools"
  "customer-service|Check my Gmail for any new customer inquiries and draft responses"
  "devops-agent|Run a health check on all my services"
  "earnings-tracker|What earnings reports are coming up this week?"
  "family-calendar|Show me today's schedule for the whole family"
  "health-tracker|Had oatmeal and coffee for breakfast, feeling energetic"
  "knowledge-base|Save this note: AI agents are becoming mainstream in 2026"
  "personal-crm|Show me any new contacts I've interacted with recently"
  "reddit-hn-digest|What's trending on Hacker News today?"
  "research-agent|Research the latest trends in AI agents"
  "sales-agent|Find recent leads on Twitter mentioning AI automation tools"
  "six-agent-company|Launch a new feature: user onboarding tutorial"
  "youtube-creator|Scout trending topics in AI and pitch me 3 video ideas"
  "youtube-digest|What new videos were posted by my subscribed channels?"
)

# Initialize results file
cat > "$RESULTS_FILE" << 'HEADER'
# Template Smoke Test Results

**Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Agent:** seclaw-agent-1
**LLM:** OpenRouter / google/gemini-3-flash-preview

| Template | Status | Response Length | Tools Called | Notes |
|----------|--------|----------------|-------------|-------|
HEADER

# Replace date placeholder
sed -i '' "s/\$(date -u +%Y-%m-%dT%H:%M:%SZ)/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" "$RESULTS_FILE"

echo "========================================="
echo "  seclaw Template Smoke Test"
echo "  Testing ${#TEMPLATES[@]} templates"
echo "========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0

test_template() {
  local TEMPLATE_ID="$1"
  local TEST_MSG="$2"
  local LOG_FILE="$LOG_DIR/${TEMPLATE_ID}.log"

  echo "--- Testing: $TEMPLATE_ID ---"

  # 1. Activate template by updating installed.json
  cat > "$WORKSPACE/config/installed.json" << EOF
{
  "version": 2,
  "base": "productivity-agent",
  "active": "$TEMPLATE_ID",
  "capabilities": ["productivity-agent", "$TEMPLATE_ID"]
}
EOF

  echo "  [1/5] Activated: $TEMPLATE_ID"

  # 2. Restart agent to pick up new config
  docker restart "$CONTAINER" > /dev/null 2>&1
  echo "  [2/5] Agent restarting..."

  # 3. Wait for agent to be healthy
  local MAX_WAIT=30
  local WAITED=0
  while [ $WAITED -lt $MAX_WAIT ]; do
    HEALTH=$(docker exec "$CONTAINER" wget -qO- http://localhost:3000/health 2>/dev/null || echo "")
    if echo "$HEALTH" | grep -q '"status":"ok"'; then
      break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
  done

  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "  [FAIL] Agent did not become healthy within ${MAX_WAIT}s"
    echo "| $TEMPLATE_ID | FAIL | - | - | Agent unhealthy after restart |" >> "$RESULTS_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    return
  fi

  echo "  [3/5] Agent healthy (${WAITED}s)"

  # 4. Clear recent logs and send test message via webhook
  local TIMESTAMP=$(date +%s)
  local WEBHOOK_PAYLOAD=$(cat << PAYLOAD
{
  "update_id": ${TIMESTAMP},
  "message": {
    "message_id": ${TIMESTAMP},
    "from": {"id": ${CHAT_ID}, "is_bot": false, "first_name": "TestRunner"},
    "chat": {"id": ${CHAT_ID}, "type": "private"},
    "date": ${TIMESTAMP},
    "text": "${TEST_MSG}"
  }
}
PAYLOAD
)

  # Send webhook via docker exec
  docker exec "$CONTAINER" wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="$WEBHOOK_PAYLOAD" \
    http://localhost:3000/webhook > /dev/null 2>&1 || true

  echo "  [4/5] Test message sent: \"${TEST_MSG:0:50}...\""

  # 5. Wait for response and capture logs
  echo "  [5/5] Waiting for response (max 60s)..."
  sleep 5  # Initial wait for LLM to start processing

  local RESPONSE_WAIT=0
  local MAX_RESPONSE_WAIT=55
  local FOUND_RESPONSE=false

  while [ $RESPONSE_WAIT -lt $MAX_RESPONSE_WAIT ]; do
    # Get recent logs since the test started
    docker logs --since "${TIMESTAMP}" "$CONTAINER" > "$LOG_FILE" 2>&1

    # Check if we got a response (look for sendMessage or response completion)
    if grep -q "\[llm\] Total:" "$LOG_FILE" 2>/dev/null; then
      FOUND_RESPONSE=true
      break
    fi

    # Also check for errors
    if grep -q "\[llm\] API error:" "$LOG_FILE" 2>/dev/null; then
      FOUND_RESPONSE=true
      break
    fi

    sleep 5
    RESPONSE_WAIT=$((RESPONSE_WAIT + 5))
  done

  # Parse results
  if [ "$FOUND_RESPONSE" = true ]; then
    # Extract key metrics
    local TOOLS_USED=$(grep -o "\[llm\] Tool call: [^ ]*" "$LOG_FILE" 2>/dev/null | sed 's/\[llm\] Tool call: //' | sort -u | tr '\n' ', ' | sed 's/,$//')
    local TOTAL_TIME=$(grep -o "\[llm\] Total: [0-9]*ms" "$LOG_FILE" 2>/dev/null | head -1 | sed 's/\[llm\] Total: //')
    local CALL_COUNT=$(grep -c "\[llm\] Call " "$LOG_FILE" 2>/dev/null || echo "0")
    local HAS_ERROR=$(grep -c "\[llm\] API error:" "$LOG_FILE" 2>/dev/null || echo "0")
    local CAPABILITY=$(grep -o "\[config\] Loaded capability: [^ ]*" "$LOG_FILE" 2>/dev/null | head -1 | sed 's/\[config\] Loaded capability: //')

    if [ "$HAS_ERROR" -gt 0 ]; then
      local ERROR_MSG=$(grep "\[llm\] API error:" "$LOG_FILE" 2>/dev/null | head -1 | sed 's/.*message=//')
      echo "  [FAIL] LLM error: ${ERROR_MSG:0:80}"
      echo "| $TEMPLATE_ID | FAIL | - | - | LLM error: ${ERROR_MSG:0:60} |" >> "$RESULTS_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      local STATUS="PASS"
      local NOTES="Time: ${TOTAL_TIME:-?}, Calls: ${CALL_COUNT}"

      if [ -z "$CAPABILITY" ] || [ "$CAPABILITY" != "$TEMPLATE_ID" ]; then
        NOTES="$NOTES, WARN: capability=${CAPABILITY:-none}"
      fi

      echo "  [PASS] Response in ${TOTAL_TIME:-?}, tools: ${TOOLS_USED:-none}"
      echo "| $TEMPLATE_ID | $STATUS | ${TOTAL_TIME:-?} | ${TOOLS_USED:-none} | $NOTES |" >> "$RESULTS_FILE"
      PASS_COUNT=$((PASS_COUNT + 1))
    fi
  else
    echo "  [FAIL] No response within ${MAX_RESPONSE_WAIT}s"
    echo "| $TEMPLATE_ID | TIMEOUT | - | - | No response in ${MAX_RESPONSE_WAIT}s |" >> "$RESULTS_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo ""
}

# Run tests sequentially (each requires agent restart)
for entry in "${TEMPLATES[@]}"; do
  IFS='|' read -r TEMPLATE_ID TEST_MSG <<< "$entry"
  test_template "$TEMPLATE_ID" "$TEST_MSG"
done

# Summary
echo "========================================="
echo "  Results: $PASS_COUNT PASS / $FAIL_COUNT FAIL"
echo "========================================="

cat >> "$RESULTS_FILE" << EOF

## Summary

- **Passed:** $PASS_COUNT / ${#TEMPLATES[@]}
- **Failed:** $FAIL_COUNT / ${#TEMPLATES[@]}
- **Test Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Methodology

Each template was tested by:
1. Updating \`installed.json\` to set the template as active capability
2. Restarting the agent container
3. Sending a test message via webhook (simulated Telegram update)
4. Capturing Docker logs for response analysis
5. Checking for: successful LLM completion, tool calls, error absence

## Log Files

Individual test logs saved to: \`/tmp/seclaw-template-tests/\`
EOF

echo ""
echo "Full results: $RESULTS_FILE"
echo "Logs: $LOG_DIR/"

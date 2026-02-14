# PRD: Template Switching & Paid Template Activation

**Status:** Draft
**Owner:** Eng. Lead
**Team:** Architect, Telegram Dev, DX Lead, Tech Lead
**Date:** 2026-02-14

---

## 1. Problem Statement

seclaw sells paid AI agent templates ($19-$149, one-time). The infrastructure for purchase (Stripe), delivery (GitHub + API), and installation (CLI `npx seclaw add`) exists. However, the **post-purchase experience is broken**:

1. **No runtime template switching** — user must recreate entire project to change active template
2. **No visibility** — user can't tell which agent/tool answered their Telegram message
3. **No onboarding** — after purchase, user has no guided path to verify template works
4. **No testing** — 16 paid templates exist but none are validated end-to-end
5. **Workspace data loss risk** — switching templates could destroy learnings, tasks, memory

---

## 2. Goals

| Goal | Metric |
|------|--------|
| User can switch active template via Telegram in <5 seconds | Time from `/switch` to confirmation |
| Every response shows which capability answered | 100% of Telegram messages include attribution |
| Paid template works within 60 seconds of `npx seclaw add` | Time from CLI command to first Telegram response |
| Zero data loss on template switch | memory/, tasks/, notes/ files unchanged after switch |
| All 16 paid templates produce expected output | Automated smoke test per template |

---

## 3. Architecture Decision: Stack vs Switch

### Current: Capability Stacking (Additive)

```
installed.json: { "capabilities": ["productivity-agent", "inbox-agent", "sales-agent"] }
```

- All capabilities active simultaneously
- System prompts concatenated into one mega-prompt
- All schedules run concurrently
- Single agent persona handles everything

### Decision: Hybrid Model

**Primary capability** + **always-on base** + **optional stacking**

```json
{
  "base": "productivity-agent",
  "active": "inbox-agent",
  "installed": ["productivity-agent", "inbox-agent", "sales-agent", "research-agent"]
}
```

**Rules:**
- `base` (productivity-agent) always provides core tools: task management, notes, memory, file operations
- `active` determines the primary system prompt, schedules, and persona
- User switches `active` via Telegram (`/switch`) or CLI (`npx seclaw switch`)
- All installed templates are available for switching without re-download
- `installed` tracks all purchased/added templates for the switch menu

**Why hybrid over pure stacking:**
- Stacking 5+ system prompts creates confused, diluted agent behavior
- Schedule conflicts (two templates both doing "daily digest" at 9am)
- Token cost: mega-prompt burns tokens on every message
- User expectation: "I bought Inbox Agent" = agent behaves as inbox agent, not as everything-agent

---

## 4. Detailed Requirements

### 4.1 Template Switching via Telegram

**Owner:** Telegram Dev

**Command:** `/switch`

**Flow:**
```
User sends: /switch
Bot replies:
  *Switch Template*

  Current: *Inbox Agent* ($19)

  [Inbox Agent (active)]
  [Sales Agent]
  [Research Agent]
  [Productivity Agent (free)]

User taps: [Sales Agent]
Bot replies:
  Switched to *Sales Agent*.

  New schedules activated:
  - Lead scan (every 2h)
  - Pipeline report (daily 6pm)

  Try: "Find leads mentioning AI agents on X"
```

**Implementation:**
1. Read `installed.json` to get list of installed capabilities
2. Show inline keyboard with one button per template
3. On selection:
   - Update `installed.json` → set `active: "sales-agent"`
   - Reload system prompt (hot-reload, no container restart)
   - Re-register Inngest schedules for new active template
   - Deactivate schedules from previous active template
   - Send confirmation with new schedule list + example prompt

**Edge cases:**
- If only 1 template installed → show "No other templates. Browse at seclawai.com/templates"
- If active template requires integration not connected → show "Sales Agent needs X (Twitter). Connect with /integrations"
- `/switch inbox-agent` direct command (skip menu)

**Config hot-reload:**
- Agent exposes internal method: `reloadConfig()` in `config.ts`
- Called after `installed.json` is updated
- Re-reads system prompt, re-merges schedules
- No container restart needed

### 4.2 Response Attribution

**Owner:** Telegram Dev + Tech Lead

Every Telegram response includes a footer showing which capability answered and optionally which tools were used.

**Format (compact):**
```
Your inbox has 3 urgent emails:
- Client X: Contract review needed (deadline tomorrow)
- AWS: Billing alert — $127 spike
- HR: Benefits enrollment closing Friday

_Inbox Agent | gmail, calendar_
```

**Implementation:**

1. **LLM returns metadata** — modify `runAgent()` in `llm.ts`:
   ```typescript
   interface AgentResult {
     text: string;
     model: string;
     toolsUsed: string[];
     iterationCount: number;
     durationMs: number;
   }
   ```

2. **Capability name** — already extracted from `--- CapabilityName` footer in system prompt. Keep this mechanism.

3. **Tool names** — collect during tool execution loop. Deduplicate and simplify:
   - `GMAIL_FETCH_EMAILS` → `gmail`
   - `GOOGLECALENDAR_FIND_EVENT` → `calendar`
   - `read_file` → `files`
   - `execute_command` → `shell`

4. **Footer formatting** in `telegram.ts`:
   ```
   _CapabilityName | tool1, tool2_
   ```
   If no tools used: `_CapabilityName_`

5. **Toggle:** User can disable with `/metadata off`. Stored in `memory/preferences.json`.

### 4.3 CLI Template Addition (Hot-Install)

**Owner:** DX Lead

After `npx seclaw add <template> --key TOKEN`:
1. Download template files from API
2. Write to `./templates/<template>/`
3. Copy to `<workspace>/config/capabilities/<template>/`
4. Update `<workspace>/config/installed.json`
5. **Auto-restart agent container** (not rebuild CLI)
6. Print: "Template installed! Send `/switch <template>` to your Telegram bot."

**Changes from current behavior:**
- Remove CLI auto-rebuild (lines 117-128 in add.ts) — not needed
- Add `docker compose restart agent` after file copy
- Use `findProjectDir()` instead of `process.cwd()` for workspace detection
- Validate downloaded files (system-prompt.md must exist)

### 4.4 Onboarding After Purchase

**Owner:** DX Lead + Telegram Dev

**Trigger:** First message after new template is activated via `/switch`

**Flow:**
```
User switches to Sales Agent for first time.
Bot sends:

  *Sales Agent activated!*

  Here's what I can do:
  - Monitor X (Twitter) for leads mentioning your keywords
  - Track and score leads automatically
  - Send you a daily pipeline report

  *Quick setup:*
  1. Connect X → /integrations
  2. Tell me your target keywords → "Track leads about AI agents"
  3. Set your daily report time → /schedules

  _Send any message to get started._
```

**Implementation:**
- Each template's `system-prompt.md` includes an `## Onboarding` section
- Agent detects first activation via `memory/onboarded-{templateId}.flag` file
- If file doesn't exist → LLM receives onboarding context → generates welcome
- After onboarding message sent → create flag file

### 4.5 Workspace Persistence Guarantee

**Owner:** Architect

**Rule:** Template switching NEVER modifies these directories:
- `memory/` — learnings, chat history, episodic memory
- `tasks/` — active TODOs
- `notes/` — user notes
- `reports/` — generated reports
- `drafts/` — draft documents

**What changes on switch:**
- `config/installed.json` → `active` field updated
- Active system prompt reloaded from `config/capabilities/<active>/system-prompt.md`
- Active schedules reloaded from `config/capabilities/<active>/schedules.json`

**What does NOT change:**
- Memory, tasks, notes, reports, drafts — all untouched
- Composio integrations — remain connected
- Telegram bot token — same bot
- LLM provider/model — same config

### 4.6 Template Testing Framework

**Owner:** Tech Lead

**Goal:** Validate each paid template produces expected output before release.

**Approach: Smoke Test per Template**

Each template gets a test file: `packages/templates/paid/<template>/test.json`

```json
{
  "tests": [
    {
      "name": "inbox-categorization",
      "input": "I have 5 new emails. Categorize them.",
      "tools_expected": ["GMAIL_FETCH_EMAILS"],
      "output_contains": ["URGENT", "ACTION", "FYI"],
      "max_iterations": 5
    },
    {
      "name": "schedule-fires",
      "schedule_id": "inbox-scan",
      "output_contains": ["Inbox Summary"]
    }
  ]
}
```

**Test runner:** `npx seclaw test <template>`

1. Spin up isolated Docker environment
2. Load template config + system prompt
3. Mock Composio tools (return fixture data)
4. Run each test case through `runAgent()`
5. Validate: tools called, output contains expected strings, no errors
6. Report: PASS/FAIL per test case

**MVP (Phase 1):** Manual test checklist per template (markdown file)
**Phase 2:** Automated test runner with mocked tools

---

## 5. Implementation Plan

### Phase 1: Core Switching (Week 1)

| Task | Owner | Files | Priority |
|------|-------|-------|----------|
| Update `installed.json` schema to include `active` field | Architect | `runtime/config.ts` | P0 |
| Implement `reloadConfig()` hot-reload in agent | Architect | `runtime/config.ts`, `runtime/scheduler.ts` | P0 |
| Add `/switch` command handler in Telegram | Telegram Dev | `runtime/telegram.ts` | P0 |
| Update schedule loader to filter by active capability | Tech Lead | `runtime/scheduler.ts` | P0 |
| Remove CLI auto-rebuild, add `docker restart` | DX Lead | `cli/src/commands/add.ts` | P0 |
| Fix `add.ts` workspace path detection | DX Lead | `cli/src/commands/add.ts` | P0 |

### Phase 2: Attribution & Polish (Week 2)

| Task | Owner | Files | Priority |
|------|-------|-------|----------|
| Return tool metadata from `runAgent()` | Tech Lead | `runtime/llm.ts` | P1 |
| Format attribution footer in Telegram | Telegram Dev | `runtime/telegram.ts` | P1 |
| Add `/metadata on/off` toggle | Telegram Dev | `runtime/telegram.ts` | P1 |
| Onboarding flow on first template activation | Telegram Dev | `runtime/telegram.ts` | P1 |
| `/switch` command (list installed + switch mode) | Telegram Dev | `runtime/telegram.ts` | P1 (DONE) |

### Phase 3: Testing & Validation (Week 3)

| Task | Owner | Files | Priority |
|------|-------|-------|----------|
| Create test fixtures for all 16 templates | Tech Lead | `templates/paid/*/test.json` | P2 |
| Manual test checklist per template | Tech Lead | `docs/template-tests.md` | P2 |
| Template validation in `add` command | DX Lead | `cli/src/commands/add.ts` | P2 |
| Pre-bundle templates to R2 (remove GitHub dependency) | Tech Lead | `api/src/routes/templates.ts` | P2 |

---

## 6. Technical Specifications

### 6.1 installed.json Schema (v2)

```json
{
  "version": 2,
  "base": "productivity-agent",
  "active": "inbox-agent",
  "installed": [
    {
      "id": "productivity-agent",
      "installedAt": "2026-02-14T12:00:00Z",
      "tier": "free"
    },
    {
      "id": "inbox-agent",
      "installedAt": "2026-02-14T13:00:00Z",
      "tier": "paid"
    }
  ]
}
```

**Migration:** If `version` field missing, assume v1 (current array format) and auto-migrate.

### 6.2 Config Hot-Reload API

```typescript
// runtime/config.ts
export function reloadConfig(config: AgentConfig): AgentConfig {
  // Re-read installed.json
  const installed = loadInstalledJson(config.workspace);

  // Rebuild system prompt from active capability only
  const activePrompt = loadCapabilityPrompt(config.workspace, installed.active);
  const basePrompt = loadCapabilityPrompt(config.workspace, installed.base);
  config.systemPrompt = buildComposedPrompt(basePrompt, activePrompt);

  return config;
}
```

### 6.3 Schedule Filtering

```typescript
// runtime/scheduler.ts
function loadActiveSchedules(workspace: string): ScheduleConfig {
  const installed = loadInstalledJson(workspace);
  const activeId = installed.active;
  const baseId = installed.base;

  // Load base schedules (always active)
  const baseSchedules = loadCapabilitySchedules(workspace, baseId);

  // Load active template schedules
  const activeSchedules = loadCapabilitySchedules(workspace, activeId);

  // Merge (base + active only, not all installed)
  return mergeSchedules(baseSchedules, activeSchedules);
}
```

### 6.4 Tool Name Simplification Map

```typescript
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  "GMAIL_": "gmail",
  "GOOGLECALENDAR_": "calendar",
  "GITHUB_": "github",
  "SLACK_": "slack",
  "NOTION_": "notion",
  "LINEAR_": "linear",
  "read_file": "files",
  "write_file": "files",
  "list_directory": "files",
  "execute_command": "shell",
  "update_memory": "memory",
  "create_task": "tasks",
  "save_note": "notes",
};

function simplifyToolName(toolName: string): string {
  for (const [prefix, display] of Object.entries(TOOL_DISPLAY_NAMES)) {
    if (toolName.startsWith(prefix)) return display;
  }
  return toolName.toLowerCase().replace(/_/g, "-");
}
```

### 6.5 Telegram /switch Handler

```typescript
// runtime/telegram.ts
async function handleSwitch(chatId: number, args: string, config: AgentConfig) {
  const installed = loadInstalledJson(config.workspace);

  if (args) {
    // Direct switch: /switch sales-agent
    const target = installed.installed.find(t => t.id === args.trim());
    if (!target) {
      await sendMessage(token, chatId, `Template "${args}" not installed. Run \`npx seclaw add ${args}\` first.`);
      return;
    }
    await activateTemplate(config, target.id, chatId);
    return;
  }

  // Show menu
  const buttons = installed.installed.map(t => [{
    text: t.id === installed.active ? `${t.id} (active)` : t.id,
    callback_data: `switch:${t.id}`
  }]);

  await sendMessageWithButtons(token, chatId,
    `*Switch Template*\nCurrent: *${installed.active}*`,
    buttons
  );
}

async function activateTemplate(config: AgentConfig, templateId: string, chatId: number) {
  // 1. Update installed.json
  const installed = loadInstalledJson(config.workspace);
  installed.active = templateId;
  writeInstalledJson(config.workspace, installed);

  // 2. Hot-reload config
  reloadConfig(config);

  // 3. Re-register schedules with Inngest
  await reloadSchedules(config);

  // 4. Check onboarding
  const onboardedFlag = resolve(config.workspace, "memory", `onboarded-${templateId}.flag`);
  const isFirstTime = !existsSync(onboardedFlag);

  // 5. Send confirmation
  const schedules = loadCapabilitySchedules(config.workspace, templateId);
  let msg = `Switched to *${templateId}*.`;
  if (schedules.length > 0) {
    msg += `\n\nSchedules activated:\n`;
    msg += schedules.map(s => `- ${s.description} (${s.cron})`).join("\n");
  }

  if (isFirstTime) {
    writeFileSync(onboardedFlag, new Date().toISOString());
    // Onboarding message will be triggered by next user message
    // (system prompt includes ## Onboarding section)
  }

  await sendMessage(token, chatId, msg);
}
```

---

## 7. Data Flow Diagram

```
Purchase Flow:
  seclawai.com → Stripe Checkout → Webhook → D1 (token+purchase) → Email (token)

Install Flow:
  npx seclaw add <template> --key TOKEN
    → API /activate (validates token, fetches from GitHub)
    → CLI writes to ./templates/<template>/
    → CLI copies to <workspace>/config/capabilities/<template>/
    → CLI updates <workspace>/config/installed.json
    → CLI runs: docker compose restart agent
    → Agent reloads config, sees new capability

Switch Flow (Telegram):
  /switch → Show installed templates → User taps one
    → Update installed.json (active field)
    → Hot-reload system prompt
    → Re-register Inngest schedules
    → Send confirmation + onboarding (if first time)

Message Flow (with attribution):
  User message → Load active system prompt → runAgent()
    → LLM processes with active capability prompt
    → Tool calls logged → Response generated
    → Footer appended: _CapabilityName | tools_
    → Sent to Telegram
```

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hot-reload breaks mid-conversation | User gets confused response | Queue reload until conversation idle (no pending messages) |
| Schedule conflicts between base + active | Duplicate notifications | Namespace all schedules with capability prefix |
| Large installed.json with many templates | Slow config reads | Max 20 templates, file is <2KB even with 20 |
| Template requires integration not connected | Template fails silently | Check requirements on switch, warn user |
| Inngest schedule re-registration fails | Old schedules keep running | Deregister all before re-registering |
| User switches mid-schedule execution | Partial results | Let running schedule complete, new schedule starts on next cron tick |

---

## 9. Success Criteria

- [ ] `/switch` command works in Telegram with inline keyboard
- [ ] Template switch completes in <5 seconds (no container restart)
- [ ] Every response includes `_CapabilityName | tools_` footer
- [ ] `npx seclaw add <template> --key TOKEN` auto-restarts agent
- [ ] Memory, tasks, notes survive template switch (zero data loss)
- [ ] First-time template activation shows onboarding message
- [ ] All 16 paid templates have manual test checklist
- [ ] 5 most popular templates pass automated smoke test

---

## 10. Out of Scope (Phase 2+)

- Multi-agent orchestration (six-agent-company runs all 6 simultaneously)
- Template marketplace in Telegram (browse + purchase from bot)
- Template auto-updates (new version notification)
- Template sharing between users
- Custom template creation (user builds own)
- Subscription billing (monthly access to all templates)
- Workflow visual builder (Langflow/Flowise integration)

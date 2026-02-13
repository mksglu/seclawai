<p align="center">
  <strong>seclaw</strong>
</p>

<p align="center">
  Secure autonomous AI agents in 60 seconds.<br />
  The OpenClaw alternative that doesn't compromise your security.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#templates">Templates</a> &middot;
  <a href="#security">Security</a> &middot;
  <a href="#dashboards">Dashboards</a> &middot;
  <a href="#pricing--monetization">Pricing</a> &middot;
  <a href="#roadmap">Roadmap</a>
</p>

---

```bash
npx seclaw
```

One command. Pick your LLM, enter your Telegram token, choose a template. Your agent is live in 60 seconds.

---

## Why seclaw?

OpenClaw has 68K+ stars — and zero container isolation. API keys exposed to every MCP container, your home directory mounted to root-privileged containers, port 5678 open to the internet with no auth.

seclaw fixes all of that. Same autonomous agent capabilities, but with actual security boundaries enforced at the Docker level — not in the system prompt.

## Quick Start

### Prerequisites

- **Docker Desktop** (or Docker Engine on Linux)
- **Node.js 20+**
- An **LLM API key** — any of the following:
  - [Anthropic (Claude)](https://console.anthropic.com) — recommended
  - [OpenAI (GPT-4o)](https://platform.openai.com/api-keys)
  - [Google (Gemini)](https://aistudio.google.com/apikey)
  - [OpenRouter (100+ models)](https://openrouter.ai/keys)
- A **Telegram bot token** from [@BotFather](https://t.me/BotFather)

### Install

```bash
npx seclaw
```

The interactive CLI handles everything:

1. Pick your LLM provider
2. Enter your API key
3. Enter your Telegram bot token
4. Optionally connect Composio integrations (Gmail, Calendar, GitHub...)
5. Select a template
6. `docker compose up -d` — done

No config files to edit. No YAML to touch. No Docker knowledge required.

### Verify

```bash
npx seclaw status    # Check all services
npx seclaw doctor    # Auto-diagnose & fix issues
```

---

## How It Works

seclaw deploys 4 Docker containers on your machine:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR MACHINE                                                    │
│                                                                  │
│  ┌────────────────── agent-net (bridge) ──────────────────────┐ │
│  │                                                             │ │
│  │  ┌─────────┐    ┌─────────┐    ┌──────────────────┐       │ │
│  │  │  agent   │───>│ inngest │    │ desktop-commander │       │ │
│  │  │ :3000    │    │ :8288   │    │ (MCP, sandboxed)  │       │ │
│  │  └────┬─────┘    └─────────┘    └──────────────────┘       │ │
│  │       │                                                     │ │
│  │       │  ┌─────────────┐                                   │ │
│  │       └─>│ cloudflared │──── outbound-only ───> Telegram   │ │
│  │          └─────────────┘                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Volumes:  ./shared:/workspace (agent + commander only)          │
│  Ports:    8288 (Inngest Dashboard, localhost only)               │
│  Inbound:  NONE (zero open ports via CF Tunnel)                  │
└──────────────────────────────────────────────────────────────────┘
```

| Container | What it does | Port |
|-----------|-------------|------|
| **agent** | Node.js runtime — Telegram bot, LLM calls, Composio integrations, MCP client | 3000 (internal) |
| **inngest** | Self-hosted workflow engine — cron tasks, durable execution, HITL approvals | [8288](http://localhost:8288) (dashboard) |
| **desktop-commander** | MCP server — file I/O + terminal access, fully sandboxed (`read_only`, `cap_drop: ALL`) | 3000 (internal) |
| **cloudflared** | Cloudflare Tunnel — outbound-only, zero inbound ports on your machine | — |

### Request Flow

```
User sends Telegram message
  └─> Cloudflare Edge
        └─> cloudflared (outbound tunnel)
              └─> agent :3000/webhook
                    ├─> LLM (Claude / GPT-4o / Gemini / OpenRouter)
                    ├─> Composio (Gmail, Calendar, GitHub, Slack...)
                    └─> Desktop Commander (file read/write, terminal)
                          └─> /workspace (sandboxed volume)
```

### Scheduled Task Flow

```
Inngest cron trigger (e.g. "0 */2 * * *")
  └─> agent :3000/api/inngest
        ├─> step.run("fetch-data")     → Composio API call
        ├─> step.run("process")        → LLM analysis
        ├─> step.run("send-preview")   → Telegram message + Approve/Reject buttons
        └─> step.waitForEvent()        → Pauses until user taps Approve or Reject
              ├─> Approve → step.run("execute") → Send final result
              └─> Reject  → Function ends, no action taken
```

---

## Telegram Interface

Your agent lives in Telegram. Send any message and the agent responds using your configured LLM with full tool access.

### Built-in Commands

| Command | What it does |
|---------|-------------|
| `/schedules` | View active scheduled tasks, approve/reject pending actions |
| `/integrations` | List connected services, connect/disconnect OAuth integrations |
| Any message | Agent responds with LLM reasoning + tool execution |

### Human-in-the-Loop

Paid templates include scheduled tasks that require your approval. When a task runs (e.g., email digest, content draft, lead outreach), the agent sends a preview to Telegram with **Approve** / **Reject** buttons. The task pauses (up to 1 hour) until you respond — no automated actions without your explicit consent.

---

## Built-in Agent Tools

8 tools for scheduling, reminders, and human-in-the-loop workflows — powered by Inngest. Works via natural language in Telegram.

| Tool | What it does | Example |
|------|-------------|---------|
| `send_delayed_message` | Send a Telegram message after a delay (1-3600s) | "remind me in 10 minutes to check the server health" |
| `schedule_action` | Execute any action after a delay with full agent capabilities | "in 30 seconds, fetch YouTube uploads and create a digest" |
| `request_confirmation` | Send Approve / Reject buttons, execute only on approval | "draft an outreach email, but ask me before sending" |
| `create_schedule` | Create a new recurring cron schedule | "every morning at 9am, summarize my unread newsletters" |
| `delete_schedule` | Remove a recurring schedule permanently | "stop the earnings tracker alerts" |
| `list_schedules` | List all schedules with status, cron, and timezone | "show me all my active cron jobs" |
| `toggle_schedule` | Enable or disable a schedule without deleting it | "pause the daily Reddit digest for this week" |
| `trigger_schedule_now` | Run a scheduled task immediately | "run the inbox declutter right now" |

Schedules are persisted in `/workspace/config/schedules.json` and powered by Inngest cron functions. The agent picks the right tool automatically based on your message.

---

## Dashboards

### Inngest Dashboard — `http://localhost:8288`

Every seclaw deployment includes the [Inngest Dev Server](https://www.inngest.com/docs/local-development) with a built-in dashboard. No extra setup required — it starts automatically with `docker compose up`.

What you can see:
- **All registered functions** — your template's scheduled tasks with cron patterns
- **Execution history** — every run with step-by-step timeline, inputs, outputs
- **Failed runs** — errors, retries, and step-level debugging
- **Pending events** — human-in-the-loop tasks waiting for Telegram approval
- **Live event stream** — real-time view of events flowing through the system

> Self-hosted, free forever, no execution limits. Runs on SQLite inside a single Docker container.

---

## Templates

One-time purchase. Forever yours. Self-hosted. No subscriptions.

| Template | Price | Scheduled Tasks | Integrations | What it does |
|----------|-------|----------------|--------------|-------------|
| **Productivity Agent** | Free | — | Gmail*, Calendar* | Task management, daily reports, email drafting, file organization |
| **Inbox Agent** | $19 | Every 2h: inbox scan | **Gmail** | Email categorization (Urgent/Action/FYI/Newsletter), priority triage, Telegram digest |
| **Research Agent** | $39 | 08:00: morning scan | GitHub*, Slack* | Competitor monitoring, multi-source scanning (X, HN, Reddit, RSS), daily digest |
| **Content Agent** | $49 | 09:00: trend scan, 11:00: draft | Google Sheets* | Trend research, draft in your voice, post with approval, engagement analysis |
| **Sales Agent** | $79 | Every 4h: lead monitor | Gmail*, Slack* | Buying signal detection, lead scoring (1-10), outreach drafts, 3-day follow-up |
| **6-Agent Company** | $149 | 09:00: standup, every 4h: work cycle | Gmail*, Drive*, Notion* | 6 coordinated agents (CEO, Engineer, QA, Data, Marketing, Growth) with quality gates and 5-type memory |

<sup>* = optional integration, unlocks additional features when connected</sup>

All templates include **Telegram** (required) and **Desktop Commander** (file I/O + terminal). Tasks marked with schedule patterns use Inngest cron functions.

### Switching Templates

```bash
# Add a new template to your existing project
npx seclaw add research-agent --key YOUR_LICENSE_KEY
```

When you switch templates, the agent's system prompt, scheduled tasks, and recommended integrations all update accordingly. Integrations that are no longer needed can be disconnected via `/integrations` in Telegram or `npx seclaw integrations` in the CLI.

### Free Template

The Productivity Agent ships with the CLI. Telegram interaction with full LLM tool access, task management in `/workspace`, and optional Gmail + Calendar integrations.

### Paid Templates

```bash
# 1. Purchase at https://seclawai.com/templates
# 2. Activate:
npx seclaw add content-agent --key YOUR_LICENSE_KEY
# 3. Done — scheduled tasks start automatically
```

Templates include pre-configured `schedules.json` with Inngest cron tasks and human-in-the-loop actions. They work immediately after activation.

---

## Integrations via Composio

Integrations are powered by [Composio](https://composio.dev) — managed OAuth that handles token refresh and API authentication. Your agent never stores raw OAuth tokens.

### Available Services (12)

| Service | What the agent can do |
|---------|----------------------|
| Gmail | Read, categorize, draft replies, send with approval |
| Google Calendar | Check schedule, create events, meeting summaries |
| Google Drive | Read/write documents, file sharing |
| Google Sheets | Read/write spreadsheets, data analysis |
| GitHub | Issues, PRs, notifications, repo activity |
| Slack | Read/send messages, channel monitoring |
| Notion | Read/update pages, databases, wikis |
| Linear | Issues, projects, sprint tracking |
| Trello | Boards, cards, task management |
| Todoist | Task creation, project management |
| Dropbox | File storage, sharing |
| WhatsApp | Messaging |

### Connect & Disconnect

```bash
npx seclaw integrations    # CLI: interactive connect/disconnect
```

Or in Telegram: `/integrations` — shows connected (check) vs available (circle) services with inline buttons.

### Security Model

- **No raw tokens stored** — Composio manages OAuth lifecycle (token refresh, revocation)
- **Granular control** — Connect only the services you need, disconnect instantly
- **Per-template scoping** — Each template recommends specific integrations; you choose what to enable
- **One-tap revoke** — Disconnect via Telegram or CLI, effective immediately

---

## Security

Every guardrail is enforced at the Docker runtime level — not in the system prompt.

### What the agent CAN'T do

| Guardrail | How it's enforced |
|-----------|-------------------|
| Access your API keys | Env isolation per container — MCP server has zero access to LLM keys |
| Modify its own code | `read_only: true` — filesystem is immutable |
| Access your home directory | Explicit `/workspace` volume mount only |
| Escalate privileges | `cap_drop: ALL` + `no-new-privileges` + non-root user (UID 1001) |
| Consume unlimited resources | 512MB RAM / 1 CPU per container |
| Send emails without approval | `permissions.yml` whitelist + Telegram confirmation gates |
| Accept inbound connections | Zero open ports — Cloudflare Tunnel is outbound-only |

### What the agent CAN do

- Reply to your Telegram messages with full LLM reasoning
- Read/write files in `/workspace` (your shared project directory)
- Run terminal commands (sandboxed, restricted by `permissions.yml`)
- Access Gmail, Calendar, GitHub, Slack, Notion via Composio OAuth
- Run scheduled tasks (morning digests, competitor scans, content drafts)
- Wait for your explicit approval before sensitive actions
- Learn from conversation history (per-chat memory buffer)

### vs OpenClaw

| | OpenClaw | seclaw |
|---|---------|--------|
| Container isolation | None — shared env | Per-container with bridge networks |
| API key protection | All keys in every container | Env-only, sealed per service |
| Filesystem access | Entire home directory | `/workspace` mount only |
| Root privileges | Running as root | Non-root + `cap_drop ALL` |
| Permission enforcement | Prompt-based (bypassable) | Runtime guardrails (`permissions.yml`) |
| Network exposure | Port 5678 open to internet | Zero inbound via CF Tunnel |
| Resource limits | None (infinite) | 512MB / 1 CPU per container |
| Setup time | 30+ min manual config | 60 seconds via CLI |

---

## CLI Reference

Every command has interactive prompts with clear descriptions — no flags to memorize.

```bash
npx seclaw                           # Interactive setup wizard
npx seclaw add <template> --key KEY  # Activate a paid template
npx seclaw templates                 # List all available templates
npx seclaw integrations              # Connect/disconnect Composio services
npx seclaw status                    # Check running services & health
npx seclaw doctor                    # Auto-diagnose & fix issues
npx seclaw stop                      # Stop all containers
npx seclaw upgrade                   # Pull latest images & restart
```

| Command | What it does |
|---------|-------------|
| `create` (default) | Full setup wizard. Docker pre-flight, LLM provider selection, Telegram token, template pick, Cloudflare Tunnel config, `docker compose up`. |
| `add <template>` | Add/switch template. Downloads paid templates via license key, copies system prompt + schedules, restarts agent. Integrations list updates based on new template. |
| `templates` | List all available templates with prices, descriptions, and included scheduled tasks. |
| `integrations` | Interactive Composio management. Shows connected vs available services. Browser OAuth flow for connect, instant revoke for disconnect. |
| `status` | Shows container status, agent health, tunnel URL, connected integrations, active schedules, workspace path. |
| `doctor` | Health check with auto-fix. Validates Docker, containers, agent health, tunnel URL, Telegram webhook, Composio key. Automatically restarts broken services. |
| `stop` | `docker compose down`. Shows restart instructions. |
| `upgrade` | Pulls latest images, rebuilds containers, re-detects tunnel URL, re-sets Telegram webhook. |

---

## Pricing & Monetization

### For Users: Templates

One-time purchase. No subscriptions. Self-hosted — your data stays on your machine.

| Template | Price | ROI |
|----------|-------|-----|
| **Productivity Agent** | **Free** | Morning reports, task management, Telegram assistant |
| **Inbox Agent** | **$19** | Save 30 min/day on email triage — pays for itself in 1 day |
| **Research Agent** | **$39** | Competitor monitoring that would cost $200+/mo from a SaaS |
| **Content Agent** | **$49** | Consistent content creation without hiring a ghostwriter |
| **Sales Agent** | **$79** | Automated lead gen that replaces hours of manual X monitoring |
| **6-Agent Company** | **$149** | 6 coordinated AI workers for the cost of one lunch |

### Your Running Cost: LLM API Only

Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram, Composio free tier.

| Usage Level | Model | Monthly Cost |
|-------------|-------|-------------|
| Light | Haiku 4.5 only | ~$6/mo |
| Normal | Smart routing (Haiku + Sonnet) | ~$15-30/mo |
| Heavy | Opus 4.6 | ~$100+/mo |

**Smart routing** (via OpenRouter): Simple messages use Haiku ($0.25/1M tokens), complex reasoning uses Opus ($15/1M tokens). Saves up to 78% vs fixed Opus pricing. The agent picks the right model per task automatically.

### Total Cost of Ownership

| | OpenClaw | seclaw |
|---|---------|--------|
| Setup | Free | Free |
| Templates | N/A | $0-149 one-time |
| Infrastructure | Free (Docker) | Free (Docker) |
| Scheduling | Manual | Free (Inngest self-hosted) |
| Integrations | Manual OAuth setup | Free (Composio) |
| LLM API | ~$6-100/mo | ~$6-100/mo |
| **Total Year 1** | **$72-1200** | **$72-1349** (with all templates) |
| **Total Year 2+** | **$72-1200** | **$72-1200** (templates already paid) |

---

## Architecture

### Monorepo Structure

```
seclaw/
├── packages/
│   ├── cli/                  # CLI tool (published as seclaw)
│   │   ├── src/commands/     # create, add, status, stop, upgrade, doctor, templates, integrations
│   │   ├── runtime/          # Bundled agent.js (single-file build)
│   │   └── templates/        # Free + paid template configs
│   │       ├── free/
│   │       │   └── productivity-agent/
│   │       │       ├── manifest.json       # Template metadata + pricing
│   │       │       ├── system-prompt.md    # Agent personality + rules
│   │       │       ├── schedules.json      # Inngest cron definitions
│   │       │       └── config.json         # Default settings
│   │       └── paid/
│   │           ├── inbox-agent/
│   │           ├── content-agent/
│   │           ├── research-agent/
│   │           ├── sales-agent/
│   │           └── six-agent-company/
│   ├── runtime/              # Agent source (TypeScript → agent.js)
│   │   ├── agent.ts          # HTTP server, webhook routing, Inngest handler
│   │   ├── telegram.ts       # Bot commands, HITL callbacks, message history
│   │   ├── scheduler.ts      # Inngest function creator, schedule config loader
│   │   ├── llm.ts            # Multi-provider LLM (Anthropic, OpenAI, Google, OpenRouter)
│   │   ├── tools.ts          # Composio + Desktop Commander MCP tool loading
│   │   └── config.ts         # Environment config loader
│   ├── web/                  # Landing page (Hono + JSX + Tailwind → Cloudflare Workers)
│   └── api/                  # License API (Hono + D1 + Stripe → Cloudflare Workers)
└── pnpm-workspace.yaml       # pnpm workspaces + Turborepo
```

### Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **CLI** | Commander + Clack | Beautiful interactive prompts, zero-config DX |
| **Agent runtime** | Node.js + OpenAI SDK | Lightweight, single-file bundle, multi-provider LLM |
| **Scheduler** | Inngest (self-hosted) | Free forever, durable execution, built-in dashboard, HITL |
| **File access** | Desktop Commander (MCP) | Sandboxed file I/O + terminal via Model Context Protocol |
| **Integrations** | Composio | Managed OAuth for 12+ services, zero token storage |
| **Tunnel** | Cloudflare Tunnel | Zero inbound ports, auto-configured, free |
| **Landing page** | Hono + JSX + Tailwind | Cloudflare Workers, edge-deployed |
| **License API** | Hono + D1 + Stripe | Cloudflare Workers + SQLite, template activation + payments |
| **Monorepo** | pnpm workspaces + Turborepo | Fast builds, shared dependencies |

### How Templates Work

A template is a config bundle — no compiled code, no Docker image changes:

```
manifest.json       → metadata, pricing, required integrations, engine type
system-prompt.md    → agent personality, workflow rules, behavior
schedules.json      → Inngest cron definitions + action configs
config.json         → default settings (timezone, etc.)
```

When you run `npx seclaw add <template>`:
1. CLI downloads template files (or copies from bundled free templates)
2. `system-prompt.md` → `/workspace/config/system-prompt.md`
3. `schedules.json` → `/workspace/config/schedules.json`
4. Agent hot-reloads on next request — picks up new prompt + schedules
5. Inngest re-registers cron functions from the new `schedules.json`
6. `/integrations` in Telegram shows the new template's recommended services

---

## Roadmap

### Phase 1 — Done
- [x] One-command setup via interactive CLI
- [x] Telegram bot interface with `/schedules` and `/integrations`
- [x] Multi-provider LLM (Claude, GPT-4o, Gemini, OpenRouter)
- [x] Inngest scheduled tasks with timezone + human-in-the-loop
- [x] Composio OAuth integrations (12 services)
- [x] Desktop Commander MCP (sandboxed file I/O + terminal)
- [x] Docker security hardening (`read_only`, `cap_drop`, resource limits, non-root)
- [x] Cloudflare Tunnel (zero inbound ports)
- [x] 6 agent templates (1 free + 5 paid)
- [x] `doctor` command with auto-fix
- [x] Inngest Dashboard at `localhost:8288`

### Phase 2 — Beyond Telegram
- [ ] **MCP Server mode** — Expose your agent as an MCP server. Use it from Claude Desktop, Cursor, Windsurf, or any MCP-compatible client. Same agent, same tools, same schedules — different interface.
- [ ] **Slack bot mode** — Full Slack integration as a Telegram alternative. Same `/schedules` and `/integrations` commands in Slack.
- [ ] **Web dashboard** — Browser-based chat + schedule management + integration status. Visual schedule editor.
- [ ] **REST API mode** — Headless agent for programmatic access. Build your own frontend or integrate into existing tools.

### Phase 3 — Advanced Workflows
- [ ] **Visual workflow builder** — Drag-and-drop schedule editor via Langflow / Flowise / Dify
- [ ] **Event-driven triggers** — GitHub webhook, email arrival, Slack mention, calendar event
- [ ] **Multi-agent pipelines** — Chain templates (Research -> Content -> Post)
- [ ] **Custom template builder** — Create and sell your own templates on the marketplace

### Phase 4 — Cloud & Teams
- [ ] **Managed cloud hosting** — One-click deploy without Docker. We run the containers, you own the data.
- [ ] **Team workspaces** — Shared agents with role-based access
- [ ] **Audit logging** — Full action trail for compliance
- [ ] **SSO integration** — Enterprise authentication
- [ ] **Template marketplace** — Third-party templates with revenue sharing

---

## Development

```bash
git clone https://github.com/seclaw/seclaw.git
cd seclaw
pnpm install
pnpm dev              # All packages
pnpm dev:web          # Landing page (localhost:8787)
pnpm dev:api          # License API (localhost:8788)
```

### Build

```bash
pnpm build            # Build all packages
pnpm build --filter=cli  # Build CLI only
```

The CLI prebuild compiles `packages/runtime/*.ts` into a single `agent.js` bundle via tsup, then copies it + templates into `packages/cli/dist/`.

---

## License

MIT

---

<p align="center">
  <a href="https://seclawai.com">Website</a> &middot;
  <a href="https://seclawai.com/templates">Templates</a> &middot;
  <a href="https://github.com/seclaw/seclaw">GitHub</a>
</p>

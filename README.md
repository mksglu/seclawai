<p align="center">
  <strong>seclaw</strong>
</p>

<p align="center">
  Agentic AI on your machine. Multiple agents, one Telegram bot.<br />
  Self-hosted. Docker-isolated. Secure by default.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#auto-mode">Auto Mode</a> &middot;
  <a href="#templates">Templates</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#security">Security</a>
</p>

---

```bash
npx seclaw
```

One command. Pick your LLM, enter your Telegram token, choose a template. Agent live in 60 seconds.

---

## Why seclaw?

OpenClaw proved the demand — 68K+ GitHub stars, 600K people watched the tutorial. But it ships with zero container isolation: API keys exposed to every MCP container, your home directory mounted to root-privileged processes, port 5678 open to the internet with no auth.

seclaw fixes both problems. Same autonomous agent capabilities — with Docker-level security enforced at runtime, not in the system prompt. One can be jailbroken. The other can't.

## Quick Start

**Prerequisites:** Docker Desktop, Node.js 20+, an LLM API key ([OpenRouter](https://openrouter.ai/keys) recommended / [Anthropic](https://console.anthropic.com) / [OpenAI](https://platform.openai.com/api-keys) / [Google](https://aistudio.google.com/apikey)), a [Telegram bot token](https://t.me/BotFather).

```bash
npx seclaw
```

The CLI handles everything: LLM provider, API key, Telegram token, Composio integrations, template selection, `docker compose up`. No config files. No YAML. No Docker knowledge required.

```bash
npx seclaw status    # Check all services
npx seclaw doctor    # Auto-diagnose & fix issues
```

---

## Auto Mode

Install multiple agents and they work together automatically. No manual switching — the LLM routes each message to the right capability.

```
You: "Summarize my unread emails and check HN for AI news"

seclaw:
  Inbox: 3 urgent, 7 action needed, 12 FYI.
         Top urgent: contract review from legal (deadline tomorrow).

  Hacker News: Top AI stories — Anthropic launches Claude 4.5,
               Google open-sources Gemma 3, OpenAI restructures.

  — Inbox Management, Research & Intelligence
```

Every response ends with an attribution footer showing which agent(s) answered.

### How it works

1. **Install agents** — `npx seclaw add inbox-agent --key TOKEN`. Each template stacks onto your base agent.
2. **Auto-route** — The LLM picks the right capability for each message. Email questions go to Inbox. Lead questions go to Sales.
3. **Attribution** — Every response shows which agent answered. You always know who did what.

### Focus Mode

Use `/switch` in Telegram to focus on a single agent. Auto mode is the default.

```
/switch              → Show installed agents + Auto mode
/switch sales-agent  → Focus on Sales only
/switch auto         → Back to all agents collaborating
```

### Smart Integration Detection

When an agent needs an integration that isn't connected, it generates an OAuth link directly in chat. No manual setup needed.

```
seclaw: I need X (Twitter) connected to scan for leads.
        Authorize X (Twitter): https://composio.dev/auth/...

        Open the link, sign in, and grant access.
        After completing authorization, your new tools load automatically.
```

The `connect_integration` tool handles this programmatically — the agent calls it when it detects a missing integration, gets the OAuth URL, and shares it with the user.

---

## Templates

17 agent templates. Self-hosted. No subscriptions. Your data stays on your machine.

| Template | Tier | What it does |
|----------|------|-------------|
| **Productivity Agent** | Free | Morning reports, task management, Telegram assistant |
| **Data Analyst** | Free | CSV/JSON analysis, visualizations, automated reports |
| **Inbox Agent** | Pro | Gmail categorization (urgent/action/FYI), Telegram digest |
| **Reddit & HN Digest** | Pro | Daily curated digest from Reddit + Hacker News |
| **YouTube Digest** | Pro | Morning summary of new videos from favorite channels |
| **Health Tracker** | Pro | Food-symptom tracking, weekly correlation analysis |
| **Earnings Tracker** | Pro | Tech/AI earnings reports with beat/miss analysis |
| **Research Agent** | Pro | Multi-source competitor monitoring (X, HN, Reddit, RSS) |
| **Knowledge Base** | Pro | Personal knowledge management from URLs, articles, tweets |
| **Family Calendar** | Pro | Household coordination, calendar aggregation, grocery lists |
| **Content Agent** | Premium | Trending topic research, draft in your voice, post with approval |
| **Personal CRM** | Premium | Contact auto-discovery from email, meeting briefings, follow-ups |
| **YouTube Creator** | Premium | Breaking news scouting, video idea pitches, full outlines |
| **DevOps Agent** | Premium | Health checks every 15min, auto-restart, security audits |
| **Customer Service** | Premium | Gmail inquiry monitoring, KB-backed replies, approval gates |
| **Sales Agent** | Premium | Buying signal detection, lead scoring, outreach drafts |
| **6-Agent Company** | Premium | 6 coordinated agents with standup, memory, self-correction |

All templates work in **Auto Mode** — install multiple and they collaborate. No conflicts, no switching.

### One Token, All Your Templates

When you purchase a template, you get a single token that never expires. Every future purchase is added to the same token — no separate keys, no expiry, re-download anytime.

```bash
# Free templates — no token needed
npx seclaw add productivity-agent

# Paid templates — use your token
npx seclaw add inbox-agent --key YOUR_TOKEN
npx seclaw add research-agent --key YOUR_TOKEN   # same token
npx seclaw capabilities                           # List installed
```

Browse and purchase at [seclawai.com/templates](https://seclawai.com/templates).

---

## Architecture

4 Docker containers, zero inbound ports, full isolation:

```
┌─────────────────────────────────────────────────────────┐
│  YOUR MACHINE                                           │
│                                                         │
│  ┌──────────── agent-net (bridge) ───────────────────┐  │
│  │                                                    │  │
│  │  agent ────> inngest      desktop-commander        │  │
│  │  :3000      :8288         (MCP, sandboxed)         │  │
│  │    │                                               │  │
│  │    └──> cloudflared ──── outbound-only ──> Telegram │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  Volumes: ./shared:/workspace    Inbound: NONE          │
│  Dashboard: localhost:8288       Tunnel: CF outbound     │
└─────────────────────────────────────────────────────────┘
```

| Container | Role |
|-----------|------|
| **agent** | Node.js runtime — Telegram bot, LLM, Composio, MCP client |
| **inngest** | Workflow engine — cron, durable execution, human-in-the-loop |
| **desktop-commander** | MCP server — file I/O + terminal (`read_only`, `cap_drop: ALL`) |
| **cloudflared** | Tunnel — outbound-only, zero open ports |

---

## Security

Every guardrail is enforced at the Docker runtime level — not in the system prompt.

| | OpenClaw | seclaw |
|---|---------|--------|
| Container isolation | None — shared env | Per-container with bridge networks |
| API key protection | All keys in every container | Env-only, sealed per service |
| Filesystem access | Entire home directory | `/workspace` mount only |
| Root privileges | Running as root | Non-root + `cap_drop ALL` |
| Permission enforcement | Prompt-based (bypassable) | Runtime guardrails (`permissions.yml`) |
| Network exposure | Port 5678 open to internet | Zero inbound via CF Tunnel |
| Resource limits | None (infinite) | 512MB / 1 CPU per container |
| Filesystem mutability | Full read/write | `read_only: true` + tmpfs |
| Setup time | 30+ minutes | 60 seconds via CLI |

---

## Built-in Agent Tools

16 tools built into every agent — no MCP dependency, no external services. All available via natural language in Telegram.

### Workspace

Every agent gets a structured workspace at `/workspace`:

```
/workspace
├── memory/       Persistent learnings about you (auto-updated)
├── tasks/        TODOs and action items with priority + due dates
├── notes/        Quick thoughts, ideas, meeting notes, links
├── reports/      Research results, summaries, daily digests
├── drafts/       Draft emails, messages, documents to review
└── config/       Schedules, capabilities, integrations (system-managed)
```

### Workspace Tools

| Tool | What it does |
|------|-------------|
| `update_memory` | Save a learning about the user (name, preferences, habits) |
| `save_note` | Save a note to `notes/` — ideas, links, meeting notes |
| `create_task` | Create a TODO in `tasks/` with priority and optional due date |
| `complete_task` | Mark a task as done |
| `save_report` | Save a report to `reports/` — research, digests, analysis |
| `save_draft` | Save a draft to `drafts/` — emails, messages, documents |
| `list_files` | List files in any workspace directory |
| `read_file` | Read any workspace file |

### Scheduling & Automation Tools

| Tool | What it does |
|------|-------------|
| `send_delayed_message` | Telegram message after a delay (1-3600s) |
| `schedule_action` | Execute any action after a delay with full agent capabilities |
| `request_confirmation` | Approve / Reject buttons, execute only on approval |
| `create_schedule` | Create a new recurring cron schedule |
| `delete_schedule` | Remove a recurring schedule |
| `list_schedules` | List all schedules with status, cron, timezone |
| `toggle_schedule` | Enable/disable a schedule without deleting it |
| `trigger_schedule_now` | Run a scheduled task immediately |

### Integration Tool

| Tool | What it does |
|------|-------------|
| `connect_integration` | Generate OAuth link for a missing integration and share it in chat |

When an agent needs Twitter, Reddit, YouTube, or any other service — it calls `connect_integration`, gets an OAuth URL, and sends it to the user. No manual `/integrations` needed.

---

## Integrations

Powered by [Composio](https://composio.dev) — managed OAuth, zero raw token storage.

Gmail, Google Calendar, Google Drive, Google Sheets, GitHub, Slack, Notion, Linear, Trello, Todoist, Dropbox, WhatsApp, X (Twitter), Reddit, YouTube, Tavily, Hacker News.

```bash
npx seclaw integrations    # CLI: connect/disconnect
/integrations              # Telegram: inline buttons
```

Or let the agent handle it — when a template needs an integration, it calls `connect_integration` and sends you the OAuth link directly.

---

## CLI Reference

```bash
npx seclaw                           # Interactive setup wizard
npx seclaw add <template> --key TOKEN # Download a purchased template
npx seclaw capabilities              # List/remove installed capabilities
npx seclaw integrations              # Connect/disconnect services
npx seclaw status                    # Check services & health
npx seclaw doctor                    # Auto-diagnose & fix issues
npx seclaw stop                      # Stop all containers
npx seclaw upgrade                   # Pull latest images & restart
```

## Telegram Commands

| Command | What it does |
|---------|-------------|
| `/switch` | Show installed agents, switch between Auto and Focus mode |
| `/schedules` | View scheduled tasks, approve/reject pending |
| `/integrations` | Connect/disconnect Composio services |
| `/capabilities` | Show installed capabilities + schedule counts |
| Any message | Agent responds using the right capability automatically |

---

## Running Cost

Your only real cost is the LLM API. Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram, Composio free tier.

| Usage | Model | Monthly |
|-------|-------|---------|
| Light | Gemini 3 Flash (default) | ~$3-6/mo |
| Normal | Gemini 3 Flash | ~$5-15/mo |
| Heavy | Claude Sonnet 4.5 / Opus 4.6 | ~$30-100+/mo |

---

## Development

```bash
git clone https://github.com/seclaw/seclaw.git && cd seclaw
pnpm install          # auto-builds CLI
npx seclaw            # local version, always up-to-date
```

| Package | Port | What |
|---------|------|------|
| `packages/web` | 8787 | Landing page (Hono + JSX + Tailwind) |
| `packages/api` | 8788 | Token API (Hono + D1 + Stripe) |
| `packages/cli` | — | CLI tool (`npx seclaw`) |
| `packages/runtime` | — | Agent source (TypeScript) |
| `packages/templates` | — | Template source (free + paid) |

---

## License

MIT

---

<p align="center">
  <a href="https://seclawai.com">Website</a> &middot;
  <a href="https://seclawai.com/templates">Templates</a> &middot;
  <a href="https://github.com/seclaw/seclaw">GitHub</a>
</p>

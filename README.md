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
  <a href="#pricing">Pricing</a>
</p>

---

```bash
npx seclaw
```

One command. Pick your LLM, enter your Telegram token, choose a template. Your agent is live in 60 seconds.

---

## Why seclaw?

OpenClaw proved the demand — 68K+ GitHub stars, 600K people watched the tutorial. But it ships with zero container isolation: API keys exposed to every MCP container, your home directory mounted to root-privileged processes, port 5678 open to the internet with no auth.

The #1 reply to the viral tweet? *"I couldn't build it myself."*

seclaw fixes both problems. Same autonomous agent capabilities — with Docker-level security enforced at runtime, not in the system prompt. One can be jailbroken. The other can't.

## Quick Start

**Prerequisites:** Docker Desktop, Node.js 20+, an LLM API key ([Anthropic](https://console.anthropic.com) / [OpenAI](https://platform.openai.com/api-keys) / [Google](https://aistudio.google.com/apikey) / [OpenRouter](https://openrouter.ai/keys)), a [Telegram bot token](https://t.me/BotFather).

```bash
npx seclaw
```

The CLI handles everything: LLM provider, API key, Telegram token, Composio integrations, template selection, `docker compose up`. No config files. No YAML. No Docker knowledge required.

```bash
npx seclaw status    # Check all services
npx seclaw doctor    # Auto-diagnose & fix issues
```

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

## Templates

17 agent templates. One-time purchase. Self-hosted. No subscriptions. Your data stays on your machine.

| Template | Price | Who it's for | What it does |
|----------|-------|-------------|-------------|
| **Productivity Agent** | Free | Founders | Morning reports, task management, Telegram assistant |
| **Data Analyst** | Free | Analysts | CSV/JSON analysis, visualizations, automated reports |
| **Inbox Agent** | $19 | Everyone | Gmail categorization (urgent/action/FYI), Telegram digest |
| **Reddit & HN Digest** | $19 | Developers | Daily curated digest from Reddit + Hacker News |
| **YouTube Digest** | $19 | Everyone | Morning summary of new videos from favorite channels |
| **Health Tracker** | $29 | Health-conscious | Food-symptom tracking, weekly correlation analysis |
| **Earnings Tracker** | $29 | Investors | Tech/AI earnings reports with beat/miss analysis |
| **Research Agent** | $39 | Product Teams | Multi-source competitor monitoring (X, HN, Reddit, RSS) |
| **Knowledge Base** | $39 | Researchers | Personal knowledge management from URLs, articles, tweets |
| **Family Calendar** | $39 | Families | Household coordination, calendar aggregation, grocery lists |
| **Content Agent** | $49 | Creators | Trending topic research, draft in your voice, post with approval |
| **Personal CRM** | $49 | Networkers | Contact auto-discovery from email, meeting briefings, follow-ups |
| **YouTube Creator** | $69 | YouTubers | Breaking news scouting, video idea pitches, full outlines |
| **DevOps Agent** | $79 | Engineers | Health checks every 15min, auto-restart, security audits |
| **Customer Service** | $79 | Businesses | Gmail inquiry monitoring, KB-backed replies, approval gates |
| **Sales Agent** | $79 | Sales Teams | Buying signal detection, lead scoring, outreach drafts |
| **6-Agent Company** | $149 | AI Enthusiasts | 6 coordinated agents with standup, memory, self-correction |

### Capability Stacking

Templates are capabilities, not personality swaps. Install multiple templates on a single agent — one Docker instance, one personality, shared memory:

```bash
npx seclaw add inbox-agent --key KEY1
npx seclaw add research-agent --key KEY2
npx seclaw capabilities               # List installed capabilities
```

Schedules from all capabilities merge automatically. The agent knows which capability handles which task.

### Buying & Activating

```bash
# 1. Purchase at https://seclawai.com/templates
# 2. Activate:
npx seclaw add content-agent --key YOUR_LICENSE_KEY
# 3. Done — scheduled tasks start automatically
```

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

8 tools for scheduling, reminders, and human-in-the-loop — all via natural language in Telegram:

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

---

## Integrations

Powered by [Composio](https://composio.dev) — managed OAuth, zero raw token storage.

Gmail, Google Calendar, Google Drive, Google Sheets, GitHub, Slack, Notion, Linear, Trello, Todoist, Dropbox, WhatsApp.

```bash
npx seclaw integrations    # CLI: connect/disconnect
/integrations              # Telegram: inline buttons
```

---

## Pricing

### Templates: One-Time Purchase

| Tier | Price | Templates |
|------|-------|-----------|
| Free | $0 | Productivity Agent, Data Analyst |
| Entry | $19 | Inbox, Reddit & HN Digest, YouTube Digest |
| Mid | $29-49 | Health Tracker, Earnings Tracker, Research, Knowledge Base, Family Calendar, Content, Personal CRM |
| Pro | $69-149 | YouTube Creator, DevOps, Customer Service, Sales, 6-Agent Company |

### Running Cost: LLM API Only

Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram, Composio free tier.

| Usage | Model | Monthly |
|-------|-------|---------|
| Light | Haiku 4.5 | ~$6/mo |
| Normal | Smart routing (Haiku + Sonnet) | ~$15-30/mo |
| Heavy | Opus 4.6 | ~$100+/mo |

---

## CLI Reference

```bash
npx seclaw                           # Interactive setup wizard
npx seclaw add <template> --key KEY  # Activate a paid template
npx seclaw templates                 # List all available templates
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
| `/schedules` | View scheduled tasks, approve/reject pending |
| `/integrations` | Connect/disconnect Composio services |
| `/capabilities` | Show installed capabilities + schedule counts |
| Any message | Agent responds with LLM + tools |

---

## Development

```bash
git clone https://github.com/seclaw/seclaw.git && cd seclaw
pnpm install && pnpm dev
```

| Package | Port | What |
|---------|------|------|
| `packages/web` | 8787 | Landing page (Hono + JSX + Tailwind) |
| `packages/api` | 8788 | License API (Hono + D1 + Stripe) |
| `packages/cli` | — | CLI tool (`npx seclaw`) |
| `packages/runtime` | — | Agent source (TypeScript → agent.js) |

---

## License

MIT

---

<p align="center">
  <a href="https://seclawai.com">Website</a> &middot;
  <a href="https://seclawai.com/templates">Templates</a> &middot;
  <a href="https://github.com/seclaw/seclaw">GitHub</a>
</p>

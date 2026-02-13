export function Docs() {
  return (
    <div>
      <nav class="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div class="flex items-center gap-6">
            <a href="/" class="text-sm text-neutral-400 transition hover:text-white">Home</a>
            <a href="/templates" class="text-sm text-neutral-400 transition hover:text-white">Templates</a>
          </div>
        </div>
      </nav>

      <section class="px-6 pt-32 pb-24 lg:px-8">
        <div class="mx-auto max-w-3xl">
          <h1 class="text-3xl font-bold text-white">Documentation</h1>

          <div class="prose-invert mt-12 space-y-12">
            {/* Quick Start */}
            <div>
              <h2 class="text-xl font-semibold text-white">Quick Start</h2>
              <div class="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm">
                <p class="text-neutral-500">
                  # Install and run in 60 seconds
                </p>
                <p class="text-green-400">npx seclaw</p>
              </div>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                The CLI will guide you through setup: LLM provider, API key, Telegram
                bot token, Cloudflare Tunnel (optional), Composio integrations, and template selection.
              </p>
            </div>

            {/* Prerequisites */}
            <div>
              <h2 class="text-xl font-semibold text-white">Prerequisites</h2>
              <ul class="mt-4 space-y-2 text-sm text-neutral-400">
                <li class="flex items-start gap-2">
                  <span class="text-green-400">&#10003;</span>
                  Docker Desktop (or Docker Engine on Linux)
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-400">&#10003;</span>
                  Node.js 20+
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-400">&#10003;</span>
                  LLM API key from{" "}
                  <a href="https://console.anthropic.com" class="text-green-400 underline" target="_blank">
                    Anthropic
                  </a>
                  ,{" "}
                  <a href="https://platform.openai.com/api-keys" class="text-green-400 underline" target="_blank">
                    OpenAI
                  </a>
                  ,{" "}
                  <a href="https://aistudio.google.com/apikey" class="text-green-400 underline" target="_blank">
                    Google
                  </a>
                  , or{" "}
                  <a href="https://openrouter.ai/keys" class="text-green-400 underline" target="_blank">
                    OpenRouter
                  </a>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-400">&#10003;</span>
                  Telegram bot token from{" "}
                  <a href="https://t.me/BotFather" class="text-green-400 underline" target="_blank">
                    @BotFather
                  </a>
                </li>
              </ul>
            </div>

            {/* Architecture */}
            <div>
              <h2 class="text-xl font-semibold text-white">Architecture</h2>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                seclaw deploys 4 Docker containers on your machine:
              </p>
              <div class="mt-4 space-y-2 text-sm text-neutral-400">
                <div class="flex items-start gap-2">
                  <span class="text-green-400 font-semibold">agent</span>
                  <span>— Node.js runtime with Telegram bot, LLM calls, Composio integrations, and MCP client</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-green-400 font-semibold">inngest</span>
                  <span>— Self-hosted workflow engine for scheduled tasks, durable execution, human-in-the-loop</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-yellow-400 font-semibold">desktop-commander</span>
                  <span>— MCP server for file I/O + terminal access (sandboxed: read_only, cap_drop ALL)</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-blue-400 font-semibold">cloudflared</span>
                  <span>— Cloudflare Tunnel, outbound-only, zero inbound ports</span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 class="text-xl font-semibold text-white">Security Model</h2>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                Every container runs with maximum isolation:
              </p>
              <ul class="mt-4 space-y-2 text-sm text-neutral-400">
                <li>
                  <code class="text-green-400">read_only: true</code> — filesystem is immutable
                </li>
                <li>
                  <code class="text-green-400">no-new-privileges</code> — cannot escalate permissions
                </li>
                <li>
                  <code class="text-green-400">cap_drop: ALL</code> — zero Linux capabilities
                </li>
                <li>
                  <code class="text-green-400">memory: 512M</code> — resource limits enforced
                </li>
                <li>
                  API keys are <strong class="text-white">only in the agent's env</strong> — MCP servers cannot see them
                </li>
                <li>
                  Sensitive actions require <strong class="text-white">Telegram approval</strong> — human-in-the-loop via Inngest
                </li>
              </ul>
            </div>

            {/* Inngest Dashboard */}
            <div>
              <h2 class="text-xl font-semibold text-white">Inngest Dashboard</h2>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                Every deployment includes the Inngest Dev Server with a built-in dashboard at{" "}
                <code class="text-green-400">http://localhost:8288</code>. View registered functions,
                execution history, failed runs, pending human-in-the-loop events, and live event streams.
                Self-hosted, free forever, no execution limits.
              </p>
            </div>

            {/* CLI Commands */}
            <div>
              <h2 class="text-xl font-semibold text-white">CLI Commands</h2>
              <div class="mt-4 space-y-3 font-mono text-sm">
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">npx seclaw</span>
                  <span class="text-neutral-500"> — Full interactive setup</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw add content-agent --key KEY
                  </span>
                  <span class="text-neutral-500"> — Add/switch template</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw templates
                  </span>
                  <span class="text-neutral-500"> — List all templates</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw integrations
                  </span>
                  <span class="text-neutral-500"> — Connect/disconnect Composio services</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw status
                  </span>
                  <span class="text-neutral-500"> — Check services & health</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw doctor
                  </span>
                  <span class="text-neutral-500"> — Auto-diagnose & fix issues</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw stop
                  </span>
                  <span class="text-neutral-500"> — Stop all containers</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">
                    npx seclaw upgrade
                  </span>
                  <span class="text-neutral-500"> — Pull latest images & restart</span>
                </div>
              </div>
            </div>

            {/* Telegram Commands */}
            <div>
              <h2 class="text-xl font-semibold text-white">Telegram Commands</h2>
              <div class="mt-4 space-y-3 font-mono text-sm">
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">/schedules</span>
                  <span class="text-neutral-500"> — View scheduled tasks, approve/reject pending actions</span>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <span class="text-green-400">/integrations</span>
                  <span class="text-neutral-500"> — Connect/disconnect Composio services</span>
                </div>
              </div>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                Any other message is processed by the agent using your configured LLM with full tool access.
              </p>
            </div>

            {/* Built-in Agent Tools */}
            <div>
              <h2 class="text-xl font-semibold text-white">Built-in Agent Tools</h2>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                8 built-in tools for scheduling, reminders, and human-in-the-loop workflows powered by Inngest.
                These work alongside Composio integrations and Desktop Commander — no setup required.
              </p>
              <div class="mt-6 space-y-3 text-sm">
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">send_delayed_message</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">delay</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Send a Telegram message after a delay (1-3600s)</p>
                  <p class="mt-1 text-neutral-600 italic">"remind me in 10 minutes to check the server health dashboard"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">schedule_action</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">delay + agent</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Execute any action after a delay with full agent capabilities (file I/O, APIs, LLM)</p>
                  <p class="mt-1 text-neutral-600 italic">"in 30 seconds, fetch today's YouTube uploads from my channels and create a digest"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">request_confirmation</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">HITL</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Send Approve / Reject buttons. Executes action only on approval.</p>
                  <p class="mt-1 text-neutral-600 italic">"draft an outreach email to the lead, but ask me before sending"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">create_schedule</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">cron</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Create a new recurring cron schedule with LLM prompt</p>
                  <p class="mt-1 text-neutral-600 italic">"every morning at 9am, summarize my unread newsletters and send me a digest"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">delete_schedule</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">cron</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Remove a recurring schedule permanently</p>
                  <p class="mt-1 text-neutral-600 italic">"stop the earnings tracker alerts"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">list_schedules</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">cron</span>
                  </div>
                  <p class="mt-1 text-neutral-400">List all configured schedules with status, cron, and timezone</p>
                  <p class="mt-1 text-neutral-600 italic">"show me all my active cron jobs"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">toggle_schedule</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">cron</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Enable or disable a schedule without deleting it</p>
                  <p class="mt-1 text-neutral-600 italic">"pause the daily Reddit digest for this week"</p>
                </div>
                <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div class="flex items-center gap-2">
                    <code class="text-green-400">trigger_schedule_now</code>
                    <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">cron</span>
                  </div>
                  <p class="mt-1 text-neutral-400">Run a scheduled task immediately instead of waiting for the next cron tick</p>
                  <p class="mt-1 text-neutral-600 italic">"run the inbox declutter right now"</p>
                </div>
              </div>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                All tools are available via natural language — the agent picks the right tool based on your message.
                Schedules are persisted in{" "}
                <code class="text-green-400">/workspace/config/schedules.json</code> and powered by Inngest cron functions.
              </p>
            </div>

            {/* Adding Templates */}
            <div>
              <h2 class="text-xl font-semibold text-white">
                Adding Paid Templates
              </h2>
              <ol class="mt-4 list-inside list-decimal space-y-2 text-sm text-neutral-400">
                <li>
                  Purchase a template at{" "}
                  <a href="/templates" class="text-green-400 underline">
                    /templates
                  </a>
                </li>
                <li>Receive your license key via email</li>
                <li>
                  Run:{" "}
                  <code class="text-green-400">
                    npx seclaw add template-name --key YOUR_KEY
                  </code>
                </li>
                <li>Template is installed — system prompt, schedules, and integrations update automatically</li>
              </ol>
            </div>

            {/* Integrations */}
            <div>
              <h2 class="text-xl font-semibold text-white">Composio Integrations</h2>
              <p class="mt-4 text-sm leading-6 text-neutral-400">
                12 services available via managed OAuth: Gmail, Google Calendar, Google Drive,
                Google Sheets, GitHub, Slack, Notion, Linear, Trello, Todoist, Dropbox, WhatsApp.
                Each template recommends specific integrations, but you can connect any service to any template.
              </p>
              <p class="mt-3 text-sm leading-6 text-neutral-400">
                Your agent never stores raw OAuth tokens — Composio manages token refresh and API auth.
                Connect via browser OAuth, disconnect instantly via CLI or Telegram.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Architecture() {
  const stackItems = [
    {
      name: "Agent Runtime",
      role: "Node.js",
      description:
        "Lightweight Node.js server with Telegram Bot API, OpenAI SDK (multi-provider), and Composio for integrations. No framework overhead — just a single agent.js handling webhooks, LLM calls, and tool execution.",
      highlight: true,
    },
    {
      name: "Inngest",
      role: "Scheduler",
      description:
        "Self-hosted workflow engine for scheduled tasks. Cron with timezone support, step-level retries, and human-in-the-loop approvals via Telegram. Dashboard at localhost:8288. Free forever.",
      highlight: true,
    },
    {
      name: "Gemini 3 Flash",
      role: "LLM",
      description:
        "Default: Gemini 3 Flash via OpenRouter — fast, affordable, excellent tool use. Or switch to Claude, GPT-4o, Gemini Pro, and 100+ other models. One env variable change.",
      highlight: false,
    },
    {
      name: "Desktop Commander",
      role: "MCP Server",
      description:
        "Gives your agent file read/write and terminal access — inside a locked-down container. read_only filesystem, zero Linux capabilities, 512MB limit. The agent can work, but can't escape.",
      highlight: false,
    },
    {
      name: "Composio",
      role: "Integrations",
      description:
        "Managed OAuth for Gmail, Google Calendar, GitHub, Slack, Notion, Linear, and more. Your agent never sees raw credentials — Composio handles token refresh and API auth.",
      highlight: false,
    },
    {
      name: "Cloudflare Tunnel",
      role: "Secure Access",
      description:
        "Access your agent from anywhere — phone, laptop, any device. Outbound-only connection: zero inbound ports. No firewall rules. No exposed IPs. Auto-created by CLI in 30 seconds.",
      highlight: false,
    },
  ];

  return (
    <section className="border-y border-neutral-800 bg-neutral-900/30 px-6 py-24 lg:px-8" id="architecture">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          How it works
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          The stack behind <span className="text-green-400">seclaw</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          Every component is open source. Every container is isolated. Your data never leaves your machine.
        </p>

        {/* Architecture diagram */}
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 p-6 font-mono text-sm">
          <p className="text-neutral-500">{"# Your machine"}</p>
          <div className="mt-4 rounded-lg border border-neutral-700 p-4">
            <p className="text-neutral-400">agent-net <span className="text-neutral-600">(internal network)</span></p>
            <div className="mt-3 grid gap-2">
              <div className="flex items-center gap-3 rounded-md bg-green-500/5 border border-green-500/20 px-3 py-2">
                <span className="text-green-400">agent</span>
                <span className="text-neutral-500">— Telegram + LLM + Composio + MCP Client</span>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-green-500/5 border border-green-500/20 px-3 py-2">
                <span className="text-green-400">inngest</span>
                <span className="text-neutral-500">— cron schedules, retries, human-in-the-loop</span>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-neutral-800 px-3 py-2">
                <span className="text-yellow-400">desktop-commander</span>
                <span className="text-neutral-500">— MCP, read_only, cap_drop ALL</span>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-blue-500/5 border border-blue-500/20 px-3 py-2">
                <span className="text-blue-400">cloudflared</span>
                <span className="text-neutral-500">— outbound-only tunnel, zero open ports</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-neutral-600">
            <span>{"--->"}</span>
            <span>Telegram</span>
            <span className="text-green-400">(via Cloudflare Tunnel)</span>
          </div>
        </div>

        {/* Stack cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stackItems.map((item) => (
            <div
              key={item.name}
              className={
                item.highlight
                  ? "rounded-xl border border-green-500/20 bg-green-500/5 p-6"
                  : "rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
              }
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
                  {item.role}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Inngest detail */}
        <div className="mt-16 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h3 className="text-lg font-semibold text-white">
            Why Inngest for scheduling?
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-green-400">Self-hosted, free forever</p>
              <p className="mt-1 text-sm text-neutral-400">
                No cloud fees, no execution limits. Runs as a single Docker container with SQLite storage. Dashboard included.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Human-in-the-loop</p>
              <p className="mt-1 text-sm text-neutral-400">
                Scheduled actions can pause and wait for your Telegram approval before executing. Approve or reject with one tap.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Durable execution</p>
              <p className="mt-1 text-sm text-neutral-400">
                Each step retries independently. If the LLM call fails, it retries without re-fetching data. No lost work.
              </p>
            </div>
          </div>
        </div>

        {/* CF Tunnel detail */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h3 className="text-lg font-semibold text-white">
            Zero inbound ports with Cloudflare Tunnel
          </h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-red-400">Without tunnel</p>
              <p className="mt-1 text-sm text-neutral-400">
                Port 3000 open to the internet. Anyone who finds your IP can send requests to your agent.
                Port scanning bots find these in hours.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">With Cloudflare Tunnel</p>
              <p className="mt-1 text-sm text-neutral-400">
                Zero open ports. Your server makes an outbound connection to Cloudflare's edge.
                Access via your custom domain with Cloudflare Access for authentication. Auto-created by our CLI in 30 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

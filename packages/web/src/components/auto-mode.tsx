const agents = [
  { id: "inbox-agent", name: "Inbox", hint: "email triage", icon: "I" },
  { id: "research-agent", name: "Research", hint: "competitor intel", icon: "R" },
  { id: "sales-agent", name: "Sales", hint: "lead gen", icon: "S" },
  { id: "reddit-hn-digest", name: "Reddit & HN", hint: "tech digest", icon: "H" },
  { id: "content-agent", name: "Content", hint: "posts & drafts", icon: "C" },
  { id: "earnings-tracker", name: "Earnings", hint: "financial reports", icon: "E" },
];

export function AutoMode() {
  return (
    <section className="px-6 py-24 lg:px-8" id="auto-mode">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          Auto Mode
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          All your agents work together.{" "}
          <span className="text-green-400">Automatically.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          Install multiple agents and they collaborate as one. No manual switching.
          The right agent handles each request — and tells you which one answered.
        </p>

        {/* Visual: Multi-agent flow */}
        <div className="mt-16 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-neutral-500">Telegram</span>
          </div>
          <div className="space-y-0 divide-y divide-neutral-800/50">
            {/* Message 1 */}
            <div className="p-5">
              <p className="text-xs text-neutral-500 mb-2">You</p>
              <p className="text-sm text-white">Summarize my unread emails and check HN for AI news</p>
            </div>
            {/* Agent response */}
            <div className="bg-neutral-900/30 p-5">
              <p className="text-xs text-neutral-500 mb-2">seclaw</p>
              <div className="space-y-3 text-sm text-neutral-300">
                <div>
                  <p className="font-medium text-white">Inbox</p>
                  <p className="text-neutral-400">3 urgent, 7 action needed, 12 FYI. Top urgent: contract review from legal (deadline tomorrow).</p>
                </div>
                <div className="border-t border-neutral-800 pt-3">
                  <p className="font-medium text-white">Hacker News</p>
                  <p className="text-neutral-400">Top AI stories: Anthropic launches Claude 4.5, Google open-sources Gemma 3, OpenAI restructures.</p>
                </div>
              </div>
              <p className="mt-4 text-xs italic text-neutral-600">— Inbox Management, Research & Intelligence</p>
            </div>
            {/* Message 2 */}
            <div className="p-5">
              <p className="text-xs text-neutral-500 mb-2">You</p>
              <p className="text-sm text-white">Any new leads from that Anthropic announcement?</p>
            </div>
            {/* Agent response 2 */}
            <div className="bg-neutral-900/30 p-5">
              <p className="text-xs text-neutral-500 mb-2">seclaw</p>
              <p className="text-sm text-neutral-400">
                Scanning X for buying signals around "Claude 4.5"... Found 3 leads scoring 8+. Drafts saved to /shared/outreach/drafts/.
              </p>
              <p className="mt-3 text-xs italic text-neutral-600">— Sales & Lead Generation</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 font-mono text-xs font-bold text-green-400">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">Install agents</h3>
            <p className="mt-2 text-xs text-neutral-400">
              <code className="text-green-400">npx seclaw add inbox-agent</code>
              <br />
              Each template stacks onto your base agent. No conflicts.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 font-mono text-xs font-bold text-green-400">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">Auto-route</h3>
            <p className="mt-2 text-xs text-neutral-400">
              The LLM picks the right capability for each message. Email questions go to Inbox. Lead questions go to Sales.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 font-mono text-xs font-bold text-green-400">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">Attribution</h3>
            <p className="mt-2 text-xs text-neutral-400">
              Every response shows which agent answered. You always know who did what.
            </p>
          </div>
        </div>

        {/* /switch command */}
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Optional: Focus Mode</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Use <code className="text-green-400">/templates</code> in Telegram to focus on a single agent. Auto mode is the default.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                Auto (all)
              </span>
              {agents.slice(0, 3).map((a) => (
                <span key={a.id} className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Missing integration: connect_integration */}
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h3 className="text-sm font-semibold text-white">Smart integration detection</h3>
          <p className="mt-1 text-xs text-neutral-400">
            When an agent needs an integration that isn't connected, it generates an OAuth link and sends it directly in chat.
            No manual setup. No <code className="text-neutral-500">/integrations</code> command needed.
          </p>
          <div className="mt-4 rounded-lg bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500 mb-1">seclaw</p>
            <p className="text-xs text-neutral-300">
              I need X (Twitter) connected to scan for leads.{" "}
              <span className="text-blue-400 underline">Authorize X (Twitter)</span>
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Open the link, sign in, and grant access. After completing authorization, your new tools load automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Integrations() {
  return (
    <section className="px-6 py-24 lg:px-8" id="integrations">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          Powered by Composio
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          250+ integrations. Zero credential management.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          Gmail, Google Calendar, GitHub, Slack, Notion, Linear, Trello, Dropbox, WhatsApp, and more —
          all via managed OAuth. No raw API keys, no token files.
        </p>

        {/* Single card: steps + benefits */}
        <div className="mt-16 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
          {/* Three steps */}
          <div className="grid gap-0 border-b border-neutral-800 sm:grid-cols-3">
            <div className="border-b border-neutral-800 p-6 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-green-400">01</span>
                <span className="text-sm font-semibold text-white">Connect</span>
              </div>
              <div className="mt-3 rounded-md bg-neutral-950 px-3 py-2">
                <code className="text-xs text-green-400">npx seclaw integrations</code>
              </div>
              <p className="mt-2 text-xs text-neutral-500">OAuth in your browser. No raw API keys.</p>
            </div>
            <div className="border-b border-neutral-800 p-6 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-green-400">02</span>
                <span className="text-sm font-semibold text-white">Authorize</span>
              </div>
              <div className="mt-3 rounded-md bg-neutral-950 px-3 py-2">
                <code className="text-xs text-green-400"># Composio handles OAuth</code>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Scoped permissions. Automatic token refresh.</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-green-400">03</span>
                <span className="text-sm font-semibold text-white">Use</span>
              </div>
              <div className="mt-3 rounded-md bg-neutral-950 px-3 py-2">
                <code className="text-xs text-green-400">"Summarize my unread emails"</code>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Agent auto-discovers tools. Just ask in Telegram.</p>
            </div>
          </div>

          {/* Key benefits */}
          <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
            <div className="border-b border-r border-neutral-800 p-5 sm:border-b-0">
              <p className="text-xs font-medium text-green-400">Managed OAuth</p>
              <p className="mt-1 text-xs text-neutral-500">Tokens never touch your machine</p>
            </div>
            <div className="border-b border-neutral-800 p-5 sm:border-b-0 sm:border-r">
              <p className="text-xs font-medium text-green-400">Auto refresh</p>
              <p className="mt-1 text-xs text-neutral-500">Zero credential maintenance</p>
            </div>
            <div className="border-r border-neutral-800 p-5">
              <p className="text-xs font-medium text-green-400">Scoped access</p>
              <p className="mt-1 text-xs text-neutral-500">Per-integration permissions</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-green-400">Hot reload</p>
              <p className="mt-1 text-xs text-neutral-500">Add integrations without restart</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

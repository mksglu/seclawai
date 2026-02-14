const workspaceDirs = [
  {
    name: "memory/",
    description: "Persistent learnings about you — name, preferences, habits, language",
    tool: "update_memory",
    icon: "\u{1F9E0}",
  },
  {
    name: "tasks/",
    description: "TODOs and action items with priority levels and due dates",
    tool: "create_task",
    icon: "\u2705",
  },
  {
    name: "notes/",
    description: "Quick thoughts, ideas, meeting notes, links",
    tool: "save_note",
    icon: "\u{1F4DD}",
  },
  {
    name: "reports/",
    description: "Research results, daily digests, analysis summaries",
    tool: "save_report",
    icon: "\u{1F4CA}",
  },
  {
    name: "drafts/",
    description: "Draft emails, messages, and documents to review before sending",
    tool: "save_draft",
    icon: "\u{1F4E8}",
  },
];

const schedulingTools = [
  {
    name: "send_delayed_message",
    description: "Send a Telegram message after a delay",
  },
  {
    name: "schedule_action",
    description: "Execute any action after a delay with full agent capabilities",
  },
  {
    name: "request_confirmation",
    description: "Approve / Reject buttons with human-in-the-loop execution",
  },
  {
    name: "create_schedule",
    description: "Create a new recurring cron schedule",
  },
  {
    name: "toggle_schedule",
    description: "Enable or disable a schedule without deleting",
  },
  {
    name: "trigger_schedule_now",
    description: "Manually run a scheduled task right now",
  },
  {
    name: "connect_integration",
    description: "Generate OAuth link for a missing integration and share it in chat",
  },
];

export function BuiltInTools() {
  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          Built-in tools
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          16 tools, <span className="text-green-400">zero config</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          Every agent ships with workspace management, scheduling, human-in-the-loop, and smart integration detection.
          No MCP required. No external services. Just tell your agent what to do.
        </p>

        {/* Workspace */}
        <div className="mt-16">
          <h3 className="text-lg font-semibold text-white">
            Structured workspace
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            Every agent gets a persistent workspace at <code className="text-green-400">/workspace</code>.
            Data persists across restarts and conversations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceDirs.map((dir) => (
              <div key={dir.name} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{dir.icon}</span>
                  <code className="text-sm font-semibold text-green-400">{dir.name}</code>
                </div>
                <p className="mt-2 text-sm text-neutral-400">{dir.description}</p>
                <p className="mt-3 text-xs text-neutral-600">
                  tool: <code className="text-neutral-500">{dir.tool}</code>
                </p>
              </div>
            ))}

            {/* Config special card */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
              <div className="flex items-center gap-3">
                <span className="text-lg">{"\u2699\uFE0F"}</span>
                <code className="text-sm font-semibold text-neutral-500">config/</code>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Schedules, capability settings, and system configuration. Managed automatically.
              </p>
              <p className="mt-3 text-xs text-neutral-600">
                system-managed
              </p>
            </div>
          </div>
        </div>

        {/* Terminal-style workspace preview */}
        <div className="mt-8 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500/80"></span>
            <span className="h-3 w-3 rounded-full bg-green-500/80"></span>
            <span className="ml-3 text-xs text-neutral-500">workspace</span>
          </div>
          <pre className="p-5 text-sm leading-6">
            <code>
              <span className="text-neutral-500">$ ls /workspace</span>{"\n"}
              <span className="text-green-400">memory/</span>{"   "}
              <span className="text-green-400">tasks/</span>{"    "}
              <span className="text-green-400">notes/</span>{"    "}
              <span className="text-green-400">reports/</span>{"  "}
              <span className="text-green-400">drafts/</span>{"  "}
              <span className="text-neutral-600">config/</span>{"\n\n"}
              <span className="text-neutral-500">$ cat memory/learnings.md</span>{"\n"}
              <span className="text-neutral-400">- [2026-02-13] User prefers Turkish</span>{"\n"}
              <span className="text-neutral-400">- [2026-02-13] User name is Mert</span>{"\n"}
              <span className="text-neutral-400">- [2026-02-14] Morning reports should include calendar</span>{"\n\n"}
              <span className="text-neutral-500">$ ls tasks/</span>{"\n"}
              <span className="text-neutral-400">review-contract.md  prepare-demo.md  update-docs.md</span>
            </code>
          </pre>
        </div>

        {/* Scheduling & Automation tools */}
        <div className="mt-16">
          <h3 className="text-lg font-semibold text-white">
            Scheduling & automation
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            Reminders, delayed actions, recurring schedules, and human-in-the-loop confirmations.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900">
                <tr>
                  <th className="px-6 py-4 font-medium text-neutral-400">Tool</th>
                  <th className="px-6 py-4 font-medium text-neutral-400">What it does</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {schedulingTools.map((tool) => (
                  <tr key={tool.name} className="hover:bg-neutral-900/50">
                    <td className="px-6 py-3">
                      <code className="text-sm text-green-400">{tool.name}</code>
                    </td>
                    <td className="px-6 py-3 text-neutral-400">{tool.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Browse + Read */}
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <code className="text-sm font-semibold text-green-400">list_files</code>
              <p className="mt-2 text-sm text-neutral-400">
                List files in any workspace directory. "Show me my tasks" returns all open TODOs.
              </p>
            </div>
            <div>
              <code className="text-sm font-semibold text-green-400">read_file</code>
              <p className="mt-2 text-sm text-neutral-400">
                Read any workspace file. "Read my latest report" opens the most recent analysis.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-500/10 px-4 py-3">
            <p className="text-xs text-green-400/80">
              All tools use direct filesystem access — no Desktop Commander MCP dependency.
              They work even if external services are completely offline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

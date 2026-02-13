export function Security() {
  const guardrails = [
    {
      title: "Can't access your API keys",
      detail: "Keys live in the agent's env only. MCP containers have zero access to secrets.",
      tech: "env isolation per container",
    },
    {
      title: "Can't modify its environment",
      detail: "Filesystem is immutable. The agent can't install backdoors or modify its own code.",
      tech: "read_only: true",
    },
    {
      title: "Can't access folders you haven't shared",
      detail: "Only the /workspace mount is visible. Your home directory, SSH keys, and browser data are invisible.",
      tech: "explicit volume mounts only",
    },
    {
      title: "Can't escalate privileges",
      detail: "Zero Linux capabilities. Can't become root, can't mount filesystems, can't access raw network.",
      tech: "cap_drop: ALL + no-new-privileges",
    },
    {
      title: "Can't use unlimited resources",
      detail: "512MB RAM, 1 CPU core. A runaway agent or cryptominer gets killed, not your machine.",
      tech: "deploy.resources.limits",
    },
    {
      title: "Must get your confirmation",
      detail: "Sending emails, posting on social media, deleting files — all require explicit approval via Telegram.",
      tech: "permissions.yml whitelist",
    },
  ];

  const capabilities = [
    "Reply to your Telegram messages",
    "Read and write to /workspace files",
    "Access Gmail, Drive, Notion, Linear via Composio",
    "Run scheduled tasks via Inngest (cron + timezone)",
    "Pause and wait for your Telegram approval (HITL)",
    "Execute terminal commands (sandboxed)",
    "Learn from past interactions (memory buffer)",
    "Wake up regularly and do overnight work",
  ];

  const comparison = [
    { feature: "Container isolation", openclaw: "None — shared env", ours: "Per-container with bridge networks" },
    { feature: "API key protection", openclaw: "All keys in every container", ours: "Env-only, sealed per service" },
    { feature: "Filesystem access", openclaw: "Entire home directory", ours: "/workspace mount only" },
    { feature: "Root privileges", openclaw: "Running as root", ours: "Non-root + cap_drop ALL" },
    { feature: "Permission enforcement", openclaw: "Prompt-based (bypassable)", ours: "Runtime guardrails (permissions.yml)" },
    { feature: "Network exposure", openclaw: "Port 5678 open to internet", ours: "Zero inbound via CF Tunnel" },
    { feature: "Resource limits", openclaw: "None (infinite)", ours: "512MB / 1 CPU per container" },
    { feature: "Filesystem mutability", openclaw: "Full read/write", ours: "read_only: true + tmpfs" },
    { feature: "Setup time", openclaw: "30+ minutes manual config", ours: "60 seconds via CLI" },
  ];

  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          Security model
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Hard guardrails, <span className="text-green-400">not suggestions</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          OpenClaw enforces rules in the system prompt. We enforce them in Docker.
          One can be jailbroken. The other can't.
        </p>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Can't do */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8">
            <h3 className="text-lg font-semibold text-red-400">
              Your agent can't:
            </h3>
            <ul className="mt-4 space-y-4">
              {guardrails.map((item) => (
                <li>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-red-400">&#10005;</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{item.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{item.detail}</p>
                      <code className="mt-1 inline-block text-xs text-red-400/60">{item.tech}</code>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Can do */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8">
            <h3 className="text-lg font-semibold text-green-400">
              But it can still:
            </h3>
            <ul className="mt-4 space-y-3">
              {capabilities.map((item) => (
                <li className="flex items-start gap-3 text-neutral-300">
                  <span className="mt-0.5 text-green-400">&#10003;</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg bg-green-500/10 px-4 py-3">
              <p className="text-xs text-green-400/80">
                The goal: maximum capability within minimum attack surface.
                Your agent does real work — it just can't escape its sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-16">
          <h3 className="text-center text-xl font-semibold text-white">
            Side-by-side comparison
          </h3>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Every row is a real security boundary. Green means it exists. Red means it doesn't.
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900">
                <tr>
                  <th className="px-6 py-4 font-medium text-neutral-400">Security Boundary</th>
                  <th className="px-6 py-4 font-medium text-red-400">OpenClaw</th>
                  <th className="px-6 py-4 font-medium text-green-400">seclaw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {comparison.map((row) => (
                  <tr className="hover:bg-neutral-900/50">
                    <td className="px-6 py-3 text-white">{row.feature}</td>
                    <td className="px-6 py-3 text-sm text-red-400/80">{row.openclaw}</td>
                    <td className="px-6 py-3 text-sm text-green-400">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

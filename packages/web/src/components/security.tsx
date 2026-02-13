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
    <section class="px-6 py-24 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <p class="text-center text-sm font-medium uppercase tracking-wider text-green-400">
          Security model
        </p>
        <h2 class="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Hard guardrails, <span class="text-green-400">not suggestions</span>
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          OpenClaw enforces rules in the system prompt. We enforce them in Docker.
          One can be jailbroken. The other can't.
        </p>

        <div class="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Can't do */}
          <div class="rounded-xl border border-red-500/20 bg-red-500/5 p-8">
            <h3 class="text-lg font-semibold text-red-400">
              Your agent can't:
            </h3>
            <ul class="mt-4 space-y-4">
              {guardrails.map((item) => (
                <li>
                  <div class="flex items-start gap-3">
                    <span class="mt-0.5 text-red-400">&#10005;</span>
                    <div>
                      <p class="text-sm font-medium text-neutral-200">{item.title}</p>
                      <p class="mt-0.5 text-xs text-neutral-500">{item.detail}</p>
                      <code class="mt-1 inline-block text-xs text-red-400/60">{item.tech}</code>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Can do */}
          <div class="rounded-xl border border-green-500/20 bg-green-500/5 p-8">
            <h3 class="text-lg font-semibold text-green-400">
              But it can still:
            </h3>
            <ul class="mt-4 space-y-3">
              {capabilities.map((item) => (
                <li class="flex items-start gap-3 text-neutral-300">
                  <span class="mt-0.5 text-green-400">&#10003;</span>
                  <span class="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div class="mt-6 rounded-lg bg-green-500/10 px-4 py-3">
              <p class="text-xs text-green-400/80">
                The goal: maximum capability within minimum attack surface.
                Your agent does real work — it just can't escape its sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div class="mt-16">
          <h3 class="text-center text-xl font-semibold text-white">
            Side-by-side comparison
          </h3>
          <p class="mt-2 text-center text-sm text-neutral-500">
            Every row is a real security boundary. Green means it exists. Red means it doesn't.
          </p>
          <div class="mt-8 overflow-hidden rounded-xl border border-neutral-800">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-neutral-800 bg-neutral-900">
                <tr>
                  <th class="px-6 py-4 font-medium text-neutral-400">Security Boundary</th>
                  <th class="px-6 py-4 font-medium text-red-400">OpenClaw</th>
                  <th class="px-6 py-4 font-medium text-green-400">seclaw</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-800">
                {comparison.map((row) => (
                  <tr class="hover:bg-neutral-900/50">
                    <td class="px-6 py-3 text-white">{row.feature}</td>
                    <td class="px-6 py-3 text-sm text-red-400/80">{row.openclaw}</td>
                    <td class="px-6 py-3 text-sm text-green-400">{row.ours}</td>
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

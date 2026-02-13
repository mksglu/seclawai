export function OpenClawProblems() {
  const bugs = [
    {
      title: "API keys exposed to MCP servers",
      description:
        "OpenClaw passes all environment variables to every MCP container. Your Anthropic key, Stripe key, database credentials — all visible to any tool the agent installs.",
      severity: "Critical",
      code: "env_file: .env  # every secret, every container",
    },
    {
      title: "No filesystem isolation",
      description:
        "The agent has full read/write access to your entire home directory. It can read ~/.ssh/id_rsa, ~/.aws/credentials, browser cookies, and anything else on your machine.",
      severity: "Critical",
      code: "volumes: ~/:/host  # your entire home directory",
    },
    {
      title: "Containers run as root",
      description:
        "MCP containers run with full root privileges. Combined with host mounts, this means the agent can modify system files, install backdoors, or escalate to host root.",
      severity: "High",
      code: "# no user directive, no cap_drop, no read_only",
    },
    {
      title: "No action confirmation",
      description:
        'OpenClaw has a "permissions" system, but it\'s enforced in the prompt — not in the runtime. A jailbroken agent can ignore all rules and send emails, delete files, or post on your behalf.',
      severity: "High",
      code: '# "Please don\'t do bad things" — in the system prompt',
    },
    {
      title: "Inbound ports open to internet",
      description:
        "OpenClaw exposes n8n on port 5678 with no authentication. Anyone who finds your IP can access your workflow editor, see your credentials, and modify your agent.",
      severity: "Critical",
      code: "ports: 5678:5678  # open to the world",
    },
    {
      title: "No resource limits",
      description:
        "No memory or CPU limits on any container. A runaway agent or cryptominer can consume all system resources, crash your machine, or mine crypto on your hardware.",
      severity: "Medium",
      code: "# no deploy.resources.limits — infinite resources",
    },
  ];

  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-red-400">
          Why we built seclaw
        </p>
        <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
          OpenClaw has <span className="text-red-400">serious security holes</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-400">
          68K+ stars on GitHub. Zero container isolation. Your API keys, SSH keys,
          and browser cookies — all accessible to any tool the agent decides to install.
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {bugs.map((bug) => (
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{bug.title}</h3>
                <span
                  className={
                    bug.severity === "Critical"
                      ? "rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400"
                      : bug.severity === "High"
                        ? "rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400"
                        : "rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400"
                  }
                >
                  {bug.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {bug.description}
              </p>
              <div className="mt-3 rounded-md bg-neutral-950/50 px-3 py-2 font-mono text-xs text-red-400/70">
                {bug.code}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          These aren't theoretical — they're in the default docker-compose.yml
          that 68K+ people cloned.
        </p>
      </div>
    </section>
  );
}

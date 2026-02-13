const steps = [
  {
    step: "1",
    title: "Run the CLI",
    description: "npx seclaw",
    detail: "Pick a template, enter your LLM provider and Telegram token. The CLI scaffolds Docker Compose, permissions, and Cloudflare Tunnel.",
  },
  {
    step: "2",
    title: "Start the stack",
    description: "docker compose up",
    detail: "Agent, Inngest scheduler, Desktop Commander, and Cloudflare Tunnel — all start in isolated containers.",
  },
  {
    step: "3",
    title: "Message your bot",
    description: "Open Telegram",
    detail: "Your agent is live. Scheduled tasks run automatically, integrations are connected, and every action is sandboxed.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-neutral-800 bg-neutral-900/30 px-6 py-24 lg:px-8" id="get-started">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          Setup in 60 seconds
        </h2>
        <p className="mt-4 text-center text-lg text-neutral-400">
          Three steps. That's it.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 font-mono text-lg font-bold text-green-400">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-1 font-mono text-sm text-green-400">
                {s.description}
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <code className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 font-mono text-sm text-green-400">
            npx seclaw
          </code>
        </div>
      </div>
    </section>
  );
}

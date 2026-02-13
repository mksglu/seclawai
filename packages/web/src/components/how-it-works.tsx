const steps = [
  {
    step: "1",
    title: "Run the CLI",
    description: "npx seclaw",
    detail: "One command. Scaffolds your project, Docker Compose, permissions, and Cloudflare Tunnel.",
  },
  {
    step: "2",
    title: "Enter your API keys",
    description: "Claude + Telegram",
    detail: "Interactive prompts guide you through setup. No config files to edit manually.",
  },
  {
    step: "3",
    title: "Message your bot",
    description: "Start chatting on Telegram",
    detail: "Your agent is running. Morning reports, overnight work, full autonomy — secured.",
  },
];

export function HowItWorks() {
  return (
    <section class="border-y border-neutral-800 bg-neutral-900/30 px-6 py-24 lg:px-8" id="get-started">
      <div class="mx-auto max-w-4xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          Setup in 60 seconds
        </h2>
        <p class="mt-4 text-center text-lg text-neutral-400">
          Three steps. That's it.
        </p>

        <div class="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div class="text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 font-mono text-lg font-bold text-green-400">
                {s.step}
              </div>
              <h3 class="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p class="mt-1 font-mono text-sm text-green-400">
                {s.description}
              </p>
              <p class="mt-3 text-sm leading-6 text-neutral-400">{s.detail}</p>
            </div>
          ))}
        </div>

        <div class="mt-12 text-center">
          <code class="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 font-mono text-sm text-green-400">
            npx seclaw
          </code>
        </div>
      </div>
    </section>
  );
}

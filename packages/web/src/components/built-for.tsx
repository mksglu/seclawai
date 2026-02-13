const useCases = [
  {
    title: "Built for Everyone",
    description:
      "Morning report ready when you wake up. Task management, daily reports, email drafting, and file organization — all running locally on your machine.",
    template: "Productivity Agent",
    price: "Free",
    icon: "P",
  },
  {
    title: "Built for Busy Professionals",
    description:
      "3 urgent, 5 action needed, 12 FYI, 8 newsletter. AI inbox manager that categorizes, summarizes, and triages your Gmail. Urgent items arrive instantly via Telegram.",
    template: "Inbox Agent",
    price: "$19",
    icon: "I",
  },
  {
    title: "Built for Product Teams",
    description:
      "Know when competitors change anything — in 5 minutes. Monitors X, Hacker News, Reddit, and RSS feeds for industry intelligence with scheduled briefings.",
    template: "Research Agent",
    price: "$39",
    icon: "R",
  },
  {
    title: "Built for Creators",
    description:
      "Your X account grows while you sleep. Research trending topics, draft posts in your voice, publish with human-in-the-loop approval, and track engagement.",
    template: "Content Agent",
    price: "$49",
    icon: "C",
  },
  {
    title: "Built for Sales Teams",
    description:
      "Find leads overnight, inbox full by morning. Detect buying signals on X, qualify prospects, draft personalized outreach, and log to CRM automatically.",
    template: "Sales Agent",
    price: "$79",
    icon: "S",
  },
  {
    title: "Built for Ambitious Teams",
    description:
      "6 AI agents running your company for $8/month. Coordinator, Executor, Observer, Analyst, Content, Growth — with quality gates and multi-agent orchestration.",
    template: "6-Agent Company",
    price: "$149",
    icon: "6",
  },
];

export function BuiltFor() {
  return (
    <section class="px-6 py-24 lg:px-8" id="use-cases">
      <div class="mx-auto max-w-6xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          Built for how you work
        </h2>
        <p class="mt-4 text-center text-lg text-neutral-400">
          17 agent templates from $0 to $149. Scheduled tasks, human-in-the-loop approval, real integrations.
        </p>

        <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => (
            <div class="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-green-500/30 hover:bg-neutral-900">
              <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 font-mono text-sm font-bold text-green-400">
                {uc.icon}
              </div>
              <h3 class="text-lg font-semibold text-white">{uc.title}</h3>
              <p class="mt-2 text-sm leading-6 text-neutral-400">
                {uc.description}
              </p>
              <div class="mt-4 flex items-center justify-between">
                <span class="text-sm text-neutral-500">{uc.template}</span>
                <span class="text-sm font-semibold text-green-400">
                  {uc.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

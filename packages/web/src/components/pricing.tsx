export function Pricing() {
  return (
    <section className="px-6 py-24 lg:px-8" id="pricing">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          One-time purchase. Forever yours.
        </h2>
        <p className="mt-4 text-center text-lg text-neutral-400">
          No subscriptions. Self-hosted. Your data stays on your machine.
        </p>

        {/* Template summary + CTA */}
        <div className="mt-16 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <p className="text-lg text-neutral-300">
            17 agent templates from{" "}
            <span className="font-semibold text-green-400">Free</span> to{" "}
            <span className="font-semibold text-white">$149</span>
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            2 free templates included. 15 paid templates, one-time purchase.
          </p>
          <a
            href="/templates"
            className="mt-6 inline-block rounded-lg bg-green-500 px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
          >
            Browse All Templates
          </a>
        </div>

        {/* Cost breakdown */}
        <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h3 className="text-lg font-semibold text-white">
            Your only real cost: LLM API
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram, Composio free tier.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 p-4 text-center">
              <p className="text-2xl font-bold text-white">~$6</p>
              <p className="text-xs text-neutral-500">/month — Haiku only</p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">~$15-30</p>
              <p className="text-xs text-neutral-500">
                /month — Smart routing
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4 text-center">
              <p className="text-2xl font-bold text-white">~$100+</p>
              <p className="text-xs text-neutral-500">/month — Opus heavy</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

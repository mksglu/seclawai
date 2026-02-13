export function Pricing() {
  return (
    <section class="px-6 py-24 lg:px-8" id="pricing">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          One-time purchase. Forever yours.
        </h2>
        <p class="mt-4 text-center text-lg text-neutral-400">
          No subscriptions. Self-hosted. Your data stays on your machine.
        </p>

        {/* Template summary + CTA */}
        <div class="mt-16 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <p class="text-lg text-neutral-300">
            17 agent templates from{" "}
            <span class="font-semibold text-green-400">Free</span> to{" "}
            <span class="font-semibold text-white">$149</span>
          </p>
          <p class="mt-2 text-sm text-neutral-500">
            2 free templates included. 15 paid templates, one-time purchase.
          </p>
          <a
            href="/templates"
            class="mt-6 inline-block rounded-lg bg-green-500 px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
          >
            Browse All Templates
          </a>
        </div>

        {/* Cost breakdown */}
        <div class="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h3 class="text-lg font-semibold text-white">
            Your only real cost: LLM API
          </h3>
          <p class="mt-2 text-sm text-neutral-400">
            Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram, Composio free tier.
          </p>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-neutral-800 p-4 text-center">
              <p class="text-2xl font-bold text-white">~$6</p>
              <p class="text-xs text-neutral-500">/month — Haiku only</p>
            </div>
            <div class="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
              <p class="text-2xl font-bold text-green-400">~$15-30</p>
              <p class="text-xs text-neutral-500">
                /month — Smart routing
              </p>
            </div>
            <div class="rounded-lg border border-neutral-800 p-4 text-center">
              <p class="text-2xl font-bold text-white">~$100+</p>
              <p class="text-xs text-neutral-500">/month — Opus heavy</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { TEMPLATES } from "../lib/templates.js";

export function Pricing() {
  return (
    <section class="px-6 py-24 lg:px-8" id="pricing">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          Agent templates
        </h2>
        <p class="mt-4 text-center text-lg text-neutral-400">
          One-time purchase. Forever yours. Self-hosted.
        </p>

        <div class="mt-16 overflow-hidden rounded-xl border border-neutral-800">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-neutral-800 bg-neutral-900">
              <tr>
                <th class="px-6 py-4 font-medium text-neutral-400">
                  Template
                </th>
                <th class="px-6 py-4 font-medium text-neutral-400">Price</th>
                <th class="hidden px-6 py-4 font-medium text-neutral-400 sm:table-cell">
                  What it does
                </th>
                <th class="px-6 py-4" />
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-800">
              {TEMPLATES.map((t) => (
                <tr class="hover:bg-neutral-900/50">
                  <td class="px-6 py-4">
                    <div class="font-medium text-white">{t.name}</div>
                    <div class="mt-1 text-xs text-neutral-500 sm:hidden">
                      {t.description}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class={
                        t.tier === "free"
                          ? "font-semibold text-green-400"
                          : "font-semibold text-white"
                      }
                    >
                      {t.price}
                    </span>
                  </td>
                  <td class="hidden px-6 py-4 text-neutral-400 sm:table-cell">
                    {t.description}
                  </td>
                  <td class="px-6 py-4 text-right">
                    {t.tier === "free" ? (
                      <a
                        href="#get-started"
                        class="rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
                      >
                        Free
                      </a>
                    ) : (
                      <a
                        href={`/templates#${t.id}`}
                        class="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
                      >
                        Buy
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cost breakdown */}
        <div class="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h3 class="text-lg font-semibold text-white">
            Your only real cost: LLM API
          </h3>
          <p class="mt-2 text-sm text-neutral-400">
            Everything else is free — Docker, Inngest, Cloudflare Tunnel, Telegram.
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

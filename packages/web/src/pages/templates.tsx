import { TEMPLATES } from "../lib/templates.js";

export function Templates() {
  return (
    <div>
      <nav class="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div class="flex items-center gap-6">
            <a href="/" class="text-sm text-neutral-400 transition hover:text-white">Home</a>
            <a href="/docs" class="text-sm text-neutral-400 transition hover:text-white">Docs</a>
          </div>
        </div>
      </nav>

      <section class="px-6 pt-32 pb-24 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h1 class="text-3xl font-bold text-white sm:text-4xl">
            Agent Templates
          </h1>
          <p class="mt-4 text-lg text-neutral-400">
            Pre-built autonomous agents. One-time purchase, forever yours.
          </p>

          <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <div
                id={t.id}
                class="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-green-500/30"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-neutral-500 uppercase">
                    {t.builtFor}
                  </span>
                  <span
                    class={
                      t.tier === "free"
                        ? "rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400"
                        : "rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-white"
                    }
                  >
                    {t.price}
                  </span>
                </div>

                <h3 class="mt-4 text-lg font-semibold text-white">{t.name}</h3>
                <p class="mt-1 text-sm italic text-green-400/80">"{t.hook}"</p>
                <p class="mt-3 flex-1 text-sm leading-6 text-neutral-400">
                  {t.description}
                </p>

                <ul class="mt-4 space-y-2">
                  {t.features.map((f) => (
                    <li class="flex items-start gap-2 text-xs text-neutral-400">
                      <span class="mt-0.5 text-green-400">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div class="mt-6">
                  {t.tier === "free" ? (
                    <a
                      href="/#get-started"
                      class="block w-full rounded-lg bg-green-500 py-2.5 text-center text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
                    >
                      Get Started — Free
                    </a>
                  ) : (
                    <button
                      data-template={t.id}
                      class="block w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 text-center text-sm font-semibold text-white transition hover:border-green-500/30 hover:bg-neutral-700"
                    >
                      Buy {t.price}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

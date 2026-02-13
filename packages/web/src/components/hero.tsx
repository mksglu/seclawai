export function Hero() {
  return (
    <section class="relative overflow-hidden px-6 pt-24 pb-16 sm:pt-32 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          Open Source
        </p>

        <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Secure autonomous AI agents{" "}
          <span class="text-green-400">in 60 seconds.</span>
        </h1>

        <p class="mt-6 text-lg leading-8 text-neutral-400 sm:text-xl">
          The OpenClaw alternative that doesn't compromise your security.
          <br />
          Docker isolation. Hard guardrails. Zero inbound ports.
        </p>

        <div class="mt-10 flex items-center justify-center gap-4">
          <a
            href="#get-started"
            class="rounded-lg bg-green-500 px-6 py-3 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-green-400"
          >
            Get Started — Free
          </a>
          <a
            href="/templates"
            class="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            View Templates
          </a>
        </div>

        {/* Terminal animation */}
        <div class="mx-auto mt-16 max-w-2xl overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <div class="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
            <span class="h-3 w-3 rounded-full bg-red-500/80" />
            <span class="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span class="h-3 w-3 rounded-full bg-green-500/80" />
            <span class="ml-2 text-xs text-neutral-500">Terminal</span>
          </div>
          <div class="p-6 text-left font-mono text-sm leading-relaxed">
            <p class="text-neutral-500">$</p>
            <p class="text-green-400">npx seclaw</p>
            <p class="mt-3 text-neutral-500">
              Claude API Key <span class="text-white">sk-ant-***</span>
            </p>
            <p class="text-neutral-500">
              Telegram Token <span class="text-white">723***:AAF***</span>
            </p>
            <p class="text-neutral-500">
              Template <span class="text-green-400">Productivity Agent (free)</span>
            </p>
            <p class="mt-3 text-green-400">
              Agent running!
            </p>
            <p class="text-neutral-500">
              Inngest: <span class="text-blue-400">http://localhost:8288</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Success() {
  return (
    <div>
      <nav class="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="font-mono text-sm font-bold text-white">
            seclaw
          </a>
        </div>
      </nav>

      <section class="flex min-h-screen items-center justify-center px-6 lg:px-8">
        <div class="mx-auto max-w-md text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <span class="text-3xl text-green-400">&#10003;</span>
          </div>
          <h1 class="mt-6 text-2xl font-bold text-white">
            Purchase complete!
          </h1>
          <p class="mt-4 text-sm leading-6 text-neutral-400">
            Your license key is below. Copy it to install your template:
          </p>
          <div id="license-display" class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-center">
            <p class="text-neutral-500">Loading your license key...</p>
          </div>
          <div class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-green-400">
            npx seclaw add template-name --key YOUR_KEY
          </div>
          <p class="mt-6 text-xs text-neutral-500">
            Also sent to your email. Check spam or{" "}
            <a href="mailto:support@seclawai.com" class="text-green-400 underline">
              contact support
            </a>
            .
          </p>
          <div class="mt-8 flex items-center justify-center gap-4">
            <a
              href="/dashboard"
              class="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
            >
              Go to Dashboard
            </a>
            <a
              href="/"
              class="text-sm text-neutral-400 transition hover:text-white"
            >
              Back to home
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

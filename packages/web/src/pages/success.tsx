export function Success() {
  return (
    <div>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
        </div>
      </nav>

      <section className="flex min-h-screen items-center justify-center px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <span className="text-3xl text-green-400">&#10003;</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Purchase complete!
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-400">
            Your license key is below. Copy it to install your template:
          </p>
          <div id="license-display" className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-center">
            <p className="text-neutral-500">Loading your license key...</p>
          </div>
          <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-green-400">
            npx seclaw add template-name --key YOUR_KEY
          </div>
          <p className="mt-6 text-xs text-neutral-500">
            Also sent to your email. Check spam or{" "}
            <a href="mailto:support@seclawai.com" className="text-green-400 underline">
              contact support
            </a>
            .
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
            >
              Go to Dashboard
            </a>
            <a
              href="/"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Back to home
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Dashboard() {
  return (
    <div>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div className="flex items-center gap-6">
            <a href="/templates" className="text-sm text-neutral-400 transition hover:text-white">
              Templates
            </a>
            <a href="/docs" className="text-sm text-neutral-400 transition hover:text-white">
              Docs
            </a>
            <div id="dashboard-nav-auth" />
          </div>
        </div>
      </nav>

      <section className="px-6 pt-32 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div id="dashboard-content">
            <div className="text-center text-neutral-500">Loading...</div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { TEMPLATES } from "../lib/templates.js";

export function Templates() {
  return (
    <div>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-neutral-400 transition hover:text-white">Home</a>
            <a href="/docs" className="text-sm text-neutral-400 transition hover:text-white">Docs</a>
            <span id="nav-auth" />
          </div>
        </div>
      </nav>

      <section className="px-6 pt-32 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Agent Templates
          </h1>
          <p className="mt-4 text-lg text-neutral-400">
            Pre-built autonomous agents. One-time purchase, forever yours.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <a
                href={`/templates/${t.id}`}
                id={t.id}
                className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-green-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 uppercase">
                    {t.builtFor}
                  </span>
                  <span
                    className={
                      t.tier === "free"
                        ? "rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400"
                        : "rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-white"
                    }
                  >
                    {t.price}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white transition group-hover:text-green-400">
                  {t.name}
                </h3>
                <p className="mt-1 text-sm italic text-green-400/80">"{t.hook}"</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
                  {t.description}
                </p>

                <ul className="mt-4 space-y-2">
                  {t.features.map((f) => (
                    <li className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="mt-0.5 text-green-400">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-center text-sm font-medium text-neutral-500 transition group-hover:text-green-400">
                  {t.tier === "free" ? "Get Started — Free" : `${t.price} — View Details`}
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

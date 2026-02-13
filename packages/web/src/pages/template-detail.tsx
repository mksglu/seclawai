import type { Template } from "../lib/templates.js";
import type { TemplateContent } from "../lib/template-content.js";
import { TEMPLATES } from "../lib/templates.js";

function CtaButton({ template }: { template: Template }) {
  if (template.tier === "free") {
    return (
      <a
        href="/#get-started"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
      >
        Get Started Free
      </a>
    );
  }
  return (
    <span
      data-buy-root=""
      data-template-id={template.id}
      data-buy-label={`Buy ${template.price}`}
    />
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="h-px flex-1 bg-gradient-to-r from-green-500/30 to-transparent" />
      <h2 className="font-mono text-xs font-medium tracking-widest text-green-400 uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-l from-green-500/30 to-transparent" />
    </div>
  );
}

function TerminalWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-neutral-700" />
        <span className="h-3 w-3 rounded-full bg-neutral-700" />
        <span className="h-3 w-3 rounded-full bg-neutral-700" />
        <span className="ml-2 font-mono text-xs text-neutral-500">{title}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function RelatedTemplates({ current }: { current: Template }) {
  const price = current.priceCents;
  const related = TEMPLATES.filter(
    (t) => t.id !== current.id && Math.abs(t.priceCents - price) <= 3000,
  ).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionLabel>More templates</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((t) => (
            <a
              href={`/templates/${t.id}`}
              className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 transition-all duration-300 hover:border-green-500/30 hover:bg-neutral-900/70"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-wider text-neutral-600 uppercase">
                  {t.builtFor}
                </span>
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-green-400">
                  {t.price}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white transition group-hover:text-green-400">
                {t.name}
              </h3>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                {t.hook}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neutral-600 transition group-hover:text-green-400">
                <span>View details</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplateDetail({
  template,
  content,
}: {
  template: Template;
  content?: TemplateContent;
}) {
  return (
    <div className="min-h-screen">
{/* pure black background, consistent with other pages */}

      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Home
            </a>
            <a
              href="/templates"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Templates
            </a>
            <a
              href="/docs"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Docs
            </a>
            <span id="nav-auth" />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-28 pb-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <a
            href="/templates"
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Templates
          </a>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-neutral-700 bg-neutral-800/50 px-3 py-1 font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                  {template.builtFor}
                </span>
                {template.tier === "free" ? (
                  <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-green-400 uppercase">
                    Free
                  </span>
                ) : (
                  <span className="rounded-full border border-neutral-700 bg-neutral-800/50 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-white uppercase">
                    {template.price}
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {template.name}
              </h1>

              <p className="mt-5 border-l-2 border-green-500/40 pl-4 text-base leading-7 italic text-green-400/80 sm:text-lg">
                "{template.hook}"
              </p>

              <p className="mt-6 text-sm leading-7 text-neutral-400 sm:text-base">
                {template.description}
              </p>
            </div>

            {/* Right: CTA Card */}
            <div className="shrink-0 lg:mt-6 lg:w-64">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl shadow-black/20">
                <div className="text-center">
                  {template.tier === "paid" ? (
                    <>
                      <p className="font-mono text-3xl font-bold text-white">
                        {template.price}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        One-time payment
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-mono text-3xl font-bold text-green-400">
                        Free
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        No payment required
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-5">
                  <CtaButton template={template} />
                </div>
                <div className="mt-5 space-y-2.5">
                  {["Self-hosted", "Your data stays yours", "No subscription"].map(
                    (s) => (
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          className="shrink-0 text-green-500/70"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {s}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      {content?.schedule && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>What it does</SectionLabel>
            <div className="relative ml-4 border-l border-neutral-800 pl-8">
              {content.schedule.map((item, i) => (
                <div className={`relative ${i > 0 ? "mt-8" : ""}`}>
                  {/* Timeline dot */}
                  <div className="absolute -left-[calc(2rem+4.5px)] top-1 flex h-2 w-2 items-center justify-center">
                    <span className="absolute h-2 w-2 rounded-full bg-green-500" />
                    <span className="absolute h-4 w-4 rounded-full bg-green-500/20" />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
                    <span className="inline-block w-fit shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 font-mono text-xs font-medium text-green-400">
                      {item.time}
                    </span>
                    <span className="text-sm leading-6 text-neutral-300">
                      {item.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {content?.howItWorks && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>How it works</SectionLabel>
            <TerminalWindow title="flow.sh">
              <pre className="overflow-x-auto font-mono text-xs leading-7 text-green-400/80 sm:text-sm">
                {content.howItWorks}
              </pre>
            </TerminalWindow>
          </div>
        </section>
      )}

      {/* Example output */}
      {content?.digestExample && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>Example output</SectionLabel>
            <TerminalWindow title="output.log">
              <pre className="overflow-x-auto font-mono text-xs leading-6 text-neutral-300 sm:text-sm">
                {content.digestExample}
              </pre>
            </TerminalWindow>
          </div>
        </section>
      )}

      {/* Mid-page CTA */}
      <section className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-transparent to-transparent p-8 sm:p-10">
            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <p className="text-lg font-bold text-white">
                  Ready to automate?
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  {template.tier === "free"
                    ? "Get started in under 60 seconds with a single command."
                    : `${template.name} — ${template.price}, one-time. No subscription.`}
                </p>
              </div>
              <CtaButton template={template} />
            </div>
          </div>
        </div>
      </section>

      {/* Setup */}
      {content?.setup && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>Setup</SectionLabel>
            <div className="space-y-0">
              {content.setup.map((step, i) => (
                <div className="relative flex items-stretch gap-5">
                  {/* Step indicator with connecting line */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 font-mono text-xs font-bold text-green-400">
                      {i + 1}
                    </div>
                    {i < content.setup!.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-800" />
                    )}
                  </div>
                  {/* Step content */}
                  <div className="pb-8 pt-1">
                    <p className="text-sm leading-6 text-neutral-300">
                      {step.split("`").map((part, j) =>
                        j % 2 === 1 ? (
                          <code className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2 py-0.5 font-mono text-xs text-green-400">
                            {part}
                          </code>
                        ) : (
                          part
                        ),
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Key features — Grid */}
      {content?.featuresTable && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>Key features</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.featuresTable.map((row) => (
                <div className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition hover:border-neutral-700 hover:bg-neutral-900/60">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        className="text-green-500"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {row.feature}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        {row.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features fallback */}
      {!content?.featuresTable && template.features.length > 0 && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>Features</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {template.features.map((f) => (
                <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    className="mt-0.5 shrink-0 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm text-neutral-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* File structure */}
      {content?.fileStructure && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionLabel>File structure</SectionLabel>
            <TerminalWindow title="tree">
              <pre className="overflow-x-auto font-mono text-xs leading-7 text-neutral-400">
                {content.fileStructure}
              </pre>
            </TerminalWindow>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-xs tracking-widest text-green-400/60 uppercase">
            Start automating today
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            {template.name}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-neutral-500">
            {template.tier === "paid"
              ? `${template.price} one-time. No subscription. Self-hosted. Your data stays yours.`
              : "Free forever. No payment required. Self-hosted. Your data stays yours."}
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButton template={template} />
          </div>
          {template.tier === "paid" && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2">
              <span className="font-mono text-xs text-neutral-500">$</span>
              <code className="font-mono text-xs text-green-400/70">
                npx seclaw add {template.id} --key YOUR_KEY
              </code>
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      <RelatedTemplates current={template} />

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="font-mono text-sm font-bold text-white">seclaw</p>
              <p className="mt-1 text-xs text-neutral-600">
                Open source. Self-hosted. Your data stays yours.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/seclaw/seclaw"
                className="text-sm text-neutral-500 transition hover:text-white"
                target="_blank"
              >
                GitHub
              </a>
              <a
                href="/docs"
                className="text-sm text-neutral-500 transition hover:text-white"
              >
                Docs
              </a>
              <a
                href="/templates"
                className="text-sm text-neutral-500 transition hover:text-white"
              >
                Templates
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

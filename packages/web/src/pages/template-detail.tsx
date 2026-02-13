import type { Template } from "../lib/templates.js";
import type { TemplateContent } from "../lib/template-content.js";
import { TEMPLATES } from "../lib/templates.js";

function CtaButton({ template, size = "default" }: { template: Template; size?: "default" | "lg" }) {
  const cls = size === "lg"
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-10 py-4 text-base font-bold text-neutral-950 transition-all hover:bg-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-[0.98]"
    : "inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-sm font-bold text-neutral-950 transition-all hover:bg-green-400 hover:shadow-[0_0_24px_rgba(34,197,94,0.25)] active:scale-[0.98]";

  if (template.tier === "free") {
    return (
      <a href="/#get-started" className={cls}>
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

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className={className || "text-green-500"}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="transition-transform group-hover:translate-x-0.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RelatedTemplates({ current }: { current: Template }) {
  const price = current.priceCents;
  const related = TEMPLATES.filter(
    (t) => t.id !== current.id && Math.abs(t.priceCents - price) <= 3000,
  ).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="relative border-t border-neutral-800/60 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-8 text-center font-mono text-xs tracking-widest text-neutral-500 uppercase">
          More templates
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((t) => (
            <a
              href={`/templates/${t.id}`}
              className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 transition-all duration-300 hover:border-green-500/30 hover:bg-neutral-900/60"
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
              <p className="mt-2 text-xs leading-5 text-neutral-500 line-clamp-2">
                {t.hook}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neutral-600 transition group-hover:text-green-400">
                <span>View details</span>
                <Arrow />
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
  const isPaid = template.tier === "paid";

  return (
    <div className="min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-neutral-400 transition hover:text-white">Home</a>
            <a href="/templates" className="text-sm text-neutral-400 transition hover:text-white">Templates</a>
            <a href="/docs" className="text-sm text-neutral-400 transition hover:text-white">Docs</a>
            <span id="nav-auth" />
          </div>
        </div>
      </nav>

      {/* ========== HERO — HIGH IMPACT ABOVE FOLD ========== */}
      <section className="relative overflow-hidden px-6 pt-24 pb-0 lg:px-8">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-gradient-to-b from-green-500/[0.07] via-transparent to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          {/* Breadcrumb */}
          <a
            href="/templates"
            className="group inline-flex items-center gap-1.5 text-xs text-neutral-500 transition hover:text-white"
          >
            <Chevron />
            All Templates
          </a>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr,340px] lg:gap-12">
            {/* Left: value proposition */}
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-neutral-700/60 bg-neutral-800/40 px-3 py-1 font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                  {template.builtFor}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {template.name}
              </h1>

              <p className="mt-4 text-lg leading-8 text-neutral-300 italic">
                &ldquo;{template.hook}&rdquo;
              </p>

              <p className="mt-4 text-sm leading-7 text-neutral-500">
                {template.description}
              </p>

              {/* Trust signals inline */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                {["Self-hosted", "No subscription", "Your data stays yours"].map((s) => (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Check className="text-green-500/60" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: PRICE CARD — dominant conversion element */}
            <div className="lg:sticky lg:top-24 self-start">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
                <div className="text-center">
                  {isPaid ? (
                    <>
                      <p className="font-mono text-5xl font-bold text-white">{template.price}</p>
                      <p className="mt-2 text-sm text-neutral-500">one-time payment</p>
                    </>
                  ) : (
                    <>
                      <p className="font-mono text-5xl font-bold text-green-400">Free</p>
                      <p className="mt-2 text-sm text-neutral-500">no payment required</p>
                    </>
                  )}
                </div>

                <div className="mt-6">
                  <CtaButton template={template} size="lg" />
                </div>

                {isPaid && (
                  <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-600">$</span>
                      <code className="font-mono text-xs text-green-400/80 select-all">
                        npx seclaw add {template.id} --key YOUR_TOKEN
                      </code>
                    </div>
                  </div>
                )}

                <div className="mt-5 space-y-3 border-t border-neutral-800/60 pt-5">
                  {[
                    "Docker-isolated runtime",
                    "Works with any LLM provider",
                    "Telegram bot included",
                  ].map((s) => (
                    <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                      <Check className="shrink-0 text-green-500/70" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SCHEDULE — WHAT IT DOES ========== */}
      {content?.schedule && (
        <section className="px-6 pt-20 pb-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-[1fr,340px] lg:gap-12">
              <div>
                <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">What it does</p>
                <div className="mt-6 space-y-0">
                  {content.schedule.map((item, i) => (
                    <div className="relative flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                          <span className="absolute h-2.5 w-2.5 rounded-full bg-green-500" />
                          <span className="absolute h-6 w-6 rounded-full bg-green-500/15" />
                        </div>
                        {i < content.schedule!.length - 1 && (
                          <div className="w-px flex-1 bg-gradient-to-b from-neutral-800 to-transparent" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-8 pt-1">
                        <span className="inline-block rounded-md border border-green-500/20 bg-green-500/5 px-3 py-1 font-mono text-xs font-medium text-green-400">
                          {item.time}
                        </span>
                        <p className="mt-2 text-sm leading-6 text-neutral-300">
                          {item.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Spacer for sticky card alignment */}
              <div className="hidden lg:block" />
            </div>
          </div>
        </section>
      )}

      {/* ========== HOW IT WORKS + EXAMPLE — side by side on desktop ========== */}
      {(content?.howItWorks || content?.digestExample) && (
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">How it works</p>
            <div className={`mt-6 grid gap-6 ${content?.howItWorks && content?.digestExample ? "lg:grid-cols-2" : ""}`}>
              {content?.howItWorks && (
                <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]">
                  <div className="flex items-center gap-2 border-b border-neutral-800/80 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="ml-2 font-mono text-[10px] text-neutral-600">flow.sh</span>
                  </div>
                  <pre className="overflow-x-auto p-5 font-mono text-xs leading-7 text-green-400/80 sm:text-sm">
                    {content.howItWorks}
                  </pre>
                </div>
              )}
              {content?.digestExample && (
                <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]">
                  <div className="flex items-center gap-2 border-b border-neutral-800/80 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="ml-2 font-mono text-[10px] text-neutral-600">output.log</span>
                  </div>
                  <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-neutral-300 sm:text-sm">
                    {content.digestExample}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========== MID-PAGE CTA — conversion trigger ========== */}
      <section className="px-6 py-4 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-green-500/[0.02] to-transparent p-8 sm:p-10">
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div>
                <p className="text-xl font-bold text-white">
                  Ready to automate?
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  {isPaid
                    ? `${template.name} — ${template.price}, one-time. No subscription.`
                    : "Get started in under 60 seconds with a single command."}
                </p>
              </div>
              <div className="shrink-0">
                <CtaButton template={template} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES + SETUP — compact two-column ========== */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">

            {/* Features */}
            {content?.featuresTable && (
              <div>
                <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">Key features</p>
                <div className="mt-6 space-y-3">
                  {content.featuresTable.map((row) => (
                    <div className="flex items-start gap-3 rounded-lg border border-neutral-800/60 bg-neutral-900/30 px-4 py-3.5 transition hover:border-neutral-700/60 hover:bg-neutral-900/50">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
                        <Check className="text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{row.feature}</p>
                        <p className="mt-0.5 text-xs leading-5 text-neutral-500">{row.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features fallback */}
            {!content?.featuresTable && template.features.length > 0 && (
              <div>
                <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">Features</p>
                <div className="mt-6 space-y-3">
                  {template.features.map((f) => (
                    <div className="flex items-start gap-3 rounded-lg border border-neutral-800/60 bg-neutral-900/30 px-4 py-3.5">
                      <Check className="mt-0.5 shrink-0 text-green-500" />
                      <span className="text-sm text-neutral-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Setup */}
            {content?.setup && (
              <div>
                <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">Setup</p>
                <div className="mt-6 space-y-0">
                  {content.setup.map((step, i) => (
                    <div className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 font-mono text-xs font-bold text-green-400">
                          {i + 1}
                        </div>
                        {i < content.setup!.length - 1 && (
                          <div className="w-px flex-1 bg-neutral-800" />
                        )}
                      </div>
                      <div className="pb-6 pt-0.5">
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
            )}
          </div>
        </div>
      </section>

      {/* ========== FILE STRUCTURE — optional ========== */}
      {content?.fileStructure && (
        <section className="px-6 pb-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs tracking-widest text-green-400/70 uppercase">File structure</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]">
              <div className="flex items-center gap-2 border-b border-neutral-800/80 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                <span className="ml-2 font-mono text-[10px] text-neutral-600">tree</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-7 text-neutral-400">
                {content.fileStructure}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* ========== BOTTOM CTA — final conversion ========== */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {template.name}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-neutral-500">
            {isPaid
              ? `${template.price} one-time. No subscription. Self-hosted. Your data stays yours.`
              : "Free forever. No payment required. Self-hosted. Your data stays yours."}
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButton template={template} size="lg" />
          </div>
          {isPaid && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5">
              <span className="font-mono text-xs text-neutral-600">$</span>
              <code className="font-mono text-xs text-green-400/70 select-all">
                npx seclaw add {template.id} --key YOUR_TOKEN
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
              <a href="https://github.com/seclaw/seclaw" className="text-sm text-neutral-500 transition hover:text-white" target="_blank">GitHub</a>
              <a href="/docs" className="text-sm text-neutral-500 transition hover:text-white">Docs</a>
              <a href="/templates" className="text-sm text-neutral-500 transition hover:text-white">Templates</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

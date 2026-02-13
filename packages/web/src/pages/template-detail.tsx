import type { Template } from "../lib/templates.js";
import type { TemplateContent } from "../lib/template-content.js";
import { TEMPLATES } from "../lib/templates.js";

/* ════════════════════════════════════════════
   Primitives — shadcn-inspired, Hono JSX
   ════════════════════════════════════════════ */

function Badge({ children, variant = "default" }: { children: string; variant?: "default" | "outline" | "secondary" }) {
  const styles = {
    default: "border-transparent bg-zinc-800 text-zinc-300",
    outline: "border-zinc-700 text-zinc-400",
    secondary: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ── CTA Button ── */

function BuyButton({ template, size = "default" }: { template: Template; size?: "default" | "lg" }) {
  const base = "inline-flex w-full items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98]";
  const cls = size === "lg"
    ? `${base} h-12 rounded-lg bg-white px-8 text-sm text-zinc-950 hover:bg-zinc-100`
    : `${base} h-10 rounded-lg bg-white px-6 text-sm text-zinc-950 hover:bg-zinc-100`;

  if (template.tier === "free") {
    return <a href="/#get-started" className={cls}>Get Started Free</a>;
  }
  return (
    <span
      data-buy-root=""
      data-template-id={template.id}
      data-buy-label={`Buy ${template.price}`}
    />
  );
}

/* ── Terminal block ── */

function Terminal({ title, children }: { title: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="ml-2 font-mono text-[11px] text-zinc-600">{title}</span>
      </div>
      <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-6 text-zinc-400">{children}</pre>
    </div>
  );
}

/* ── Inline code in text ── */

function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, j) =>
        j % 2 === 1 ? (
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">{part}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/* ── Related templates ── */

function RelatedTemplates({ current }: { current: Template }) {
  const related = TEMPLATES.filter(
    (t) => t.id !== current.id && Math.abs(t.priceCents - current.priceCents) <= 3000,
  ).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-zinc-800/50 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h3 className="text-center text-sm font-medium text-zinc-500">More templates</h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {related.map((t) => (
            <a href={`/templates/${t.id}`} className="group rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wide">{t.builtFor}</span>
                <span className="text-[11px] font-semibold text-zinc-400">{t.price}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">{t.name}</p>
              <p className="mt-1 text-[12px] leading-5 text-zinc-500 line-clamp-2">{t.hook}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-zinc-600 transition-colors group-hover:text-zinc-400">
                <span>View details</span>
                <IconArrowRight />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

export function TemplateDetail({
  template,
  content,
}: {
  template: Template;
  content?: TemplateContent;
}) {
  const isPaid = template.tier === "paid";
  const features = content?.featuresTable ?? template.features.map((f) => ({ feature: f, details: "" }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      <div className="mx-auto max-w-3xl px-6 pt-20 pb-0">

        {/* ═══════ HERO ═══════ */}
        <section className="pt-8 pb-10">
          {/* Breadcrumb */}
          <a href="/templates" className="inline-flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m15 18-6-6 6-6" /></svg>
            Templates
          </a>

          <div className="mt-6">
            <div className="flex items-center gap-2.5">
              <Badge>{template.builtFor}</Badge>
              {isPaid && <Badge variant="outline">{`${template.price} one-time`}</Badge>}
              {!isPaid && <Badge variant="secondary">Free</Badge>}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {template.name}
            </h1>

            <p className="mt-3 text-lg leading-relaxed text-zinc-400">
              {template.hook}
            </p>

            <p className="mt-2 text-sm leading-7 text-zinc-500">
              {template.description}
            </p>
          </div>

          {/* ── Price + CTA card ── */}
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Price + value */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {isPaid ? template.price : "Free"}
                </span>
                <span className="text-sm text-zinc-500">
                  {isPaid ? "one-time purchase" : "no payment required"}
                </span>
              </div>
              {/* Right: CTA */}
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <BuyButton template={template} size="lg" />
              </div>
            </div>

            {/* CLI install command */}
            {isPaid && (
              <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/80 px-4 py-2.5">
                <code className="font-mono text-[13px] text-zinc-400 select-all">
                  <span className="text-zinc-600">$</span> npx seclaw add {template.id} --key YOUR_TOKEN
                </code>
              </div>
            )}

            {/* Trust bar */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-800/60 pt-4">
              {[
                { icon: <IconShield />, text: "Self-hosted" },
                { icon: <IconServer />, text: "Docker isolated" },
                { icon: <IconZap />, text: "Any LLM provider" },
                { icon: <IconLock />, text: "Your data stays yours" },
              ].map((s) => (
                <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                  {s.icon}
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ AUTOMATION SCHEDULE ═══════ */}
        {content?.schedule && content.schedule.length > 0 && (
          <section className="border-t border-zinc-800/50 py-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Automation Schedule</h2>
            <div className="mt-5 divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900/30">
              {content.schedule.map((item) => (
                <div className="flex items-start gap-4 px-4 py-3.5">
                  <Badge variant="outline">{item.time}</Badge>
                  <p className="pt-0.5 text-sm text-zinc-300">{item.action}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ HOW IT WORKS + PREVIEW ═══════ */}
        {(content?.howItWorks || content?.digestExample) && (
          <section className="border-t border-zinc-800/50 py-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">How It Works</h2>
            <div className={`mt-5 grid gap-4 ${content?.howItWorks && content?.digestExample ? "lg:grid-cols-2" : ""}`}>
              {content?.howItWorks && (
                <Terminal title="pipeline">{content.howItWorks}</Terminal>
              )}
              {content?.digestExample && (
                <Terminal title="sample output">{content.digestExample}</Terminal>
              )}
            </div>
          </section>
        )}

        {/* ═══════ FEATURES ═══════ */}
        {features.length > 0 && (
          <section className="border-t border-zinc-800/50 py-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">What You Get</h2>
            <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 sm:grid-cols-2">
              {features.map((row) => {
                const f = typeof row === "string" ? row : row.feature;
                const d = typeof row === "string" ? "" : row.details;
                return (
                  <div className="flex items-start gap-3 bg-zinc-900/80 px-4 py-4">
                    <div className="mt-0.5 shrink-0">
                      <IconCheck />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{f}</p>
                      {d && <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">{d}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════ SETUP ═══════ */}
        {content?.setup && content.setup.length > 0 && (
          <section className="border-t border-zinc-800/50 py-10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Quick Start</h2>
              <span className="text-[12px] text-zinc-600">{content.setup.length} steps</span>
            </div>
            <ol className="mt-5 space-y-0 divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900/30">
              {content.setup.map((step, i) => (
                <li className="flex items-start gap-3.5 px-4 py-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[11px] font-bold text-zinc-400">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-zinc-300">
                    <InlineCode text={step} />
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="border-t border-zinc-800/50 py-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">{template.name}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
              {isPaid
                ? `${template.price} one-time. No subscription. Self-hosted.`
                : "Free forever. Self-hosted. Your data stays yours."}
            </p>
            <div className="mx-auto mt-6 max-w-[200px]">
              <BuyButton template={template} size="lg" />
            </div>
            {isPaid && (
              <div className="mt-4">
                <code className="font-mono text-[12px] text-zinc-600 select-all">
                  npx seclaw add {template.id} --key YOUR_TOKEN
                </code>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── Related ── */}
      <RelatedTemplates current={template} />

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="font-mono text-sm font-bold text-white">seclaw</p>
              <p className="mt-1 text-[12px] text-zinc-600">Open source. Self-hosted. Your data stays yours.</p>
            </div>
            <div className="flex items-center gap-5">
              <a href="https://github.com/seclaw/seclaw" className="text-[13px] text-zinc-500 transition-colors hover:text-white" target="_blank">GitHub</a>
              <a href="/docs" className="text-[13px] text-zinc-500 transition-colors hover:text-white">Docs</a>
              <a href="/templates" className="text-[13px] text-zinc-500 transition-colors hover:text-white">Templates</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

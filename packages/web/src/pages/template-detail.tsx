import type { Template } from "../lib/templates.js";
import type { TemplateContent } from "../lib/template-content.js";
import { TEMPLATES } from "../lib/templates.js";

function CtaButton({ template }: { template: Template }) {
  if (template.tier === "free") {
    return (
      <a
        href="/#get-started"
        class="inline-block rounded-lg bg-green-500 px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
      >
        Get Started — Free
      </a>
    );
  }
  return (
    <button
      data-template={template.id}
      class="inline-block rounded-lg bg-green-500 px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
    >
      Buy {template.price}
    </button>
  );
}

function RelatedTemplates({ current }: { current: Template }) {
  const price = current.priceCents;
  const related = TEMPLATES.filter(
    (t) => t.id !== current.id && Math.abs(t.priceCents - price) <= 3000,
  )
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section class="border-t border-neutral-800 px-6 py-16 lg:px-8">
      <div class="mx-auto max-w-4xl">
        <h2 class="text-xl font-bold text-white">Related Templates</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          {related.map((t) => (
            <a
              href={`/templates/${t.id}`}
              class="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-green-500/30"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500 uppercase">{t.builtFor}</span>
                <span class="text-xs font-semibold text-green-400">{t.price}</span>
              </div>
              <h3 class="mt-2 text-sm font-semibold text-white">{t.name}</h3>
              <p class="mt-1 text-xs text-neutral-400">{t.hook}</p>
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
    <div>
      {/* Nav */}
      <nav class="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div class="flex items-center gap-6">
            <a href="/" class="text-sm text-neutral-400 transition hover:text-white">
              Home
            </a>
            <a href="/templates" class="text-sm text-neutral-400 transition hover:text-white">
              Templates
            </a>
            <a href="/docs" class="text-sm text-neutral-400 transition hover:text-white">
              Docs
            </a>
            <span id="nav-auth">
              <button
                id="nav-login-btn"
                class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
                onclick="document.getElementById('auth-modal').style.display='flex'"
              >
                Buy
              </button>
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section class="px-6 pt-32 pb-16 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <a
            href="/templates"
            class="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-white"
          >
            &larr; All Templates
          </a>

          <div class="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-neutral-500 uppercase">
                  {template.builtFor}
                </span>
                <span
                  class={
                    template.tier === "free"
                      ? "rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400"
                      : "rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-white"
                  }
                >
                  {template.price}
                </span>
              </div>
              <h1 class="mt-3 text-3xl font-bold text-white sm:text-4xl">
                {template.name}
              </h1>
              <p class="mt-3 text-lg text-green-400/90">"{template.hook}"</p>
              <p class="mt-4 text-neutral-400 leading-7">{template.description}</p>
            </div>

            <div class="flex flex-col items-start gap-3 sm:items-end sm:pt-8">
              <CtaButton template={template} />
              {template.tier === "paid" && (
                <span class="text-xs text-neutral-500">One-time purchase</span>
              )}
            </div>
          </div>

          {/* Trust signals */}
          <div class="mt-8 flex flex-wrap gap-4">
            {["One-time purchase", "Self-hosted", "Docker isolated", "Your data stays yours"].map(
              (s) => (
                <span class="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">
                  <span class="text-green-400">&#10003;</span>
                  {s}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* What it does — Schedule */}
      {content?.schedule && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">What it does</h2>
            <div class="mt-6 space-y-0 overflow-hidden rounded-xl border border-neutral-800">
              {content.schedule.map((item, i) => (
                <div
                  class={`flex items-start gap-4 p-4 ${i > 0 ? "border-t border-neutral-800" : ""}`}
                >
                  <span class="inline-block w-32 shrink-0 rounded bg-neutral-800 px-2 py-1 text-center font-mono text-xs text-green-400">
                    {item.time}
                  </span>
                  <span class="text-sm text-neutral-300">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works — Flow diagram */}
      {content?.howItWorks && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">How it works</h2>
            <pre class="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 font-mono text-xs leading-6 text-green-400/80">
              {content.howItWorks}
            </pre>
          </div>
        </section>
      )}

      {/* Digest example */}
      {content?.digestExample && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">Example output</h2>
            <pre class="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 font-mono text-xs leading-5 text-neutral-300">
              {content.digestExample}
            </pre>
          </div>
        </section>
      )}

      {/* Mid-page CTA */}
      <section class="border-t border-neutral-800 px-6 py-10 lg:px-8">
        <div class="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center sm:flex-row sm:text-left">
          <div class="flex-1">
            <p class="font-semibold text-white">
              Ready to automate?
            </p>
            <p class="mt-1 text-sm text-neutral-400">
              {template.tier === "free"
                ? "Get started in under 60 seconds with a single command."
                : `${template.name} — ${template.price}, one-time. No subscription.`}
            </p>
          </div>
          <CtaButton template={template} />
        </div>
      </section>

      {/* Setup steps */}
      {content?.setup && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">Setup</h2>
            <ol class="mt-6 space-y-4">
              {content.setup.map((step, i) => (
                <li class="flex items-start gap-4">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-xs font-bold text-green-400">
                    {i + 1}
                  </span>
                  <span class="pt-0.5 text-sm text-neutral-300">
                    {step.split("`").map((part, j) =>
                      j % 2 === 1 ? (
                        <code class="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-green-400">
                          {part}
                        </code>
                      ) : (
                        part
                      ),
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Key features table */}
      {content?.featuresTable && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">Key features</h2>
            <div class="mt-6 overflow-hidden rounded-xl border border-neutral-800">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-neutral-800 bg-neutral-900">
                    <th class="px-4 py-3 font-medium text-neutral-400">Feature</th>
                    <th class="px-4 py-3 font-medium text-neutral-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {content.featuresTable.map((row, i) => (
                    <tr class={i > 0 ? "border-t border-neutral-800" : ""}>
                      <td class="px-4 py-3 font-medium text-white whitespace-nowrap">
                        {row.feature}
                      </td>
                      <td class="px-4 py-3 text-neutral-400">{row.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Features fallback (when no featuresTable) */}
      {!content?.featuresTable && template.features.length > 0 && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">Features</h2>
            <ul class="mt-6 space-y-3">
              {template.features.map((f) => (
                <li class="flex items-start gap-3 text-sm text-neutral-300">
                  <span class="mt-0.5 text-green-400">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* File structure */}
      {content?.fileStructure && (
        <section class="border-t border-neutral-800 px-6 py-12 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2 class="text-xl font-bold text-white">File structure</h2>
            <pre class="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 font-mono text-xs leading-6 text-neutral-300">
              {content.fileStructure}
            </pre>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section class="border-t border-neutral-800 px-6 py-16 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-2xl font-bold text-white">
            {template.name} — {template.price}
            {template.tier === "paid" && " one-time"}
          </h2>
          <p class="mt-3 text-neutral-400">
            No subscription. Self-hosted. Your data stays yours.
          </p>
          <div class="mt-6">
            <CtaButton template={template} />
          </div>
          {template.tier === "paid" && (
            <p class="mt-6 font-mono text-xs text-neutral-500">
              npx seclaw add {template.id} --key YOUR_KEY
            </p>
          )}
        </div>
      </section>

      {/* Related templates */}
      <RelatedTemplates current={template} />

      {/* Footer */}
      <footer class="border-t border-neutral-800 px-6 py-12 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p class="font-mono text-sm font-bold text-white">seclaw</p>
              <p class="mt-1 text-xs text-neutral-500">
                Open source. Self-hosted. Your data stays yours.
              </p>
            </div>
            <div class="flex items-center gap-6">
              <a
                href="https://github.com/seclaw/seclaw"
                class="text-sm text-neutral-400 transition hover:text-white"
                target="_blank"
              >
                GitHub
              </a>
              <a href="/docs" class="text-sm text-neutral-400 transition hover:text-white">
                Docs
              </a>
              <a href="/templates" class="text-sm text-neutral-400 transition hover:text-white">
                Templates
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

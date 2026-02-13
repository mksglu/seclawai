import { Hero } from "../components/hero.js";
import { Quotes } from "../components/quotes.js";
import { OpenClawProblems } from "../components/openclaw-problems.js";
import { Security } from "../components/security.js";
import { Architecture } from "../components/architecture.js";
import { BuiltFor } from "../components/built-for.js";
import { HowItWorks } from "../components/how-it-works.js";
import { Pricing } from "../components/pricing.js";

export function Home() {
  return (
    <div>
      {/* Nav */}
      <nav class="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div class="flex items-center gap-6">
            <a
              href="#architecture"
              class="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
            >
              Stack
            </a>
            <a
              href="#use-cases"
              class="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
            >
              Templates
            </a>
            <a
              href="/docs"
              class="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
            >
              Docs
            </a>
            <a
              href="https://github.com/seclaw/seclaw"
              class="text-sm text-neutral-400 transition hover:text-white"
              target="_blank"
            >
              GitHub
            </a>
            <a
              href="#get-started"
              class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Sections — story flow */}
      <Hero />
      <Quotes />
      <OpenClawProblems />
      <Security />
      <Architecture />
      <BuiltFor />
      <HowItWorks />
      <Pricing />

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
              <a
                href="/docs"
                class="text-sm text-neutral-400 transition hover:text-white"
              >
                Docs
              </a>
              <a
                href="/templates"
                class="text-sm text-neutral-400 transition hover:text-white"
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

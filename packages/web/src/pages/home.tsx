import { Hero } from "../components/hero.js";
import { Quotes } from "../components/quotes.js";
import { OpenClawProblems } from "../components/openclaw-problems.js";
import { Security } from "../components/security.js";
import { Architecture } from "../components/architecture.js";
import { BuiltInTools } from "../components/built-in-tools.js";
import { BuiltFor } from "../components/built-for.js";
import { HowItWorks } from "../components/how-it-works.js";
import { Pricing } from "../components/pricing.js";

export function Home() {
  return (
    <div>
      {/* Sections — story flow */}
      <Hero />
      <Quotes />
      <OpenClawProblems />
      <Security />
      <Architecture />
      <BuiltInTools />
      <BuiltFor />
      <HowItWorks />
      <Pricing />

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="font-mono text-sm font-bold text-white">seclaw</p>
              <p className="mt-1 text-xs text-neutral-500">
                Open source. Self-hosted. Your data stays yours.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/seclaw/seclaw"
                className="text-sm text-neutral-400 transition hover:text-white"
                target="_blank"
              >
                GitHub
              </a>
              <a
                href="/docs"
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                Docs
              </a>
              <a
                href="/templates"
                className="text-sm text-neutral-400 transition hover:text-white"
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

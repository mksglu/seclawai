import { Hero } from "../components/hero.js";
import { Quotes } from "../components/quotes.js";
import { AutoMode } from "../components/auto-mode.js";
import { OpenClawProblems } from "../components/openclaw-problems.js";
import { Security } from "../components/security.js";
import { Architecture } from "../components/architecture.js";
import { BuiltInTools } from "../components/built-in-tools.js";
import { Integrations } from "../components/integrations.js";
import { BuiltFor } from "../components/built-for.js";
import { HowItWorks } from "../components/how-it-works.js";
import { Pricing } from "../components/pricing.js";

export function Home() {
  return (
    <div>
      {/* Sections — story flow */}
      <Hero />
      <Quotes />
      <AutoMode />
      <BuiltFor />
      <OpenClawProblems />
      <Security />
      <Architecture />
      <BuiltInTools />
      <Integrations />
      <HowItWorks />
      <Pricing />

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <a href="/terms" className="transition hover:text-neutral-300">Terms</a>
              <span className="text-neutral-700">&middot;</span>
              <a href="/privacy" className="transition hover:text-neutral-300">Privacy</a>
              <span className="text-neutral-700">&middot;</span>
              <a href="/legal" className="transition hover:text-neutral-300">Legal</a>
            </div>
            <p className="text-xs text-neutral-600">
              <a href="https://mksg.lu" target="_blank" className="transition hover:text-neutral-400">MKSF LTD</a>
              {" "}&middot; London, UK
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

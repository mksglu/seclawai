export function Privacy() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-24 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: February 2025</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400">
          <section>
            <h2 className="text-sm font-semibold text-white">1. Who We Are</h2>
            <p className="mt-2">
              MKSF LTD, Suite 8805, 5 Brayford Square, London E1 0SG, United Kingdom.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">2. What We Collect</h2>
            <p className="mt-2">
              We collect only what is necessary to process purchases: email address and payment
              information (handled by Stripe). We do not collect analytics or tracking data.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">3. Self-Hosted</h2>
            <p className="mt-2">
              seclaw runs on your infrastructure. Your agent data, API keys, conversations, and
              integrations never leave your machine. We have zero access to them.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">4. Third Parties</h2>
            <p className="mt-2">
              Stripe processes payments. Composio handles OAuth tokens for integrations on your
              behalf. We do not sell or share your data with anyone else.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">5. Your Rights</h2>
            <p className="mt-2">
              You can request deletion of your account and associated data at any time by
              contacting us at{" "}
              <a href="https://mksg.lu" target="_blank" className="text-green-400 hover:underline">
                mksg.lu
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-24 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: February 2025</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400">
          <section>
            <h2 className="text-sm font-semibold text-white">1. Agreement</h2>
            <p className="mt-2">
              By using seclaw ("Service"), you agree to these terms. The Service is operated by
              MKSF LTD, Suite 8805, 5 Brayford Square, London E1 0SG, United Kingdom.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">2. License</h2>
            <p className="mt-2">
              Paid templates are licensed per-user. You may use them in personal and commercial
              projects. Redistribution or resale of template source code is not permitted.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">3. Payments & Refunds</h2>
            <p className="mt-2">
              All payments are processed via Stripe. All sales are final — no refunds or
              cancellations once a template has been delivered.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">4. Self-Hosted Nature</h2>
            <p className="mt-2">
              seclaw runs entirely on your own infrastructure. We do not host, store, or have
              access to your data, API keys, or agent conversations.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">5. Limitation of Liability</h2>
            <p className="mt-2">
              The Service is provided "as is" without warranties. MKSF LTD is not liable for
              any damages arising from the use of the Service or templates.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">6. Changes</h2>
            <p className="mt-2">
              We may update these terms at any time. Continued use of the Service constitutes
              acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">7. Contact</h2>
            <p className="mt-2">
              Questions? Reach us at{" "}
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

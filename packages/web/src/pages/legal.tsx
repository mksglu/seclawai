export function Legal() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-24 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Legal</h1>
        <p className="mt-2 text-sm text-neutral-500">Company information</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400">
          <section>
            <h2 className="text-sm font-semibold text-white">Company</h2>
            <div className="mt-3 space-y-1">
              <p>MKSF LTD</p>
              <p>Suite 8805, 5 Brayford Square</p>
              <p>London E1 0SG</p>
              <p>United Kingdom</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">Website</h2>
            <p className="mt-2">
              <a href="https://mksg.lu" target="_blank" className="text-green-400 hover:underline">
                mksg.lu
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">Open Source</h2>
            <p className="mt-2">
              seclaw is open source. The core runtime and CLI are available on{" "}
              <a href="https://github.com/mksglu/seclawai" target="_blank" className="text-green-400 hover:underline">
                GitHub
              </a>.
              Paid templates are licensed separately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

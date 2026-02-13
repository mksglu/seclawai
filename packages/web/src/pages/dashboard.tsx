import type { AuthUser } from "../../../api/src/auth.js";

interface License {
  id: string;
  license_key: string;
  template_id: string;
  template_name: string;
  expires_at: string | null;
  activated_at: string | null;
  created_at: string;
}

interface DashboardProps {
  user: AuthUser;
  licenses: License[];
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return (
      <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
        No expiry
      </span>
    );
  }
  const days = daysUntil(expiresAt);
  if (days <= 0) {
    return (
      <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
        Expired
      </span>
    );
  }
  if (days <= 2) {
    return (
      <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
        {days}d left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
      {days}d left
    </span>
  );
}

function LicenseCard({ license }: { license: License }) {
  const expired = license.expires_at ? daysUntil(license.expires_at) <= 0 : false;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{license.template_name}</h3>
        <ExpiryBadge expiresAt={license.expires_at} />
      </div>

      {expired ? (
        <div className="mt-4">
          <p className="text-sm text-neutral-400">
            Your key has expired. Regenerate to continue using this template.
          </p>
          <button
            data-regenerate={license.id}
            className="mt-3 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
          >
            Regenerate Key
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-xs text-neutral-500">License Key</p>
            <div className="flex items-center gap-2">
              <code
                data-key={license.license_key}
                className="key-masked flex-1 cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-green-400 transition hover:border-green-500/30"
              >
                {"*".repeat(8)}...{"*".repeat(8)}
              </code>
              <button
                data-reveal={license.license_key}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-400 transition hover:text-white"
              >
                Reveal
              </button>
              <button
                data-copy={license.license_key}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-400 transition hover:text-white"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-neutral-500">Install Command</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-xs text-green-400">
                npx seclaw add {license.template_id} --key {license.license_key}
              </code>
              <button
                data-copy={`npx seclaw add ${license.template_id} --key ${license.license_key}`}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-400 transition hover:text-white"
              >
                Copy
              </button>
            </div>
          </div>

          <button
            data-regenerate={license.id}
            className="text-xs text-neutral-500 transition hover:text-neutral-300"
          >
            Regenerate key
          </button>
        </div>
      )}
    </div>
  );
}

export function Dashboard({ user, licenses }: DashboardProps) {
  return (
    <div>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-mono text-sm font-bold text-white">
            seclaw
          </a>
          <div className="flex items-center gap-6">
            <a href="/templates" className="text-sm text-neutral-400 transition hover:text-white">
              Templates
            </a>
            <a href="/docs" className="text-sm text-neutral-400 transition hover:text-white">
              Docs
            </a>
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-7 w-7 rounded-full border border-neutral-700"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/10 text-xs font-semibold text-green-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                id="signout-btn"
                className="text-xs text-neutral-500 transition hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="px-6 pt-32 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">{user.email}</p>
          </div>

          {licenses.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
              <p className="text-neutral-400">No templates purchased yet.</p>
              <a
                href="/templates"
                className="mt-4 inline-block rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
              >
                Browse Templates
              </a>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-sm font-medium text-neutral-400">
                Your Templates ({licenses.length})
              </h2>
              <div className="space-y-4">
                {licenses.map((l) => (
                  <LicenseCard license={l} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          // Sign out
          document.getElementById('signout-btn').addEventListener('click', function() {
            fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
              .then(function() { window.location.href = '/'; });
          });

          // Reveal key
          document.addEventListener('click', function(e) {
            var revealBtn = e.target.closest('[data-reveal]');
            if (revealBtn) {
              var key = revealBtn.getAttribute('data-reveal');
              var codeEl = document.querySelector('[data-key="' + key + '"]');
              if (codeEl) {
                if (codeEl.classList.contains('key-masked')) {
                  codeEl.textContent = key;
                  codeEl.classList.remove('key-masked');
                  revealBtn.textContent = 'Hide';
                } else {
                  codeEl.textContent = '${'*'.repeat(8)}...${'*'.repeat(8)}';
                  codeEl.classList.add('key-masked');
                  revealBtn.textContent = 'Reveal';
                }
              }
            }

            // Copy
            var copyBtn = e.target.closest('[data-copy]');
            if (copyBtn) {
              var text = copyBtn.getAttribute('data-copy');
              navigator.clipboard.writeText(text).then(function() {
                var orig = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(function() { copyBtn.textContent = orig; }, 1500);
              });
            }

            // Regenerate key
            var regenBtn = e.target.closest('[data-regenerate]');
            if (regenBtn) {
              var licenseId = regenBtn.getAttribute('data-regenerate');
              regenBtn.textContent = 'Regenerating...';
              regenBtn.disabled = true;
              fetch('/api/templates/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ licenseId: licenseId })
              })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                if (data.licenseKey) window.location.reload();
                else { alert(data.error || 'Failed to regenerate'); regenBtn.textContent = 'Regenerate Key'; regenBtn.disabled = false; }
              })
              .catch(function() { regenBtn.textContent = 'Regenerate Key'; regenBtn.disabled = false; });
            }
          });
        })();
      `}} />
    </div>
  );
}

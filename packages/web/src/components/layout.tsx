import { jsxRenderer } from "hono/jsx-renderer";

declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { title?: string; description?: string },
    ): Response | Promise<Response>;
  }
}

export const renderer = jsxRenderer(({ children, title, description }) => (
  <html lang="en" class="bg-neutral-950 text-white antialiased">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title || "seclaw — Secure AI Agents in 60 Seconds"}</title>
      <meta
        name="description"
        content={description || "The OpenClaw alternative that doesn't compromise your security. Autonomous AI agents with Docker isolation, hard guardrails, and 60-second setup."}
      />
      <meta property="og:title" content={title || "seclaw — Secure AI Agents in 60s"} />
      <meta
        property="og:description"
        content={description || "RIP OpenClaw. Secure autonomous AI agents with hard guardrails. Setup in 60 seconds."}
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/static/output.css" />
    </head>
    <body class="font-sans">
      {children}

      {/* Auth Modal */}
      <div
        id="auth-modal"
        class="fixed inset-0 z-[100] items-center justify-center bg-black/60 backdrop-blur-sm"
        style="display:none"
      >
        <div class="relative mx-4 w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
          <button
            id="modal-close"
            class="absolute right-4 top-4 text-neutral-500 transition hover:text-white"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div class="text-center">
            <p class="font-mono text-sm font-bold text-green-400">seclaw</p>
            <h2 class="mt-4 text-xl font-bold text-white">Sign in to continue</h2>
            <p class="mt-2 text-sm text-neutral-400">
              Create an account to purchase templates and manage your licenses.
            </p>
          </div>

          <button
            id="google-signin"
            class="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-white transition hover:border-neutral-600 hover:bg-neutral-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p class="mt-6 text-center text-xs text-neutral-600">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          var modal = document.getElementById('auth-modal');
          var pendingTemplateId = null;

          // Show/hide modal
          function showModal(templateId) {
            pendingTemplateId = templateId;
            modal.style.display = 'flex';
          }
          function hideModal() {
            modal.style.display = 'none';
            pendingTemplateId = null;
          }

          // Close modal on backdrop click or close button
          document.getElementById('modal-close').addEventListener('click', hideModal);
          modal.addEventListener('click', function(e) {
            if (e.target === modal) hideModal();
          });

          // Google sign-in — redirect to Better Auth
          document.getElementById('google-signin').addEventListener('click', function() {
            var callbackURL = pendingTemplateId
              ? '/templates?buy=' + encodeURIComponent(pendingTemplateId)
              : '/dashboard';
            fetch('/api/auth/sign-in/social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ provider: 'google', callbackURL: callbackURL })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.url) window.location.href = data.url;
            })
            .catch(function() { alert('Failed to connect. Try again.'); });
          });

          // Checkout handler — requires auth
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-template]');
            if (!btn) return;
            e.preventDefault();
            var templateId = btn.getAttribute('data-template');

            // Check session first
            fetch('/api/auth/get-session', { credentials: 'include' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data && data.user) {
                // Logged in — proceed to checkout
                proceedToCheckout(btn, templateId);
              } else {
                // Not logged in — show modal
                showModal(templateId);
              }
            })
            .catch(function() {
              // Auth not available — redirect to detail page
              window.location.href = '/templates/' + templateId;
            });
          });

          function proceedToCheckout(btn, templateId) {
            btn.textContent = 'Redirecting...';
            btn.disabled = true;
            fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ templateId: templateId })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.url) window.location.href = data.url;
              else if (data.error && data.error.indexOf('already own') !== -1) {
                btn.textContent = 'Owned';
                alert(data.error);
              }
              else { alert(data.error || 'Checkout failed'); btn.textContent = 'Try again'; btn.disabled = false; }
            })
            .catch(function() { alert('Network error. Try again.'); btn.textContent = 'Try again'; btn.disabled = false; });
          }

          // Auto-buy after login redirect
          var params = new URLSearchParams(window.location.search);
          var buyTemplate = params.get('buy');
          if (buyTemplate && window.location.pathname === '/templates') {
            // Clean URL
            window.history.replaceState({}, '', '/templates');
            // Check session and auto-checkout
            fetch('/api/auth/get-session', { credentials: 'include' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data && data.user) {
                var btn = document.querySelector('[data-template="' + buyTemplate + '"]');
                if (btn) proceedToCheckout(btn, buyTemplate);
              }
            });
          }

          // Success page: fetch license key from session
          if (window.location.pathname === '/success') {
            var sessionId = params.get('session_id');
            if (sessionId) {
              var el = document.getElementById('license-display');
              if (el) {
                fetch('/api/templates/session/' + sessionId)
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  if (data.licenseKey) {
                    el.innerHTML = '<p class="text-xs text-neutral-500 mb-2">' + data.templateName + '</p>'
                      + '<code class="text-green-400 text-lg select-all">' + data.licenseKey + '</code>'
                      + '<p class="mt-4 text-sm text-neutral-400">npx seclaw add ' + data.templateId + ' --key ' + data.licenseKey + '</p>';
                  }
                });
              }
            }
          }

          // Update nav auth state on all pages
          fetch('/api/auth/get-session', { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var navAuth = document.getElementById('nav-auth');
            if (navAuth && data && data.user) {
              navAuth.innerHTML = '<a href="/dashboard" class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-green-400">Dashboard</a>';
            }
          })
          .catch(function() {});
        })();
      `}} />
    </body>
  </html>
));

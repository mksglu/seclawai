import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => (
  <html lang="en" class="bg-neutral-950 text-white antialiased">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>seclaw — Secure AI Agents in 60 Seconds</title>
      <meta
        name="description"
        content="The OpenClaw alternative that doesn't compromise your security. Autonomous AI agents with Docker isolation, hard guardrails, and 60-second setup."
      />
      <meta property="og:title" content="seclaw — Secure AI Agents in 60s" />
      <meta
        property="og:description"
        content="RIP OpenClaw. Secure autonomous AI agents with hard guardrails. Setup in 60 seconds."
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
      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          // Checkout handler for buy buttons
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-template]');
            if (!btn) return;
            e.preventDefault();
            var templateId = btn.getAttribute('data-template');
            var email = prompt('Enter your email to receive the license key:');
            if (!email || !email.includes('@')) return;
            btn.textContent = 'Redirecting...';
            btn.disabled = true;
            fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ templateId: templateId, email: email })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.url) window.location.href = data.url;
              else { alert(data.error || 'Checkout failed'); btn.textContent = 'Try again'; btn.disabled = false; }
            })
            .catch(function() { alert('Network error. Try again.'); btn.textContent = 'Try again'; btn.disabled = false; });
          });

          // Success page: fetch license key from session
          if (window.location.pathname === '/success') {
            var params = new URLSearchParams(window.location.search);
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
        })();
      `}} />
    </body>
  </html>
));

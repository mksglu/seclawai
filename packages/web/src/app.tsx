import { Hono } from "hono";
import { renderPage } from "./components/layout.js";
import { Home } from "./pages/home.js";
import { Templates } from "./pages/templates.js";
import { TemplateDetail } from "./pages/template-detail.js";
import { Docs } from "./pages/docs.js";
import { Success } from "./pages/success.js";
import { Dashboard } from "./pages/dashboard.js";
import { Terms } from "./pages/terms.js";
import { Privacy } from "./pages/privacy.js";
import { Legal } from "./pages/legal.js";
import { TEMPLATES } from "./lib/templates.js";
import { TEMPLATE_CONTENT } from "./lib/template-content.js";

type Env = { Bindings: { API_URL: string } };

const app = new Hono<Env>();

// Proxy /api/* to API worker
app.all("/api/*", async (c) => {
  const apiBase = c.env.API_URL;
  const url = new URL(c.req.url);
  const target = `${apiBase}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  try {
    const res = await fetch(target, {
      method: c.req.method,
      headers,
      body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : undefined,
      redirect: "manual",
    });

    // For redirects, rewrite Location to point to the proxy origin
    if (res.status >= 300 && res.status < 400) {
      const resHeaders = new Headers(res.headers);
      const location = resHeaders.get("Location");
      if (location) {
        try {
          const locUrl = new URL(location, target);
          if (locUrl.origin === apiBase) {
            locUrl.host = url.host;
            locUrl.protocol = url.protocol;
            resHeaders.set("Location", locUrl.toString());
          }
        } catch { /* keep original */ }
      }
      return new Response(res.body, {
        status: res.status,
        headers: resHeaders,
      });
    }

    // Non-redirect: pass through headers as-is (preserves Set-Cookie correctly)
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  } catch {
    return c.json({ error: "API unavailable" }, 502);
  }
});

// JSON-LD schemas
const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "seclawai.com",
  url: "https://seclawai.com",
  sameAs: ["https://github.com/mksglu/seclawai"],
};

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "seclawai.com",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Deploy secure, autonomous AI agents on your machine in 60 seconds. Docker-isolated, self-hosted.",
};

// Pages
app.get("/", (c) =>
  c.html(renderPage(<Home />, {
    title: "seclaw — Secure AI Agents on Your Machine",
    description: "Deploy autonomous AI agents in 60 seconds. 17 templates, Auto Mode, Docker isolation. Self-hosted, no subscriptions. One Telegram bot, multiple agents.",
    path: "/",
    jsonLd: { ...ORG_SCHEMA, ...SOFTWARE_SCHEMA, "@type": ["Organization", "SoftwareApplication"] },
  })),
);

app.get("/templates", (c) =>
  c.html(renderPage(<Templates />, {
    title: "AI Agent Templates — seclawai.com",
    description: "17 pre-built AI agent templates. Productivity, inbox management, research, sales, DevOps and more. One-time purchase, self-hosted, no subscriptions.",
    path: "/templates",
  })),
);

app.get("/templates/:id", (c) => {
  const id = c.req.param("id");
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return c.notFound();
  const content = TEMPLATE_CONTENT[id];
  return c.html(
    renderPage(<TemplateDetail template={template} content={content} />, {
      title: `${template.name} — AI Agent Template | seclawai.com`,
      description: template.description,
      path: `/templates/${id}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: template.name,
        description: template.description,
        brand: { "@type": "Brand", name: "seclawai.com" },
        offers: {
          "@type": "Offer",
          price: template.priceCents ? (template.priceCents / 100).toFixed(2) : "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
    }),
  );
});

app.get("/docs", (c) =>
  c.html(renderPage(<Docs />, {
    title: "Documentation — seclawai.com",
    description: "Quick start guide, architecture overview, CLI commands, Telegram commands, built-in tools, and Composio integrations for seclaw AI agents.",
    path: "/docs",
  })),
);

app.get("/success", (c) =>
  c.html(renderPage(<Success />, {
    title: "Purchase Complete — seclawai.com",
    path: "/success",
  })),
);

app.get("/dashboard", (c) =>
  c.html(renderPage(<Dashboard />, {
    title: "Dashboard — seclawai.com",
    path: "/dashboard",
  })),
);

app.get("/terms", (c) =>
  c.html(renderPage(<Terms />, {
    title: "Terms of Service — seclawai.com",
    description: "Terms of service for seclaw AI agent platform.",
    path: "/terms",
  })),
);

app.get("/privacy", (c) =>
  c.html(renderPage(<Privacy />, {
    title: "Privacy Policy — seclawai.com",
    description: "Privacy policy for seclaw. Your data stays on your machine. We only collect what's needed for licensing.",
    path: "/privacy",
  })),
);

app.get("/legal", (c) =>
  c.html(renderPage(<Legal />, {
    title: "Legal — seclawai.com",
    description: "Legal information for seclaw by MKSF LTD, London UK.",
    path: "/legal",
  })),
);

// 404
app.notFound((c) =>
  c.html(
    renderPage(
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">404</h1>
          <p className="mt-2 text-neutral-400">Page not found</p>
          <a href="/" className="mt-4 inline-block text-green-400 underline">
            Go home
          </a>
        </div>
      </div>,
    ),
  ),
);

export default app;

import { Hono } from "hono";
import { renderPage } from "./components/layout.js";
import { Home } from "./pages/home.js";
import { Templates } from "./pages/templates.js";
import { TemplateDetail } from "./pages/template-detail.js";
import { Docs } from "./pages/docs.js";
import { Success } from "./pages/success.js";
import { Dashboard } from "./pages/dashboard.js";
import { TEMPLATES } from "./lib/templates.js";
import { TEMPLATE_CONTENT } from "./lib/template-content.js";

type Env = { Bindings: { API_URL: string } };

const app = new Hono<Env>();

// Proxy /api/* to API worker (dev: localhost:8788, prod: api.seclawai.com)
app.all("/api/*", async (c) => {
  const apiBase = c.env.API_URL || "http://localhost:8788";
  const url = new URL(c.req.url);
  const target = `${apiBase}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", url.host);

  const res = await fetch(target, {
    method: c.req.method,
    headers,
    body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : undefined,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

// Pages
app.get("/", (c) => c.html(renderPage(<Home />)));
app.get("/templates", (c) => c.html(renderPage(<Templates />)));
app.get("/templates/:id", (c) => {
  const id = c.req.param("id");
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return c.notFound();
  const content = TEMPLATE_CONTENT[id];
  return c.html(
    renderPage(<TemplateDetail template={template} content={content} />, {
      title: `${template.name} — seclaw`,
      description: template.description,
    }),
  );
});
app.get("/docs", (c) => c.html(renderPage(<Docs />)));
app.get("/success", (c) => c.html(renderPage(<Success />)));
app.get("/dashboard", (c) => c.html(renderPage(<Dashboard />, { title: "Dashboard — seclaw" })));

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

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

type Bindings = {
  API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Helper to render with API URL injected
function render(c: { env: Bindings }, content: React.ReactElement, props?: { title?: string; description?: string }) {
  return renderPage(content, { ...props, apiUrl: c.env.API_URL });
}

// Pages
app.get("/", (c) => c.html(render(c, <Home />)));
app.get("/templates", (c) => c.html(render(c, <Templates />)));
app.get("/templates/:id", (c) => {
  const id = c.req.param("id");
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return c.notFound();
  const content = TEMPLATE_CONTENT[id];
  return c.html(
    render(c, <TemplateDetail template={template} content={content} />, {
      title: `${template.name} — seclaw`,
      description: template.description,
    }),
  );
});
app.get("/docs", (c) => c.html(render(c, <Docs />)));
app.get("/success", (c) => c.html(render(c, <Success />)));
app.get("/dashboard", (c) => c.html(render(c, <Dashboard />, { title: "Dashboard — seclaw" })));

// 404
app.notFound((c) =>
  c.html(
    render(c, (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">404</h1>
          <p className="mt-2 text-neutral-400">Page not found</p>
          <a href="/" className="mt-4 inline-block text-green-400 underline">
            Go home
          </a>
        </div>
      </div>
    )),
  ),
);

export default app;

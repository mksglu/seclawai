import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkout } from "./routes/checkout.js";
import { webhook } from "./routes/webhook.js";
import { templates } from "./routes/templates.js";
import { getAuth, type AuthUser } from "./auth.js";
import { renderPage } from "../../web/src/components/layout.js";
import { Home } from "../../web/src/pages/home.js";
import { Templates as TemplatesPage } from "../../web/src/pages/templates.js";
import { TemplateDetail } from "../../web/src/pages/template-detail.js";
import { Docs } from "../../web/src/pages/docs.js";
import { Success } from "../../web/src/pages/success.js";
import { Dashboard } from "../../web/src/pages/dashboard.js";
import { TEMPLATES } from "../../web/src/lib/templates.js";
import { TEMPLATE_CONTENT } from "../../web/src/lib/template-content.js";

export type Bindings = {
  DB: D1Database;
  TEMPLATE_BUCKET: R2Bucket;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  RESEND_API_KEY: string;
};

type Variables = {
  user: AuthUser | null;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

const app = new Hono<AppEnv>();

// CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN;
      if (
        origin === allowed ||
        origin === "http://localhost:3000" ||
        origin === "http://localhost:8787" ||
        origin === "http://localhost:8787"
      ) {
        return origin;
      }
      return allowed;
    },
    credentials: true,
  })
);

// Session middleware — populates c.var.user on every request
app.use("*", async (c, next) => {
  try {
    const auth = getAuth(c.env);
    const result = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", (result?.user as AuthUser) ?? null);
  } catch {
    c.set("user", null);
  }
  return next();
});

// Better Auth handler — all /api/auth/* routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

// --- API Routes ---
app.route("/api/checkout", checkout);
app.route("/api/webhook", webhook);
app.route("/api/templates", templates);

app.get("/api/health", (c) =>
  c.json({ status: "ok", version: "0.2.0" })
);

// --- Web Pages (React SSR) ---
app.get("/", (c) => c.html(renderPage(<Home />)));
app.get("/templates", (c) => c.html(renderPage(<TemplatesPage />)));
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

// Dashboard — client-hydrated (auth + data fetched via client.js)
app.get("/dashboard", (c) => {
  return c.html(
    renderPage(<Dashboard />, { title: "Dashboard — seclaw" }),
  );
});

// 404 — HTML for pages, JSON for API
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.html(
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
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Internal server error" }, 500);
  }
  return c.text("Internal server error", 500);
});

export default app;

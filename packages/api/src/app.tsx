import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkout } from "./routes/checkout.js";
import { webhook } from "./routes/webhook.js";
import { templates } from "./routes/templates.js";
import { getAuth, type AuthUser } from "./auth.js";
import { renderer } from "../../web/src/components/layout.js";
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
        origin === "http://localhost:8788"
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
app.on(["POST", "GET"], "/api/auth/**", (c) => {
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

// --- Web Pages ---
app.use("/*", renderer);

app.get("/", (c) => c.render(<Home />));
app.get("/templates", (c) => c.render(<TemplatesPage />));
app.get("/templates/:id", (c) => {
  const id = c.req.param("id");
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return c.notFound();
  const content = TEMPLATE_CONTENT[id];
  return c.render(
    <TemplateDetail template={template} content={content} />,
    { title: `${template.name} — seclaw`, description: template.description },
  );
});
app.get("/docs", (c) => c.render(<Docs />));
app.get("/success", (c) => c.render(<Success />));

// Dashboard — requires auth (SSR)
app.get("/dashboard", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/templates");
  }

  const result = await c.env.DB.prepare(
    `SELECT l.id, l.license_key, l.template_id, l.expires_at, l.activated_at, l.created_at,
            t.name as template_name
     FROM licenses l
     JOIN templates t ON l.template_id = t.id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC`
  )
    .bind(user.id)
    .all();

  return c.render(
    <Dashboard user={user} licenses={result.results as any} />
  );
});

// 404 — HTML for pages, JSON for API
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.render(
    <div class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white">404</h1>
        <p class="mt-2 text-neutral-400">Page not found</p>
        <a href="/" class="mt-4 inline-block text-green-400 underline">
          Go home
        </a>
      </div>
    </div>
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

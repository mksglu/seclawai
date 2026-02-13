import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkout } from "./routes/checkout.js";
import { webhook } from "./routes/webhook.js";
import { templates } from "./routes/templates.js";
import { renderer } from "../../web/src/components/layout.js";
import { Home } from "../../web/src/pages/home.js";
import { Templates as TemplatesPage } from "../../web/src/pages/templates.js";
import { Docs } from "../../web/src/pages/docs.js";
import { Success } from "../../web/src/pages/success.js";

export type Bindings = {
  DB: D1Database;
  TEMPLATE_BUCKET: R2Bucket;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CORS_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN;
      if (origin === allowed || origin === "http://localhost:3000" || origin === "http://localhost:8788") {
        return origin;
      }
      return allowed;
    },
  })
);

// --- API Routes ---
app.route("/api/checkout", checkout);
app.route("/api/webhook", webhook);
app.route("/api/templates", templates);

app.get("/api/health", (c) =>
  c.json({ status: "ok", version: "0.1.0" })
);

// --- Web Pages ---
app.use("/*", renderer);

app.get("/", (c) => c.render(<Home />));
app.get("/templates", (c) => c.render(<TemplatesPage />));
app.get("/docs", (c) => c.render(<Docs />));
app.get("/success", (c) => c.render(<Success />));

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

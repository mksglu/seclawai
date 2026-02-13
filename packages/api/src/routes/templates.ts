import { Hono } from "hono";
import type { Bindings } from "../app.js";
import { getTemplateContent } from "../lib/r2.js";

const templates = new Hono<{ Bindings: Bindings }>();

// Public catalog — anyone can see what's available
templates.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, name, description, price_cents, version FROM templates ORDER BY price_cents ASC"
  ).all<{
    id: string;
    name: string;
    description: string;
    price_cents: number;
    version: string;
  }>();

  const catalog = result.results.map((t) => ({
    ...t,
    tier: t.price_cents === 0 ? "free" : "paid",
    price: t.price_cents === 0 ? "Free" : `$${t.price_cents / 100}`,
  }));

  return c.json(catalog);
});

// Activate a paid template with license key — returns full template bundle
templates.post("/activate", async (c) => {
  const { licenseKey } = await c.req.json<{ licenseKey: string }>();

  if (!licenseKey) {
    return c.json({ error: "licenseKey is required" }, 400);
  }

  const license = await c.env.DB.prepare(
    "SELECT l.*, t.file_key, t.id as tid, t.name as tname FROM licenses l JOIN templates t ON l.template_id = t.id WHERE l.license_key = ?"
  )
    .bind(licenseKey)
    .first<{
      id: string;
      template_id: string;
      activated_at: string | null;
      file_key: string;
      tid: string;
      tname: string;
    }>();

  if (!license) {
    return c.json({ error: "Invalid license key" }, 400);
  }

  // Mark as activated (allow re-downloads)
  if (!license.activated_at) {
    await c.env.DB.prepare(
      'UPDATE licenses SET activated_at = datetime("now") WHERE id = ?'
    )
      .bind(license.id)
      .run();
  }

  // Log download
  await c.env.DB.prepare(
    "INSERT INTO downloads (license_id, ip) VALUES (?, ?)"
  )
    .bind(license.id, c.req.header("cf-connecting-ip") || "unknown")
    .run();

  // Get template bundle from R2
  // R2 stores a JSON bundle: { workflow, systemPrompt, config, readme }
  const content = await getTemplateContent(
    c.env.TEMPLATE_BUCKET,
    license.file_key
  );

  if (!content) {
    return c.json({ error: "Template file not found" }, 500);
  }

  const bundle = JSON.parse(content) as Record<string, string>;

  return c.json({
    templateId: license.template_id,
    templateName: license.tname,
    files: bundle,
  });
});

// Lookup license key by Stripe session (for success page)
templates.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  const license = await c.env.DB.prepare(
    "SELECT l.license_key, l.template_id, t.name as template_name FROM licenses l JOIN templates t ON l.template_id = t.id WHERE l.stripe_payment_id = ?"
  )
    .bind(sessionId)
    .first<{
      license_key: string;
      template_id: string;
      template_name: string;
    }>();

  if (!license) {
    return c.json({ error: "Session not found or payment pending" }, 404);
  }

  return c.json({
    licenseKey: license.license_key,
    templateId: license.template_id,
    templateName: license.template_name,
  });
});

export { templates };

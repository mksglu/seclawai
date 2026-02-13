import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { getTemplateContent } from "../lib/r2.js";
import { generateLicenseKey } from "../lib/license.js";

const templates = new Hono<AppEnv>();

// Public catalog
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

// Activate a paid template with license key
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
      expires_at: string | null;
      file_key: string;
      tid: string;
      tname: string;
    }>();

  if (!license) {
    return c.json({ error: "Invalid license key" }, 400);
  }

  // Check expiry
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return c.json({
      error: "License key expired. Regenerate from your dashboard at seclawai.com/dashboard",
    }, 403);
  }

  // Mark as activated
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

// Regenerate license key (auth required)
templates.post("/regenerate", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { licenseId } = await c.req.json<{ licenseId: string }>();
  if (!licenseId) {
    return c.json({ error: "licenseId is required" }, 400);
  }

  // Verify ownership
  const license = await c.env.DB.prepare(
    "SELECT id FROM licenses WHERE id = ? AND user_id = ?"
  )
    .bind(licenseId, user.id)
    .first();

  if (!license) {
    return c.json({ error: "License not found" }, 404);
  }

  const newKey = generateLicenseKey();
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await c.env.DB.prepare(
    "UPDATE licenses SET license_key = ?, expires_at = ?, activated_at = NULL WHERE id = ?"
  )
    .bind(newKey, newExpiry, licenseId)
    .run();

  return c.json({ licenseKey: newKey, expiresAt: newExpiry });
});

// Lookup license by Stripe session (success page)
templates.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  const license = await c.env.DB.prepare(
    "SELECT l.license_key, l.template_id, l.expires_at, t.name as template_name FROM licenses l JOIN templates t ON l.template_id = t.id WHERE l.stripe_payment_id = ?"
  )
    .bind(sessionId)
    .first<{
      license_key: string;
      template_id: string;
      expires_at: string | null;
      template_name: string;
    }>();

  if (!license) {
    return c.json({ error: "Session not found or payment pending" }, 404);
  }

  return c.json({
    licenseKey: license.license_key,
    templateId: license.template_id,
    templateName: license.template_name,
    expiresAt: license.expires_at,
  });
});

export { templates };

import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { getTemplateContent } from "../lib/r2.js";
import { generateToken, generateTokenId, generatePurchaseId } from "../lib/license.js";
import { createStripeClient } from "../lib/stripe.js";
import { sendTokenEmail } from "../lib/email.js";

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

// Activate: download a template using token
templates.post("/activate", async (c) => {
  const { token, templateId } = await c.req.json<{ token: string; templateId: string }>();

  if (!token || !templateId) {
    return c.json({ error: "token and templateId are required" }, 400);
  }

  // Look up token
  const tokenRow = await c.env.DB.prepare(
    "SELECT id FROM tokens WHERE token = ?"
  ).bind(token).first<{ id: string }>();

  if (!tokenRow) {
    return c.json({ error: "Invalid token" }, 400);
  }

  // Check if user owns this template
  const purchase = await c.env.DB.prepare(
    "SELECT id FROM purchases WHERE token_id = ? AND template_id = ?"
  ).bind(tokenRow.id, templateId).first<{ id: string }>();

  if (!purchase) {
    return c.json({ error: "You don't own this template. Purchase it at seclawai.com/templates" }, 403);
  }

  // Get template file_key
  const template = await c.env.DB.prepare(
    "SELECT file_key, name FROM templates WHERE id = ?"
  ).bind(templateId).first<{ file_key: string; name: string }>();

  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  // Log download
  await c.env.DB.prepare(
    "INSERT INTO downloads (token_id, template_id, ip) VALUES (?, ?, ?)"
  ).bind(tokenRow.id, templateId, c.req.header("cf-connecting-ip") || "unknown").run();

  // Get template bundle from R2
  const content = await getTemplateContent(c.env.TEMPLATE_BUCKET, template.file_key);

  if (!content) {
    return c.json({ error: "Template file not found" }, 500);
  }

  const bundle = JSON.parse(content) as Record<string, string>;

  return c.json({
    templateId,
    templateName: template.name,
    files: bundle,
  });
});

// List owned templates (token required)
templates.get("/owned", async (c) => {
  const token = c.req.header("x-token") || c.req.query("token");

  if (!token) {
    return c.json({ error: "Token required" }, 400);
  }

  const tokenRow = await c.env.DB.prepare(
    "SELECT id FROM tokens WHERE token = ?"
  ).bind(token).first<{ id: string }>();

  if (!tokenRow) {
    return c.json({ error: "Invalid token" }, 400);
  }

  const owned = await c.env.DB.prepare(
    "SELECT t.id, t.name, t.description, p.purchased_at FROM purchases p JOIN templates t ON p.template_id = t.id WHERE p.token_id = ? ORDER BY p.purchased_at"
  ).bind(tokenRow.id).all<{
    id: string;
    name: string;
    description: string;
    purchased_at: string;
  }>();

  return c.json({ templates: owned.results });
});

// Regenerate token (auth required)
templates.post("/regenerate", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Find user's token
  const tokenRow = await c.env.DB.prepare(
    "SELECT id FROM tokens WHERE user_id = ?"
  ).bind(user.id).first<{ id: string }>();

  if (!tokenRow) {
    return c.json({ error: "No token found" }, 404);
  }

  const newToken = generateToken();

  await c.env.DB.prepare(
    "UPDATE tokens SET token = ? WHERE id = ?"
  ).bind(newToken, tokenRow.id).run();

  return c.json({ token: newToken });
});

// Lookup token by Stripe session (success page)
templates.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  // 1. Check DB: find purchase by stripe_payment_id
  const existing = await c.env.DB.prepare(
    `SELECT t.token, p.template_id, tmpl.name as template_name
     FROM purchases p
     JOIN tokens t ON p.token_id = t.id
     JOIN templates tmpl ON p.template_id = tmpl.id
     WHERE p.stripe_payment_id = ?`
  ).bind(sessionId).first<{
    token: string;
    template_id: string;
    template_name: string;
  }>();

  if (existing) {
    return c.json({
      token: existing.token,
      templateId: existing.template_id,
      templateName: existing.template_name,
    });
  }

  // 2. Not in DB — query Stripe API directly
  try {
    const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return c.json({ error: "Payment not completed" }, 402);
    }

    const templateId = session.metadata?.templateId;
    const userId = session.metadata?.userId;
    const email = session.metadata?.email || session.customer_details?.email;

    if (!templateId || !email) {
      return c.json({ error: "Missing metadata in Stripe session" }, 400);
    }

    // Race condition guard
    const recheck = await c.env.DB.prepare(
      "SELECT t.token FROM purchases p JOIN tokens t ON p.token_id = t.id WHERE p.stripe_payment_id = ?"
    ).bind(sessionId).first<{ token: string }>();

    if (recheck) {
      const tmpl = await c.env.DB.prepare("SELECT name FROM templates WHERE id = ?")
        .bind(templateId).first<{ name: string }>();
      return c.json({
        token: recheck.token,
        templateId,
        templateName: tmpl?.name || templateId,
      });
    }

    // 3. Find or create token for this user
    let tokenRow = await c.env.DB.prepare(
      "SELECT id, token FROM tokens WHERE email = ?"
    ).bind(email).first<{ id: string; token: string }>();

    if (!tokenRow) {
      const tokenId = generateTokenId();
      const token = generateToken();
      await c.env.DB.prepare(
        "INSERT INTO tokens (id, email, token, user_id) VALUES (?, ?, ?, ?)"
      ).bind(tokenId, email, token, userId || null).run();
      tokenRow = { id: tokenId, token };
    }

    // Add purchase
    const purchaseId = generatePurchaseId();
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO purchases (id, token_id, template_id, stripe_payment_id) VALUES (?, ?, ?, ?)"
    ).bind(purchaseId, tokenRow.id, templateId, sessionId).run();

    const template = await c.env.DB.prepare("SELECT name FROM templates WHERE id = ?")
      .bind(templateId).first<{ name: string }>();

    // Send token email
    if (c.env.RESEND_API_KEY && template) {
      try {
        const owned = await c.env.DB.prepare(
          "SELECT t.name FROM purchases p JOIN templates t ON p.template_id = t.id WHERE p.token_id = ? ORDER BY p.purchased_at"
        ).bind(tokenRow.id).all<{ name: string }>();

        await sendTokenEmail(c.env.RESEND_API_KEY, email, template.name, tokenRow.token, templateId, owned.results.map((r) => r.name));
      } catch (emailErr) {
        console.error("Failed to send token email:", emailErr);
      }
    }

    return c.json({
      token: tokenRow.token,
      templateId,
      templateName: template?.name || templateId,
    });
  } catch (err) {
    console.error("Stripe session lookup failed:", err);
    return c.json({ error: "Session not found or payment pending" }, 404);
  }
});

export { templates };

import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { createStripeClient } from "../lib/stripe.js";
import { generateLicenseId, generateLicenseKey } from "../lib/license.js";

const checkout = new Hono<AppEnv>();

checkout.post("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { templateId } = await c.req.json<{ templateId: string }>();

  if (!templateId) {
    return c.json({ error: "templateId is required" }, 400);
  }

  const template = await c.env.DB.prepare(
    "SELECT id, name, description, price_cents FROM templates WHERE id = ?"
  )
    .bind(templateId)
    .first<{
      id: string;
      name: string;
      description: string | null;
      price_cents: number;
    }>();

  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  if (template.price_cents === 0) {
    return c.json({ error: "This template is free. Use the CLI to install." }, 400);
  }

  // Check if user already owns this template
  const existing = await c.env.DB.prepare(
    "SELECT id FROM licenses WHERE user_id = ? AND template_id = ?"
  )
    .bind(user.id, templateId)
    .first();

  if (existing) {
    return c.json({ error: "You already own this template. Check your dashboard." }, 400);
  }

  // Dev mode: no Stripe key — generate license directly
  if (!c.env.STRIPE_SECRET_KEY) {
    const licenseId = generateLicenseId();
    const licenseKey = generateLicenseKey();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(
      `INSERT INTO licenses (id, email, template_id, license_key, stripe_payment_id, user_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(licenseId, user.email, templateId, licenseKey, `dev_${licenseId}`, user.id, expiresAt)
      .run();

    return c.json({
      dev: true,
      licenseKey,
      message: `Dev mode — license created. Use: npx seclaw add ${templateId} --key ${licenseKey}`,
    });
  }

  const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: template.price_cents,
        product_data: {
          name: template.name,
          description: template.description || "",
        },
      },
      quantity: 1,
    }],
    success_url: `${c.env.CORS_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.CORS_ORIGIN}/templates`,
    metadata: { templateId, userId: user.id, email: user.email },
  });

  return c.json({ url: session.url });
});

export { checkout };

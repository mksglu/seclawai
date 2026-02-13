import { Hono } from "hono";
import type { Bindings } from "../app.js";
import { createStripeClient } from "../lib/stripe.js";
import { generateLicenseId, generateLicenseKey } from "../lib/license.js";

const checkout = new Hono<{ Bindings: Bindings }>();

checkout.post("/", async (c) => {
  const { templateId, email } = await c.req.json<{
    templateId: string;
    email: string;
  }>();

  if (!templateId || !email) {
    return c.json({ error: "templateId and email are required" }, 400);
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

  // Dev mode: no Stripe key configured — generate license directly
  if (!c.env.STRIPE_SECRET_KEY) {
    const licenseId = generateLicenseId();
    const licenseKey = generateLicenseKey();

    await c.env.DB.prepare(
      `INSERT INTO licenses (id, email, template_id, license_key, stripe_payment_id)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(licenseId, email, templateId, licenseKey, `dev_${licenseId}`)
      .run();

    return c.json({
      dev: true,
      licenseKey,
      message: `Dev mode — license created for ${template.name}. Use: npx seclaw add ${templateId} --key ${licenseKey}`,
    });
  }

  const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
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
    metadata: { templateId, email },
  });

  return c.json({ url: session.url });
});

export { checkout };

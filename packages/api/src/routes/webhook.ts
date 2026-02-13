import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { createStripeClient, verifyWebhookSignature } from "../lib/stripe.js";
import { generateLicenseId, generateLicenseKey } from "../lib/license.js";
import { sendLicenseEmail } from "../lib/email.js";

const webhook = new Hono<AppEnv>();

webhook.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const body = await c.req.text();
  const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = await verifyWebhookSignature(
      stripe,
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const templateId = session.metadata?.templateId;
    const userId = session.metadata?.userId;
    const email = session.metadata?.email;

    if (!templateId || !email) {
      return c.json({ error: "Missing metadata" }, 400);
    }

    const licenseId = generateLicenseId();
    const licenseKey = generateLicenseKey();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(
      `INSERT INTO licenses (id, email, template_id, license_key, stripe_payment_id, user_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(licenseId, email, templateId, licenseKey, session.payment_intent, userId || null, expiresAt)
      .run();

    // Get template name for email
    const template = await c.env.DB.prepare(
      "SELECT name FROM templates WHERE id = ?"
    )
      .bind(templateId)
      .first<{ name: string }>();

    // Send license email via Resend
    if (c.env.RESEND_API_KEY && template) {
      try {
        await sendLicenseEmail(
          c.env.RESEND_API_KEY,
          email,
          template.name,
          licenseKey,
          templateId,
          expiresAt
        );
      } catch (err) {
        console.error("Failed to send license email:", err);
      }
    }

    console.log(`License created: ${licenseKey} for ${email} (${templateId})`);
  }

  return c.json({ received: true });
});

export { webhook };

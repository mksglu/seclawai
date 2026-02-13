import { Hono } from "hono";
import type { Bindings } from "../app.js";
import { createStripeClient, verifyWebhookSignature } from "../lib/stripe.js";
import { generateLicenseId, generateLicenseKey } from "../lib/license.js";

const webhook = new Hono<{ Bindings: Bindings }>();

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
    const email = session.metadata?.email;

    if (!templateId || !email) {
      return c.json({ error: "Missing metadata" }, 400);
    }

    const licenseId = generateLicenseId();
    const licenseKey = generateLicenseKey();

    await c.env.DB.prepare(
      `INSERT INTO licenses (id, email, template_id, license_key, stripe_payment_id)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(licenseId, email, templateId, licenseKey, session.payment_intent)
      .run();

    // TODO: Send license key email via Resend/Mailgun
    // For now, the key is stored and retrievable via the success page
    console.log(`License created: ${licenseKey} for ${email} (${templateId})`);
  }

  return c.json({ received: true });
});

export { webhook };

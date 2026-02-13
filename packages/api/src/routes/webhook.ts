import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { createStripeClient, verifyWebhookSignature } from "../lib/stripe.js";
import { generateToken, generateTokenId, generatePurchaseId } from "../lib/license.js";
import { sendTokenEmail } from "../lib/email.js";

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

    // Find or create token for this user
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

    // Add template to purchases (ignore if already owned)
    const purchaseId = generatePurchaseId();
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO purchases (id, token_id, template_id, stripe_payment_id) VALUES (?, ?, ?, ?)"
    ).bind(purchaseId, tokenRow.id, templateId, session.id).run();

    // Get template name for email
    const template = await c.env.DB.prepare(
      "SELECT name FROM templates WHERE id = ?"
    ).bind(templateId).first<{ name: string }>();

    // Send token email
    if (c.env.RESEND_API_KEY && template) {
      try {
        // Get all owned templates for this user
        const owned = await c.env.DB.prepare(
          "SELECT t.name FROM purchases p JOIN templates t ON p.template_id = t.id WHERE p.token_id = ? ORDER BY p.purchased_at"
        ).bind(tokenRow.id).all<{ name: string }>();

        await sendTokenEmail(
          c.env.RESEND_API_KEY,
          email,
          template.name,
          tokenRow.token,
          templateId,
          owned.results.map((r) => r.name)
        );
      } catch (err) {
        console.error("Failed to send token email:", err);
      }
    }

    console.log(`Purchase: ${email} bought ${templateId} (token: ${tokenRow.token.slice(0, 12)}...)`);
  }

  return c.json({ received: true });
});

export { webhook };

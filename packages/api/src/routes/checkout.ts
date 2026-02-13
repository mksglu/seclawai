import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { createStripeClient } from "../lib/stripe.js";
import { generateToken, generateTokenId, generatePurchaseId } from "../lib/license.js";

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

  // Check if user already owns this template via token + purchases
  const existing = await c.env.DB.prepare(
    `SELECT p.id FROM purchases p
     JOIN tokens t ON p.token_id = t.id
     WHERE t.user_id = ? AND p.template_id = ?`
  )
    .bind(user.id, templateId)
    .first();

  if (existing) {
    return c.json({ error: "You already own this template. Check your dashboard." }, 400);
  }

  // Dev mode: no Stripe key — create token + purchase directly
  if (!c.env.STRIPE_SECRET_KEY) {
    // Find or create token for this user
    let tokenRow = await c.env.DB.prepare(
      "SELECT id, token FROM tokens WHERE user_id = ?"
    ).bind(user.id).first<{ id: string; token: string }>();

    if (!tokenRow) {
      // Try by email
      tokenRow = await c.env.DB.prepare(
        "SELECT id, token FROM tokens WHERE email = ?"
      ).bind(user.email).first<{ id: string; token: string }>();

      if (tokenRow) {
        // Link user_id to existing token
        await c.env.DB.prepare(
          "UPDATE tokens SET user_id = ? WHERE id = ?"
        ).bind(user.id, tokenRow.id).run();
      }
    }

    if (!tokenRow) {
      const tokenId = generateTokenId();
      const token = generateToken();
      await c.env.DB.prepare(
        "INSERT INTO tokens (id, email, token, user_id) VALUES (?, ?, ?, ?)"
      ).bind(tokenId, user.email, token, user.id).run();
      tokenRow = { id: tokenId, token };
    }

    // Add purchase
    const purchaseId = generatePurchaseId();
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO purchases (id, token_id, template_id, stripe_payment_id) VALUES (?, ?, ?, ?)"
    ).bind(purchaseId, tokenRow.id, templateId, `dev_${purchaseId}`).run();

    return c.json({
      dev: true,
      token: tokenRow.token,
      message: `Dev mode — purchase recorded. Use: npx seclaw add ${templateId} --key ${tokenRow.token}`,
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

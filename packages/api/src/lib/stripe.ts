import Stripe from "stripe";

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function verifyWebhookSignature(
  stripe: Stripe,
  body: string,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(
    body,
    signature,
    webhookSecret
  );
}

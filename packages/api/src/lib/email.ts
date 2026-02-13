import { Resend } from "resend";

export async function sendLicenseEmail(
  apiKey: string,
  to: string,
  templateName: string,
  licenseKey: string,
  templateId: string,
  expiresAt: string
) {
  const resend = new Resend(apiKey);

  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await resend.emails.send({
    from: "seclaw <noreply@seclawai.com>",
    to: [to],
    subject: `Your ${templateName} license key`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #e5e5e5; background: #0a0a0a;">
        <h2 style="color: #fff; margin: 0 0 8px;">Your ${templateName} is ready</h2>
        <p style="color: #a3a3a3; margin: 0 0 24px; font-size: 14px;">
          Run the command below to install your template.
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 8px;">License Key</p>
          <code style="color: #4ade80; font-size: 14px; word-break: break-all;">${licenseKey}</code>
        </div>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 8px;">Install Command</p>
          <code style="color: #4ade80; font-size: 14px;">npx seclaw add ${templateId} --key ${licenseKey}</code>
        </div>

        <p style="color: #737373; font-size: 12px; margin: 0;">
          This key expires on ${expiryDate}. You can regenerate it anytime from your
          <a href="https://seclawai.com/dashboard" style="color: #4ade80;">dashboard</a>.
        </p>
      </div>
    `,
  });
}

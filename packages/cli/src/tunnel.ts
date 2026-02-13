import { execa } from "execa";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Parse the quick tunnel URL from cloudflared container logs.
 */
export async function getTunnelUrl(
  cwd?: string,
  maxRetries = 20
): Promise<string | null> {
  const projectDir = cwd || process.cwd();

  // Check cached URL first
  const cachedPath = resolve(projectDir, ".tunnel-url");
  if (existsSync(cachedPath)) {
    try {
      const cached = (await readFile(cachedPath, "utf-8")).trim();
      if (cached.includes("trycloudflare.com")) {
        const fresh = await fetchTunnelUrlFromLogs(projectDir);
        if (fresh) {
          if (fresh !== cached) {
            await writeFile(cachedPath, fresh);
            return fresh;
          }
          return cached;
        }
        return cached;
      }
    } catch { /* proceed to live detection */ }
  }

  // Live detection from docker logs
  for (let i = 0; i < maxRetries; i++) {
    const url = await fetchTunnelUrlFromLogs(projectDir);
    if (url) {
      try { await writeFile(cachedPath, url); } catch { /* ok */ }
      return url;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function fetchTunnelUrlFromLogs(cwd: string): Promise<string | null> {
  try {
    const result = await execa(
      "docker",
      ["compose", "logs", "cloudflared", "--no-log-prefix"],
      { cwd, env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" } }
    );

    const combined = result.stdout + "\n" + result.stderr;
    const match = combined.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    );
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

/**
 * Set the Telegram bot webhook to point at the tunnel URL.
 * Agent listens on /webhook directly.
 */
export async function setTelegramWebhook(
  botToken: string,
  tunnelUrl: string
): Promise<boolean> {
  const webhookUrl = `${tunnelUrl}/webhook`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message", "callback_query"],
        }),
      }
    );

    const data = (await res.json()) as { ok: boolean; description?: string };
    return data.ok;
  } catch {
    return false;
  }
}

/**
 * Delete the cached tunnel URL.
 */
export async function clearTunnelCache(projectDir: string): Promise<void> {
  const cachedPath = resolve(projectDir, ".tunnel-url");
  if (existsSync(cachedPath)) {
    try { await writeFile(cachedPath, ""); } catch { /* ok */ }
  }
}

/**
 * Verify the Telegram bot token is valid and return bot info.
 */
export async function verifyTelegramToken(
  botToken: string
): Promise<{ valid: boolean; botName?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const data = (await res.json()) as {
      ok: boolean;
      result?: { first_name: string; username: string };
    };

    if (data.ok && data.result) {
      return { valid: true, botName: `@${data.result.username}` };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

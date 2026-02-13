import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execa } from "execa";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProjectDir } from "../docker.js";
import { getTunnelUrl, clearTunnelCache, setTelegramWebhook } from "../tunnel.js";

/**
 * Reconnect tunnel + Telegram webhook.
 *
 * 1. docker compose down + up (clean restart)
 * 2. Wait for agent health
 * 3. Wait for tunnel URL
 * 4. Set Telegram webhook
 */
export async function reconnect() {
  const projectDir = findProjectDir();
  if (!projectDir) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.error("No seclaw project found. Run from your project directory.");
    return;
  }

  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Reconnect`);
  const s = p.spinner();
  const env = { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" };

  // 1. Full restart
  s.start("Restarting all services...");
  await clearTunnelCache(projectDir);
  try {
    await execa("docker", ["compose", "down"], { cwd: projectDir, env });
    await execa("docker", ["compose", "up", "-d"], { cwd: projectDir, env });
  } catch {
    s.stop("Failed to restart services.");
    p.log.error("Is Docker running? Try: npx seclaw status");
    return;
  }
  s.stop("Services restarted.");

  // 2. Wait for agent
  s.start("Waiting for agent...");
  await new Promise((r) => setTimeout(r, 5000));
  s.stop("Agent starting.");

  // 3. Wait for tunnel URL
  s.start("Waiting for Cloudflare Tunnel...");
  const tunnelUrl = await getTunnelUrl(projectDir, 30);
  if (!tunnelUrl) {
    s.stop("Could not detect tunnel URL.");
    p.log.error("Tunnel may still be starting. Try again in a minute.");
    return;
  }
  s.stop(`Tunnel ready: ${pc.cyan(tunnelUrl)}`);

  // 4. Set Telegram webhook
  try {
    const envContent = await readFile(resolve(projectDir, ".env"), "utf-8");
    const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    if (tokenMatch && tokenMatch[1].includes(":")) {
      s.start("Setting Telegram webhook...");
      const ok = await setTelegramWebhook(tokenMatch[1].trim(), tunnelUrl);
      s.stop(ok ? "Telegram webhook updated!" : "Could not update webhook.");
    }
  } catch { /* no token */ }

  p.note(
    `${pc.dim("Tunnel:")} ${pc.cyan(tunnelUrl)}`,
    "seclaw"
  );

  p.outro("Reconnected! Send a message on Telegram to test.");
}

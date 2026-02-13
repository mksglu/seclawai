import * as p from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";
import { findProjectDir } from "../docker.js";
import { getTunnelUrl, setTelegramWebhook } from "../tunnel.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function upgrade() {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Upgrading...`);

  const projectDir = findProjectDir();
  if (!projectDir) {
    p.log.warn("No seclaw project found.");
    p.log.info(`  Start one with: ${pc.cyan("npx seclaw my-agent")}`);
    p.outro("");
    return;
  }

  const opts = {
    cwd: projectDir,
    env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
  };

  const s = p.spinner();

  s.start("Pulling latest images...");
  try {
    await execa("docker", ["compose", "pull"], opts);
    s.stop("Images updated.");
  } catch {
    s.stop("Failed to pull images.");
    p.log.error("Check your internet connection and try again.");
    return;
  }

  s.start("Restarting services...");
  try {
    await execa("docker", ["compose", "up", "-d", "--build", "--remove-orphans"], opts);
    s.stop("Services restarted.");
  } catch {
    s.stop("Failed to restart.");
    p.log.error(`Try manually: cd ${projectDir} && docker compose up -d`);
    return;
  }

  // Re-set Telegram webhook (tunnel URL changes on restart)
  s.start("Reconnecting tunnel...");
  const tunnelUrl = await getTunnelUrl(projectDir);
  if (tunnelUrl) {
    s.stop(`Tunnel ready: ${pc.cyan(tunnelUrl)}`);

    try {
      const env = await readFile(resolve(projectDir, ".env"), "utf-8");
      const tokenMatch = env.match(/TELEGRAM_BOT_TOKEN=(.+)/);
      if (tokenMatch && tokenMatch[1].includes(":")) {
        s.start("Updating Telegram webhook...");
        const ok = await setTelegramWebhook(tokenMatch[1].trim(), tunnelUrl);
        s.stop(ok ? "Telegram webhook updated!" : "Could not update webhook.");
      }
    } catch {
      // no token — skip
    }
  } else {
    s.stop("Tunnel starting...");
  }

  p.outro("Upgrade complete!");
}

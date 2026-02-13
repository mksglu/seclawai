import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import * as p from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";
import { getTunnelUrl } from "../tunnel.js";
import { findProjectDir } from "../docker.js";

export async function status() {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Status`);

  const projectDir = findProjectDir();
  if (!projectDir) {
    p.log.warn("No seclaw project found.");
    p.log.info(`  Start one with: ${pc.cyan("npx seclaw my-agent")}`);
    p.outro("");
    return;
  }

  try {
    const result = await execa("docker", ["compose", "ps", "--format", "json"], {
      cwd: projectDir,
      env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
    });

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    const services = lines.map(
      (l) =>
        JSON.parse(l) as {
          Name: string;
          Service: string;
          State: string;
          Status: string;
        }
    );

    if (services.length === 0) {
      p.log.warn("Services are not running.");
      p.log.info(`  Start with: ${pc.cyan("npx seclaw")} in ${pc.dim(projectDir)}`);
      p.outro("");
      return;
    }

    // Service table
    for (const svc of services) {
      const icon = svc.State === "running" ? pc.green("●") : pc.red("●");
      const health = svc.Status.includes("healthy")
        ? pc.green("healthy")
        : svc.Status.includes("starting")
          ? pc.yellow("starting")
          : pc.dim(svc.Status);
      p.log.info(`${icon} ${pc.bold(svc.Service.padEnd(20))} ${health}`);
    }

    // Summary info
    const infoLines: string[] = [];

    // Agent health
    let agentOk = false;
    try {
      const agentRes = await execa("docker", [
        "compose", "exec", "agent", "wget", "-q", "-O-", "http://localhost:3000/health",
      ], {
        cwd: projectDir,
        env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
      });
      if (agentRes.stdout.includes("ok")) agentOk = true;
    } catch { /* not ready */ }
    infoLines.push(
      `${pc.white(pc.bold("Agent:"))}     ${agentOk ? pc.green("healthy") : pc.yellow("starting...")}`
    );

    // Tunnel URL
    const tunnelUrl = await getTunnelUrl(projectDir, 3);
    if (tunnelUrl) {
      infoLines.push(`${pc.white(pc.bold("Public URL:"))} ${pc.cyan(tunnelUrl)}`);
    } else {
      infoLines.push(`${pc.white(pc.bold("Public URL:"))} ${pc.yellow("not detected yet")}`);
    }

    // Telegram bot from .env
    try {
      const env = await readFile(resolve(projectDir, ".env"), "utf-8");
      const tokenMatch = env.match(/TELEGRAM_BOT_TOKEN=(.+)/);
      if (tokenMatch && tokenMatch[1].includes(":")) {
        const botToken = tokenMatch[1].trim();
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
          const data = (await res.json()) as { ok: boolean; result?: { username: string } };
          if (data.ok && data.result) {
            infoLines.push(`${pc.white(pc.bold("Telegram:"))}   ${pc.green("@" + data.result.username)}`);
          }
        } catch {
          infoLines.push(`${pc.white(pc.bold("Telegram:"))}   ${pc.green("configured")}`);
        }
      }
    } catch { /* no .env or no token */ }

    // Composio
    try {
      const env = await readFile(resolve(projectDir, ".env"), "utf-8");
      if (env.includes("COMPOSIO_API_KEY=")) {
        infoLines.push(`${pc.white(pc.bold("Composio:"))}   ${pc.green("configured")}`);
      }
    } catch { /* */ }

    infoLines.push(`${pc.white(pc.bold("Workspace:"))}  ${resolve(projectDir, "shared")}`);
    infoLines.push(`${pc.white(pc.bold("Project:"))}   ${projectDir}`);

    p.note(infoLines.join("\n"), "seclaw");
  } catch {
    p.log.error("Could not check status. Is Docker running?");
  }

  p.outro(`${pc.white("Manage:")} npx seclaw stop | integrations | upgrade`);
}

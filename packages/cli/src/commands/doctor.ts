import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { execa } from "execa";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProjectDir, stopExistingSeclaw } from "../docker.js";
import { getTunnelUrl, clearTunnelCache, setTelegramWebhook } from "../tunnel.js";

interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
  fix?: () => Promise<string | null>;
}

const PASS = pc.green("PASS");
const FAIL = pc.red("FAIL");
const FIX = pc.cyan("FIX ");

export async function doctor() {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Doctor`);

  const results: CheckResult[] = [];
  const s = p.spinner();

  // 1. Docker
  s.start("Checking Docker...");
  const dockerCheck = await checkDockerHealth();
  results.push(dockerCheck);
  s.stop(formatCheck(dockerCheck));

  if (!dockerCheck.ok) {
    showSummary(results);
    return;
  }

  // 2. Project directory
  s.start("Finding project...");
  const projectDir = findProjectDir();
  const projectCheck: CheckResult = projectDir
    ? { name: "Project", ok: true, message: `Found at ${pc.dim(projectDir)}` }
    : { name: "Project", ok: false, message: "No seclaw project found. Run from your project directory." };
  results.push(projectCheck);
  s.stop(formatCheck(projectCheck));

  if (!projectDir) {
    showSummary(results);
    return;
  }

  const env = { ...process.env };

  // 3. Containers running
  s.start("Checking containers...");
  const containerChecks = await checkContainers(projectDir, env);
  results.push(...containerChecks);
  for (const c of containerChecks) {
    s.stop(formatCheck(c));
    if (containerChecks.indexOf(c) < containerChecks.length - 1) s.start("Checking containers...");
  }

  // 4. Agent health
  s.start("Checking agent...");
  const agentCheck = await checkAgentHealth(projectDir, env);
  results.push(agentCheck);
  s.stop(formatCheck(agentCheck));

  // 5. Tunnel
  s.start("Checking tunnel...");
  const tunnelCheck = await checkTunnel(projectDir);
  results.push(tunnelCheck);
  s.stop(formatCheck(tunnelCheck));

  // 6. Telegram
  s.start("Checking Telegram...");
  const telegramCheck = await checkTelegram(projectDir, tunnelCheck);
  results.push(telegramCheck);
  s.stop(formatCheck(telegramCheck));

  // 7. Composio
  s.start("Checking Composio...");
  const composioCheck = await checkComposio(projectDir);
  results.push(composioCheck);
  s.stop(formatCheck(composioCheck));

  // Summary
  showSummary(results);

  // Auto-fix
  const fixable = results.filter((r) => !r.ok && r.fix);
  if (fixable.length > 0) {
    let shouldFix = false;
    try {
      const answer = await p.confirm({
        message: `Found ${fixable.length} fixable issue(s). Auto-fix?`,
        initialValue: true,
      });
      shouldFix = !p.isCancel(answer) && !!answer;
    } catch {
      shouldFix = true;
    }

    if (!shouldFix) {
      p.outro("Run again after fixing manually.");
      return;
    }

    for (const check of fixable) {
      s.start(`Fixing: ${check.name}...`);
      try {
        const result = await check.fix!();
        s.stop(result ? `${FIX} ${check.name} — ${result}` : `${FAIL} ${check.name} — could not fix`);
      } catch (err) {
        s.stop(`${FAIL} ${check.name} — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    p.outro("Fixes applied! Run doctor again to verify.");
  } else {
    const allOk = results.every((r) => r.ok);
    p.outro(allOk ? "All checks passed!" : "Some issues need manual intervention.");
  }
}

async function checkDockerHealth(): Promise<CheckResult> {
  try {
    await execa("docker", ["version"]);
  } catch {
    return { name: "Docker installed", ok: false, message: "Docker is not installed" };
  }
  try {
    await execa("docker", ["info"]);
    return { name: "Docker", ok: true, message: "Running" };
  } catch {
    return { name: "Docker", ok: false, message: "Docker is not running. Open Docker Desktop." };
  }
}

const PROJECT_NAME = "seclaw";

async function getContainerName(projectDir: string, service: string): Promise<string | null> {
  try {
    const result = await execa("docker", [
      "compose", "ps", service, "--format", "{{.Name}}",
    ], { cwd: projectDir, env: { ...process.env, COMPOSE_PROJECT_NAME: PROJECT_NAME } });
    const name = result.stdout.trim().split("\n")[0];
    return name || null;
  } catch {
    return null;
  }
}

async function checkContainers(
  projectDir: string,
  _env: Record<string, string | undefined>
): Promise<CheckResult[]> {
  const expected = ["inngest", "agent", "cloudflared", "desktop-commander"];
  const results: CheckResult[] = [];
  const env = { ..._env, COMPOSE_PROJECT_NAME: PROJECT_NAME };

  for (const svc of expected) {
    const containerName = await getContainerName(projectDir, svc) || `${PROJECT_NAME}-${svc}-1`;
    try {
      const statusResult = await execa("docker", [
        "inspect", containerName, "--format", "{{.State.Status}}",
      ]);
      const status = statusResult.stdout.trim();

      // cloudflared has no HEALTHCHECK — skip health status check for it
      let health = "";
      if (svc !== "cloudflared") {
        try {
          const healthResult = await execa("docker", [
            "inspect", containerName, "--format", "{{.State.Health.Status}}",
          ]);
          health = healthResult.stdout.trim();
        } catch { /* no healthcheck */ }
      }

      if (status !== "running") {
        results.push({
          name: `Container: ${svc}`,
          ok: false,
          message: `Status: ${status}`,
          fix: async () => {
            await execa("docker", ["compose", "up", "-d", svc], { cwd: projectDir, env });
            return "Started";
          },
        });
      } else if (health && health !== "healthy" && health !== "") {
        results.push({
          name: `Container: ${svc}`,
          ok: false,
          message: `Running but ${health}`,
          fix: async () => {
            await execa("docker", ["compose", "restart", svc], { cwd: projectDir, env });
            return "Restarted";
          },
        });
      } else {
        results.push({ name: `Container: ${svc}`, ok: true, message: "Running" });
      }
    } catch {
      results.push({
        name: `Container: ${svc}`,
        ok: false,
        message: "Not found",
        fix: async () => {
          await execa("docker", ["compose", "up", "-d", svc], { cwd: projectDir, env });
          return "Started";
        },
      });
    }
  }

  return results;
}

async function checkAgentHealth(
  projectDir: string,
  _env: Record<string, string | undefined>
): Promise<CheckResult> {
  const env = { ..._env, COMPOSE_PROJECT_NAME: PROJECT_NAME };
  try {
    const result = await execa("docker", [
      "compose", "exec", "agent", "wget", "-q", "-O-", "http://localhost:3000/health",
    ], { cwd: projectDir, env });

    if (result.stdout.includes("ok")) {
      const data = JSON.parse(result.stdout);
      return {
        name: "Agent API",
        ok: true,
        message: `Healthy — ${data.tools || 0} tools loaded`,
      };
    }
    return { name: "Agent API", ok: false, message: "Unhealthy response" };
  } catch {
    return {
      name: "Agent API",
      ok: false,
      message: "Not reachable",
      fix: async () => {
        await execa("docker", ["compose", "restart", "agent"], { cwd: projectDir, env });
        return "Agent restarted";
      },
    };
  }
}

async function checkTunnel(projectDir: string): Promise<CheckResult & { tunnelUrl?: string }> {
  try {
    const result = await execa(
      "docker",
      ["compose", "logs", "cloudflared", "--no-log-prefix", "--tail", "50"],
      { cwd: projectDir, env: { ...process.env, COMPOSE_PROJECT_NAME: PROJECT_NAME } }
    );
    const combined = result.stdout + "\n" + result.stderr;
    const matches = [...combined.matchAll(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g)];

    if (matches.length === 0) {
      return {
        name: "Tunnel",
        ok: false,
        message: "No URL found in logs",
        fix: async () => {
          await clearTunnelCache(projectDir);
          const env = { ...process.env, COMPOSE_PROJECT_NAME: PROJECT_NAME };
          await execa("docker", ["compose", "restart", "cloudflared"], { cwd: projectDir, env });
          const url = await getTunnelUrl(projectDir, 20);
          return url ? `New tunnel: ${url}` : "Restarted cloudflared";
        },
      };
    }

    const tunnelUrl = matches[matches.length - 1][0];

    try {
      const res = await fetch(`${tunnelUrl}/health`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        return { name: "Tunnel", ok: true, message: tunnelUrl, tunnelUrl };
      }
      return {
        name: "Tunnel",
        ok: false,
        message: `URL exists but returns HTTP ${res.status}`,
        tunnelUrl,
      };
    } catch {
      return {
        name: "Tunnel",
        ok: false,
        message: `URL found (${pc.dim(tunnelUrl)}) but not reachable`,
        tunnelUrl,
        fix: async () => {
          await clearTunnelCache(projectDir);
          const env = { ...process.env, COMPOSE_PROJECT_NAME: PROJECT_NAME };
          await execa("docker", ["compose", "restart", "cloudflared"], { cwd: projectDir, env });
          const newUrl = await getTunnelUrl(projectDir, 20);
          return newUrl ? `New tunnel: ${newUrl}` : "Restarted cloudflared — run doctor again";
        },
      };
    }
  } catch {
    return { name: "Tunnel", ok: false, message: "Cannot read cloudflared logs" };
  }
}

async function checkTelegram(
  projectDir: string,
  tunnelCheck: CheckResult & { tunnelUrl?: string }
): Promise<CheckResult> {
  const envPath = resolve(projectDir, ".env");
  if (!existsSync(envPath)) {
    return { name: "Telegram", ok: false, message: ".env not found" };
  }

  let botToken = "";
  try {
    const envContent = await readFile(envPath, "utf-8");
    const match = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    botToken = match?.[1]?.trim() || "";
  } catch {
    return { name: "Telegram", ok: false, message: "Cannot read .env" };
  }

  if (!botToken || !botToken.includes(":")) {
    return { name: "Telegram", ok: false, message: "No valid bot token in .env" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = (await res.json()) as { ok: boolean; result?: { username: string } };
    if (!data.ok) {
      return { name: "Telegram", ok: false, message: "Bot token is invalid" };
    }

    const botName = `@${data.result!.username}`;

    const whRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const whData = (await whRes.json()) as {
      ok: boolean;
      result?: {
        url: string;
        last_error_date?: number;
        last_error_message?: string;
        pending_update_count?: number;
      };
    };

    if (!whData.ok || !whData.result) {
      return { name: "Telegram", ok: false, message: "Cannot get webhook info" };
    }

    const wh = whData.result;
    const tunnelUrl = tunnelCheck.tunnelUrl || "";

    // Shared fix: get fresh tunnel URL and set webhook
    const webhookFix = async () => {
      const freshUrl = await getTunnelUrl(projectDir, 5);
      if (!freshUrl) return "No tunnel URL available — fix tunnel first";
      const ok = await setTelegramWebhook(botToken, freshUrl);
      return ok ? `Webhook set to ${freshUrl}` : "Could not set webhook";
    };

    if (!wh.url) {
      return {
        name: `Telegram (${botName})`,
        ok: false,
        message: "Webhook not set",
        fix: webhookFix,
      };
    }

    if (tunnelUrl && !wh.url.includes(tunnelUrl.replace("https://", ""))) {
      return {
        name: `Telegram (${botName})`,
        ok: false,
        message: "Webhook points to old tunnel",
        fix: webhookFix,
      };
    }

    if (wh.last_error_message) {
      const age = wh.last_error_date
        ? Math.floor((Date.now() / 1000 - wh.last_error_date) / 60)
        : 0;
      return {
        name: `Telegram (${botName})`,
        ok: false,
        message: `Error ${age}m ago: ${wh.last_error_message}`,
        fix: async () => {
          // Get fresh tunnel URL (may have been renewed by tunnel fix)
          const freshUrl = await getTunnelUrl(projectDir, 5);
          if (!freshUrl) return "No tunnel URL available — fix tunnel first";
          const ok = await setTelegramWebhook(botToken, freshUrl);
          return ok ? `Webhook re-set to ${freshUrl}` : "Could not set webhook";
        },
      };
    }

    return {
      name: `Telegram (${botName})`,
      ok: true,
      message: `Webhook active, ${wh.pending_update_count || 0} pending`,
    };
  } catch {
    return { name: "Telegram", ok: false, message: "Cannot reach Telegram API" };
  }
}

async function checkComposio(projectDir: string): Promise<CheckResult> {
  try {
    const env = await readFile(resolve(projectDir, ".env"), "utf-8");
    const match = env.match(/COMPOSIO_API_KEY=(\S+)/);
    if (!match) {
      return {
        name: "Composio",
        ok: false,
        message: `Not configured — run ${pc.cyan("npx seclaw integrations")}`,
      };
    }
    return { name: "Composio", ok: true, message: "API key configured" };
  } catch {
    return { name: "Composio", ok: false, message: "Cannot read .env" };
  }
}

function formatCheck(check: CheckResult): string {
  const status = check.ok ? PASS : FAIL;
  const fixable = !check.ok && check.fix ? pc.dim(" (auto-fixable)") : "";
  return `${status} ${check.name} — ${check.message}${fixable}`;
}

function showSummary(results: CheckResult[]) {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const fixable = results.filter((r) => !r.ok && r.fix).length;

  p.log.message("");
  p.log.message(
    `${pc.bold("Summary:")} ${pc.green(`${passed} passed`)}, ` +
    `${failed > 0 ? pc.red(`${failed} failed`) : pc.green("0 failed")}` +
    (fixable > 0 ? `, ${pc.cyan(`${fixable} auto-fixable`)}` : "")
  );
}

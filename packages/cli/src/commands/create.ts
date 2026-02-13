import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import * as p from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";
import { collectSetupAnswers } from "../prompts.js";
import { scaffoldProject } from "../scaffold.js";
import { getTunnelUrl, setTelegramWebhook } from "../tunnel.js";
import { checkDocker, stopExistingSeclaw, findRunningSeclaw, findProjectDir } from "../docker.js";

export async function create(directory: string) {
  let targetDir = resolve(process.cwd(), directory);

  // --- Ensure target directory exists ---
  try {
    await mkdir(targetDir, { recursive: true });
  } catch (err) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.error(`Cannot create directory: ${pc.cyan(targetDir)}`);
    p.log.info(pc.dim(err instanceof Error ? err.message : String(err)));
    p.outro(`Try a different path, e.g.: ${pc.cyan(`npx seclaw create ./${directory.replace(/^\/+/, "")}`)}`);
    return;
  }

  // --- Pre-flight: Docker check ---
  const docker = await checkDocker();
  if (!docker.ok) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.error(docker.error!);
    p.outro("Install Docker and try again.");
    return;
  }

  // --- Running instance detected? ---
  const running = await findRunningSeclaw();
  const existingDir = findProjectDir();
  const hasExisting = existsSync(resolve(targetDir, "docker-compose.yml"));

  if (running || existingDir || hasExisting) {
    const location = existingDir || running?.dir || (hasExisting ? targetDir : null);

    // Use the existing project directory if found (preserves templates, data, etc.)
    if (location) {
      targetDir = location;
    }

    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.warn(
      `An agent is already running` +
      (location ? ` at ${pc.cyan(location)}` : "")
    );

    const proceed = await p.confirm({
      message: "Stop everything and start fresh?",
      initialValue: false,
    });
    if (p.isCancel(proceed) || !proceed) {
      p.outro("Cancelled.");
      return;
    }
  }

  // --- Setup wizard ---
  const answers = await collectSetupAnswers(targetDir);
  const s = p.spinner();

  // 1. Stop old containers
  s.start("Preparing environment...");
  try {
    await stopExistingSeclaw();
    s.stop("Environment ready.");
  } catch (err) {
    s.stop("Warning: could not stop existing containers.");
    p.log.warn(err instanceof Error ? err.message : String(err));
  }

  // 2. Scaffold project files
  s.start("Creating project files...");
  try {
    await scaffoldProject(targetDir, answers);
    s.stop("Project files created.");
  } catch (err) {
    s.stop("Failed to create project files.");
    p.log.error(err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      p.log.info(pc.dim(err.stack));
    }
    p.outro("Fix the issue above and try again.");
    return;
  }

  // 3. Copy template system prompt
  if (answers.template !== "blank") {
    s.start(`Copying template: ${answers.template}...`);
    try {
      const templateSrc = getTemplatePath(answers.template, targetDir);
      const templateDest = resolve(targetDir, "templates", answers.template);

      if (templateSrc && existsSync(templateSrc)) {
        // Only copy if source != destination (skip for already-installed templates)
        if (resolve(templateSrc) !== resolve(templateDest)) {
          await cp(templateSrc, templateDest, { recursive: true });
        }

        // Copy system-prompt.md to workspace config for the agent to find
        const wsDir = resolve(targetDir, answers.workspacePath || "./shared");
        const promptSrc = resolve(templateSrc, "system-prompt.md");
        if (existsSync(promptSrc)) {
          await cp(promptSrc, resolve(wsDir, "config", "system-prompt.md"));
        }

        // Copy schedules.json to workspace config for the scheduler to find
        const schedulesSrc = resolve(templateSrc, "schedules.json");
        if (existsSync(schedulesSrc)) {
          await cp(schedulesSrc, resolve(wsDir, "config", "schedules.json"));
        }

        s.stop(`Template ready.`);
      } else {
        s.stop("Template will be available after setup.");
      }
    } catch (err) {
      s.stop("Failed to copy template.");
      p.log.error(err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        p.log.info(pc.dim(err.stack));
      }
      p.outro("Fix the issue above and try again.");
      return;
    }
  }

  // 4. Start services
  await startServices(targetDir, s);

  // 5. Wait for agent health
  s.start("Waiting for agent...");
  const ready = await waitForAgent(targetDir);
  s.stop(ready ? "Agent is ready!" : "Agent is starting (may take a moment).");

  // 6. Get tunnel URL
  let tunnelUrl = "";
  s.start("Waiting for Cloudflare Tunnel...");
  const url = await getTunnelUrl(targetDir);
  if (url) {
    tunnelUrl = url;
    s.stop(`Tunnel ready: ${pc.cyan(tunnelUrl)}`);
  } else {
    s.stop("Tunnel starting — check with: npx seclaw status");
  }

  // 7. Set Telegram webhook (with retry — tunnel needs time to propagate)
  if (tunnelUrl && answers.telegramToken) {
    s.start("Setting up Telegram webhook...");
    // Small delay to let tunnel fully propagate to Cloudflare's edge
    await new Promise((r) => setTimeout(r, 3000));
    const ok = await setTelegramWebhook(answers.telegramToken, tunnelUrl);
    if (ok) {
      s.stop("Telegram webhook configured!");
    } else {
      s.stop("Webhook not set — will retry...");
      // Second attempt after longer delay
      s.start("Retrying webhook...");
      await new Promise((r) => setTimeout(r, 5000));
      const retry = await setTelegramWebhook(answers.telegramToken, tunnelUrl);
      s.stop(retry
        ? "Telegram webhook configured!"
        : `Run ${pc.cyan("npx seclaw doctor")} to fix webhook.`
      );
    }
  }

  // Done!
  showSuccess(targetDir, tunnelUrl, answers.telegramBotName, answers.llmProvider, answers.composioApiKey, answers.workspacePath);
}

/**
 * Wait for the agent container to be healthy.
 */
async function waitForAgent(
  targetDir: string,
  maxRetries = 30,
  intervalMs = 2000
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await execa("docker", [
        "compose", "ps", "--format", "json", "agent",
      ], {
        cwd: targetDir,
        env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
      });

      const lines = result.stdout.trim().split("\n");
      for (const line of lines) {
        try {
          const container = JSON.parse(line);
          if (container.Health === "healthy" || container.State === "running") {
            // Also verify via HTTP
            try {
              const healthRes = await fetch("http://localhost:3000/health");
              if (healthRes.ok) return true;
            } catch { /* agent port not exposed to host, check via docker */ }
            // If we can't reach it directly, trust docker health
            if (container.Health === "healthy") return true;
          }
        } catch { /* not JSON */ }
      }
    } catch { /* compose not ready */ }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Start Docker services with good error messages.
 */
async function startServices(
  targetDir: string,
  s: ReturnType<typeof p.spinner>
) {
  s.start("Starting services (first run builds images, ~1-2 min)...");
  try {
    await execa("docker", ["compose", "up", "-d", "--build"], {
      cwd: targetDir,
      env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
    });
    s.stop("All services started.");
  } catch (err: unknown) {
    s.stop("Failed to start services.");

    const stderr =
      err instanceof Error && "stderr" in err
        ? (err as { stderr: string }).stderr
        : "";

    if (stderr.includes("port is already allocated") || stderr.includes("address already in use")) {
      p.log.error("Port 3000 is already in use by another application.");
      p.log.info(`  Run: ${pc.cyan("npx seclaw stop")} first, then try again.`);
    } else if (stderr.includes("Cannot connect to the Docker daemon")) {
      p.log.error("Docker is not running. Open Docker Desktop and try again.");
    } else {
      p.log.error("Docker error:");
      p.log.info(pc.dim(stderr || "Unknown error — check Docker Desktop for details."));
      p.log.info(`  Manual start: ${pc.cyan(`cd ${targetDir} && docker compose up -d --build`)}`);
    }

    p.outro("Fix the issue above and try again.");
    process.exit(1);
  }
}

const PROVIDER_LABELS: Record<string, { model: string; cost: string }> = {
  openrouter: { model: "Gemini 3 Flash", cost: "~$3-10/mo" },
  anthropic:  { model: "Claude Sonnet 4.5", cost: "~$15-30/mo" },
  openai:     { model: "GPT-4o mini", cost: "~$3-10/mo" },
  gemini:     { model: "Gemini 2.5 Flash", cost: "~$3-10/mo" },
};

function showSuccess(
  targetDir: string,
  tunnelUrl: string,
  botName: string,
  provider?: string,
  composioKey?: string,
  workspacePath?: string,
) {
  const label = (s: string) => pc.white(pc.bold(s));
  const lines = [
    `${pc.green(pc.bold("Your AI agent is live!"))}`,
    "",
  ];

  if (tunnelUrl) {
    lines.push(`${label("Public URL:")} ${pc.cyan(tunnelUrl)}`);
  }

  if (botName) {
    lines.push(`${label("Telegram:")}   Open ${pc.green(botName)} and send a message`);
  }

  const ws = workspacePath || "./shared";
  const wsAbsolute = resolve(targetDir, ws);
  lines.push(`${label("Workspace:")}  ${pc.white(wsAbsolute + "/")}`);

  if (provider) {
    const info = PROVIDER_LABELS[provider];
    if (info) {
      lines.push(`${label("Model:")}      ${pc.cyan(info.model)}`);
      lines.push(`${label("Est. cost:")}  ${pc.green(info.cost)}`);
    }
  }

  if (composioKey) {
    lines.push(`${label("Composio:")}   ${pc.green("Connected")} — run ${pc.cyan("npx seclaw integrations")} to add Gmail, etc.`);
  } else {
    lines.push(`${label("Composio:")}   ${pc.yellow("Skipped")} — run ${pc.cyan("npx seclaw integrations")} later to add integrations`);
  }

  p.note(lines.join("\n"), "seclaw");

  if (provider === "openrouter") {
    p.log.info(
      `${pc.bold("Gemini 3 Flash:")} Fast, affordable, and great with tools.\n` +
      `  Change model anytime in .env → LLM_MODEL=your/model`
    );
  }

  p.outro(`${pc.white("Manage:")} npx seclaw status | stop | integrations`);
}

function getTemplatePath(template: string, targetDir?: string): string | null {
  // 1. Already installed in project (paid templates from `npx seclaw add`)
  if (targetDir) {
    const installed = resolve(targetDir, "templates", template);
    if (existsSync(installed)) return installed;
  }

  // 2. Bundled free templates
  const bundled = resolve(import.meta.dirname, "templates", "free", template);
  if (existsSync(bundled)) return bundled;

  // 3. Bundled paid templates
  const bundledPaid = resolve(import.meta.dirname, "templates", "paid", template);
  if (existsSync(bundledPaid)) return bundledPaid;

  // 4. Local dev fallback
  const local = resolve(process.cwd(), "packages", "cli", "templates", "free", template);
  if (existsSync(local)) return local;

  return null;
}

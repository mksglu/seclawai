import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";

interface InstalledConfig {
  capabilities: string[];
  active?: string;
}

interface ScheduleEntry {
  id: string;
  enabled?: boolean;
}

interface ScheduleFile {
  schedules: ScheduleEntry[];
}

export async function templates() {
  const { configDir, installed } = await loadInstalled();

  if (!installed || installed.capabilities.length === 0) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Templates`);
    p.log.warning("No templates installed.");
    p.log.info(`Add one: ${pc.cyan("npx seclaw add <template>")}`);
    p.log.info(`Browse:  ${pc.cyan("https://seclawai.com/templates")}`);
    p.outro("");
    return;
  }

  const capabilities = installed.capabilities;
  const activeMode = installed.active || "auto";

  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Installed Templates (${capabilities.length})`);

  for (const capId of capabilities) {
    const displayName = capId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Check prompt status
    const promptPath = resolve(configDir, "capabilities", capId, "system-prompt.md");
    const hasPrompt = existsSync(promptPath);

    // Count enabled schedules
    const schedPath = resolve(configDir, "capabilities", capId, "schedules.json");
    let schedCount = 0;
    if (existsSync(schedPath)) {
      try {
        const schedData = JSON.parse(await readFile(schedPath, "utf-8")) as ScheduleFile;
        schedCount = schedData.schedules.filter((s) => s.enabled !== false).length;
      } catch { /* ignore */ }
    }

    const icon = hasPrompt ? pc.green("✓") : pc.yellow("⚠");
    const schedLabel = schedCount > 0 ? pc.dim(` — ${schedCount} schedule${schedCount > 1 ? "s" : ""}`) : "";

    p.log.info(`${icon} ${pc.bold(displayName)}${schedLabel}`);
  }

  // Show active mode
  let modeLabel: string;
  if (activeMode === "auto") {
    modeLabel = `Auto — all ${capabilities.length} capabilities active`;
  } else {
    const activeName = activeMode
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    modeLabel = `${activeName} (focus mode)`;
  }
  p.log.info("");
  p.log.info(`Mode: ${pc.cyan(modeLabel)}`);

  if (capabilities.length >= 2) {
    p.log.info(`Switch: ${pc.dim("npx seclaw switch")}`);
  }

  p.outro("");
}

async function loadInstalled(): Promise<{ configDir: string; installed: InstalledConfig | null }> {
  let wsHostPath = "shared";
  try {
    const envContent = await readFile(resolve(process.cwd(), ".env"), "utf-8");
    const wsMatch = envContent.match(/WORKSPACE_HOST_PATH=(.+)/);
    if (wsMatch?.[1]?.trim()) wsHostPath = wsMatch[1].trim();
  } catch { /* */ }

  const configDir = resolve(process.cwd(), wsHostPath, "config");
  const installedPath = resolve(configDir, "installed.json");

  if (!existsSync(installedPath)) return { configDir, installed: null };

  try {
    const installed = JSON.parse(await readFile(installedPath, "utf-8")) as InstalledConfig;
    return { configDir, installed };
  } catch {
    return { configDir, installed: null };
  }
}

export { loadInstalled };

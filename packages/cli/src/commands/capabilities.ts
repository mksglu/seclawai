import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile, rm } from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProjectDir } from "../docker.js";

interface InstalledConfig {
  capabilities: string[];
}

export async function capabilities() {
  const projectDir = findProjectDir();
  if (!projectDir) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.error("No seclaw project found. Run from your project directory.");
    return;
  }

  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Capabilities`);

  const installedPath = resolve(projectDir, "shared", "config", "installed.json");
  let installed: InstalledConfig = { capabilities: [] };

  try {
    if (existsSync(installedPath)) {
      installed = JSON.parse(await readFile(installedPath, "utf-8"));
    }
  } catch { /* empty */ }

  if (installed.capabilities.length === 0) {
    p.log.warn("No capabilities installed.");
    p.log.info(`Add one with: ${pc.cyan("npx seclaw add <template>")}`);
    p.outro("Done.");
    return;
  }

  // Show installed capabilities
  const lines: string[] = [];
  for (const cap of installed.capabilities) {
    const schedPath = resolve(projectDir, "shared", "config", "capabilities", cap, "schedules.json");
    let schedCount = 0;
    try {
      if (existsSync(schedPath)) {
        const data = JSON.parse(await readFile(schedPath, "utf-8"));
        schedCount = (data.schedules || []).length;
      }
    } catch { /* ignore */ }

    const schedInfo = schedCount > 0 ? `${schedCount} schedule${schedCount > 1 ? "s" : ""}` : "no schedules";
    lines.push(`  ${pc.green("\u25CF")} ${pc.bold(cap)}  ${pc.dim(`(${schedInfo})`)}`);
  }

  p.log.message(lines.join("\n"));

  // Action
  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "remove", label: "Remove a capability" },
      { value: "cancel", label: "Done" },
    ],
  });

  if (p.isCancel(action) || action === "cancel") {
    p.outro(`${installed.capabilities.length} capabilities active.`);
    return;
  }

  // Remove flow
  const toRemove = await p.select({
    message: "Remove which capability?",
    options: [
      ...installed.capabilities.map(c => ({ value: c, label: c })),
      { value: "_cancel", label: "Cancel" },
    ],
  });

  if (p.isCancel(toRemove) || toRemove === "_cancel") {
    p.outro("Cancelled.");
    return;
  }

  const confirmed = await p.confirm({
    message: `Remove ${pc.bold(toRemove as string)}? Its schedules will be deactivated.`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro("Cancelled.");
    return;
  }

  // Remove capability
  const capDir = resolve(projectDir, "shared", "config", "capabilities", toRemove as string);
  try {
    await rm(capDir, { recursive: true, force: true });
  } catch { /* may not exist */ }

  installed.capabilities = installed.capabilities.filter(c => c !== toRemove);
  await writeFile(installedPath, JSON.stringify(installed, null, 2) + "\n");

  p.log.success(`${pc.bold(toRemove as string)} removed.`);
  p.log.info("Restart agent to apply changes.");
  p.outro(`${installed.capabilities.length} capabilities active.`);
}

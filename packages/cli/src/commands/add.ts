import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, mkdir, readFile, cp } from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProjectDir } from "../docker.js";

const API_URL = process.env.SECLAW_API || "https://seclawai.com";

const FREE_TEMPLATES = ["productivity-agent", "data-analyst"];

interface ActivateResponse {
  templateId: string;
  templateName: string;
  files: Record<string, string>;
}

interface InstalledConfig {
  capabilities: string[];
}

export async function add(
  template: string,
  options: { key?: string }
) {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Adding template: ${template}`);

  const isFree = FREE_TEMPLATES.includes(template);
  const s = p.spinner();

  // Find project root — uses Docker labels, then cwd, then well-known paths
  const projectDir = findProjectDir() || process.cwd();

  // Resolve template target directory:
  // - Monorepo dev: packages/templates/paid/
  // - Global install: <projectDir>/templates/
  const monorepoTemplatesDir = resolve(import.meta.dirname, "..", "..", "templates", "paid");
  const templateDir = !isFree && existsSync(resolve(import.meta.dirname, "..", "..", "templates"))
    ? resolve(monorepoTemplatesDir, template)
    : resolve(projectDir, "templates", template);

  if (isFree) {
    // Free template — bundled locally with the CLI
    s.start("Setting up free template...");

    const bundledPath = resolve(
      import.meta.dirname,
      "templates",
      "free",
      template
    );

    if (!existsSync(bundledPath)) {
      s.stop("Template not found.");
      p.log.error("Bundled template not found. Try updating: npm i -g seclaw");
      return;
    }

    await mkdir(templateDir, { recursive: true });

    const filesToCopy = [
      "system-prompt.md",
      "config.json",
      "README.md",
      "manifest.json",
      "schedules.json",
    ];

    for (const file of filesToCopy) {
      const src = resolve(bundledPath, file);
      if (existsSync(src)) {
        const content = await readFile(src, "utf-8");
        await writeFile(resolve(templateDir, file), content);
      }
    }

    s.stop("Template files ready.");
  } else {
    // Paid template — download via API
    if (!options.key) {
      p.log.error(
        `${pc.bold(template)} is a paid template. Provide your token with --key`
      );
      p.log.info("");
      p.log.info(`  ${pc.dim("1.")} Purchase at ${pc.cyan("https://seclawai.com/templates")}`);
      p.log.info(`  ${pc.dim("2.")} npx seclaw add ${template} --key YOUR_TOKEN`);
      return;
    }

    s.start("Validating token...");

    try {
      const res = await fetch(`${API_URL}/api/templates/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: options.key, templateId: template }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        s.stop("Activation failed.");
        p.log.error(err.error || "Invalid token or template not owned.");
        return;
      }

      const data = (await res.json()) as ActivateResponse;
      s.stop(`Template ready: ${pc.green(data.templateName)}`);

      // Write all template files
      await mkdir(templateDir, { recursive: true });

      for (const [filename, content] of Object.entries(data.files)) {
        await writeFile(resolve(templateDir, filename), content);
      }
    } catch (err) {
      s.stop("Failed.");
      p.log.error(`Network error: ${err}`);
      p.log.info("Check your connection and try again.");
      return;
    }
  }

  // Stack capability: copy system-prompt.md and schedules.json into capabilities dir
  // Read workspace path from .env or default to ./shared
  let wsHostPath = "shared";
  try {
    const envContent = await readFile(resolve(projectDir, ".env"), "utf-8");
    const wsMatch = envContent.match(/WORKSPACE_HOST_PATH=(.+)/);
    if (wsMatch?.[1]?.trim()) wsHostPath = wsMatch[1].trim();
  } catch { /* */ }
  const configDir = resolve(projectDir, wsHostPath, "config");

  if (existsSync(configDir)) {
    const capDir = resolve(configDir, "capabilities", template);
    await mkdir(capDir, { recursive: true });

    // Copy system-prompt.md to capability directory
    const promptPath = resolve(templateDir, "system-prompt.md");
    if (existsSync(promptPath)) {
      await cp(promptPath, resolve(capDir, "system-prompt.md"));
    }

    // Copy schedules.json to capability directory (if exists)
    const schedulesPath = resolve(templateDir, "schedules.json");
    if (existsSync(schedulesPath)) {
      await cp(schedulesPath, resolve(capDir, "schedules.json"));
    }

    // Update installed.json
    const installedPath = resolve(configDir, "installed.json");
    let installed: InstalledConfig = { capabilities: [] };

    try {
      if (existsSync(installedPath)) {
        installed = JSON.parse(await readFile(installedPath, "utf-8"));
      }
    } catch { /* start fresh */ }

    if (!installed.capabilities.includes(template)) {
      installed.capabilities.push(template);
    }

    await writeFile(installedPath, JSON.stringify(installed, null, 2) + "\n");

    // Read template name from manifest if available
    let templateName = template;
    const manifestPath = resolve(templateDir, "manifest.json");
    try {
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
        if (manifest.name) templateName = manifest.name;
      }
    } catch { /* use id */ }

    p.log.success(
      `Capability '${pc.bold(templateName)}' installed. ${pc.cyan(String(installed.capabilities.length))} capabilities active.`
    );
    p.log.info(`Run ${pc.cyan("docker compose restart agent")} to apply.`);
  }

  p.outro(`${pc.green("Done!")} Template ${pc.bold(template)} is ready.`);
}

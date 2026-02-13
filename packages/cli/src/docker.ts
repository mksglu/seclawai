import { execa, execaSync } from "execa";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Check if Docker is installed and running.
 */
export async function checkDocker(): Promise<{ ok: boolean; error?: string }> {
  try {
    await execa("docker", ["version"]);
  } catch {
    return { ok: false, error: "Docker is not installed. Download it at https://docker.com/get-started" };
  }

  try {
    await execa("docker", ["info"]);
  } catch {
    return { ok: false, error: "Docker is not running. Open Docker Desktop and try again." };
  }

  return { ok: true };
}

/**
 * Stop any running seclaw containers to free ports.
 * Detects seclaw projects by checking for the agent-net network or inngest/agent services.
 */
export async function stopExistingSeclaw(): Promise<void> {
  try {
    // Find all compose projects that have an "agent" or "inngest" service (seclaw signature)
    const result = await execa("docker", [
      "ps", "-a",
      "--filter", "label=com.docker.compose.service=agent",
      "--format", "{{index .Labels \"com.docker.compose.project\"}}",
    ]);

    const projects = new Set<string>();
    for (const line of result.stdout.split("\n").filter(Boolean)) {
      projects.add(line.trim());
    }

    // Also check for anything holding port 8288 (inngest)
    try {
      const portResult = await execa("docker", [
        "ps", "--filter", "publish=8288",
        "--format", "{{index .Labels \"com.docker.compose.project\"}}",
      ]);
      for (const line of portResult.stdout.split("\n").filter(Boolean)) {
        projects.add(line.trim());
      }
    } catch { /* ignore */ }

    for (const project of projects) {
      if (!project) continue;
      try {
        await execa("docker", ["compose", "-p", project, "down"]);
      } catch { /* ignore */ }
    }
  } catch { /* No containers running */ }
}

/**
 * Check if there's a running seclaw instance.
 * Checks for a running agent container.
 */
export async function findRunningSeclaw(): Promise<{ dir: string | null } | null> {
  // Check for agent container first (new architecture)
  const agentResult = await findContainerByLabel("seclaw");
  if (agentResult) return agentResult;

  // Fallback: check for container on port 5678
  try {
    const result = await execa("docker", [
      "ps", "--filter", "publish=5678", "--format", "{{.Names}}",
    ]);
    const names = result.stdout.trim();
    if (!names) return null;

    const containerName = names.split("\n")[0];
    try {
      const inspect = await execa("docker", [
        "inspect", containerName,
        "--format", "{{index .Config.Labels \"com.docker.compose.project.working_dir\"}}",
      ]);
      return { dir: inspect.stdout.trim() || null };
    } catch {
      return { dir: null };
    }
  } catch {
    return null;
  }
}

async function findContainerByLabel(project: string): Promise<{ dir: string | null } | null> {
  try {
    const result = await execa("docker", [
      "ps",
      "--filter", `label=com.docker.compose.project=${project}`,
      "--format", "{{.Names}}",
    ]);
    const names = result.stdout.trim();
    if (!names) return null;

    const containerName = names.split("\n")[0];
    try {
      const inspect = await execa("docker", [
        "inspect", containerName,
        "--format", "{{index .Config.Labels \"com.docker.compose.project.working_dir\"}}",
      ]);
      return { dir: inspect.stdout.trim() || null };
    } catch {
      return { dir: null };
    }
  } catch {
    return null;
  }
}

/**
 * Find the seclaw project directory by looking for docker-compose.yml
 * with agent service. Checks running containers first, then common paths.
 */
export function findProjectDir(): string | null {
  // 1. Check running containers for the working dir (any compose project with agent service)
  try {
    const result = execaSync("docker", [
      "ps",
      "--filter", "label=com.docker.compose.service=agent",
      "--format", "{{.Names}}",
    ]);
    const names = result.stdout.trim().split("\n").filter(Boolean);
    for (const name of names) {
      try {
        const inspect = execaSync("docker", [
          "inspect", name,
          "--format", "{{index .Config.Labels \"com.docker.compose.project.working_dir\"}}",
        ]);
        const dir = inspect.stdout.trim();
        if (dir && existsSync(resolve(dir, "docker-compose.yml"))) {
          return dir;
        }
      } catch { /* skip */ }
    }
  } catch { /* no containers */ }

  // 2. Static candidates
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.env.HOME || "~", "seclaw"),
    resolve(process.env.HOME || "~", "my-agent"),
  ];

  for (const dir of candidates) {
    const composePath = resolve(dir, "docker-compose.yml");
    if (existsSync(composePath)) {
      try {
        const content = readFileSync(composePath, "utf-8");
        if (content.includes("agent") && content.includes("agent-net")) {
          return dir;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

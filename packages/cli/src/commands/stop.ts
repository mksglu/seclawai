import * as p from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";
import { findProjectDir } from "../docker.js";

export async function stop() {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Stopping services...`);

  const projectDir = findProjectDir();
  if (!projectDir) {
    p.log.warn("No seclaw project found. Nothing to stop.");
    p.outro("");
    return;
  }

  const s = p.spinner();
  s.start("Stopping containers...");

  try {
    await execa("docker", ["compose", "down"], {
      cwd: projectDir,
      env: { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" },
    });
    s.stop("All services stopped.");
  } catch {
    s.stop("Failed to stop services.");
    p.log.error(`Try manually: cd ${projectDir} && docker compose down`);
  }

  p.outro(`Restart anytime: ${pc.cyan("npx seclaw")} in ${pc.dim(projectDir)}`);
}

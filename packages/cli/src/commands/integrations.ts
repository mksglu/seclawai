import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { platform, homedir } from "node:os";
import { execa } from "execa";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProjectDir as findProject } from "../docker.js";

/** Composio-supported integrations */
const INTEGRATIONS: Record<string, { name: string; app: string; hint: string }> = {
  gmail:             { name: "Gmail",           app: "gmail",           hint: "email reading, sending, labels" },
  "google-drive":    { name: "Google Drive",    app: "googledrive",     hint: "file access, sharing" },
  "google-calendar": { name: "Google Calendar", app: "googlecalendar",  hint: "events, scheduling" },
  "google-sheets":   { name: "Google Sheets",   app: "googlesheets",   hint: "spreadsheets" },
  notion:            { name: "Notion",          app: "notion",          hint: "notes, databases, pages" },
  github:            { name: "GitHub",          app: "github",          hint: "repos, issues, PRs" },
  slack:             { name: "Slack",           app: "slack",           hint: "team messaging, channels" },
  linear:            { name: "Linear",          app: "linear",          hint: "issues, projects, teams" },
  trello:            { name: "Trello",          app: "trello",          hint: "boards, cards, lists" },
  todoist:           { name: "Todoist",         app: "todoist",         hint: "task management" },
  dropbox:           { name: "Dropbox",         app: "dropbox",        hint: "file storage" },
  whatsapp:          { name: "WhatsApp",        app: "whatsapp",       hint: "messaging" },
};

export async function integrations() {
  const projectDir = findProjectDir();
  if (!projectDir) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.error("No seclaw project found. Run from your project directory.");
    return;
  }

  // Check Composio API key: .env → ~/.composio/user_data.json → prompt
  let composioKey = await getComposioKey(projectDir);

  if (!composioKey) {
    // Try auto-detect from local Composio CLI config
    const localKey = readComposioLocalKey();
    if (localKey) {
      composioKey = localKey;
      await appendEnv(projectDir, "COMPOSIO_API_KEY", localKey);
      await appendEnv(projectDir, "COMPOSIO_USER_ID", generateUserId());
      p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
      p.log.success(`Composio API key auto-detected from ${pc.dim("~/.composio/user_data.json")}`);
      await restartAgent(projectDir);
    }
  }

  if (!composioKey) {
    p.intro(`${pc.bgCyan(pc.black(" seclaw "))}`);
    p.log.warn("No Composio API key found.");

    const method = await p.select({
      message: "How would you like to set up Composio?",
      options: [
        { value: "browser", label: "Open browser", hint: "sign up + get API key (recommended)" },
        { value: "paste", label: "Paste API key", hint: "if you already have one" },
        { value: "cancel", label: "Cancel" },
      ],
    });

    if (p.isCancel(method) || method === "cancel") {
      p.outro("Run again when ready.");
      return;
    }

    if (method === "browser") {
      const url = "https://platform.composio.dev";
      p.log.info(
        `${pc.dim("Opening:")} ${pc.cyan(url)}\n` +
        `  ${pc.dim("1.")} Sign up or log in\n` +
        `  ${pc.dim("2.")} Click ${pc.bold("Settings")} → ${pc.bold("API Keys")} tab\n` +
        `  ${pc.dim("3.")} Click ${pc.bold("New API key")}, copy and paste it below`
      );
      openBrowser(url);
    }

    const apiKey = await p.text({
      message: "Paste your Composio API Key",
      placeholder: "ak_...",
    });
    if (p.isCancel(apiKey) || !(apiKey as string)) {
      p.outro("Cancelled.");
      return;
    }
    composioKey = apiKey as string;

    await appendEnv(projectDir, "COMPOSIO_API_KEY", composioKey);
    await appendEnv(projectDir, "COMPOSIO_USER_ID", generateUserId());
    p.log.success("Composio API key saved!");
    await restartAgent(projectDir);
  }

  // Fetch real connection status from Composio API (with account IDs for disconnect)
  const activeConnections = await getActiveConnections(composioKey!);

  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Manage Integrations`);

  // Show current status
  const statusLines: string[] = [];
  const connectedCount = [...activeConnections.values()].length;
  for (const [, def] of Object.entries(INTEGRATIONS)) {
    if (activeConnections.has(def.app)) {
      statusLines.push(`  ${pc.green("✓")} ${def.name}  ${pc.dim("connected")}`);
    } else {
      statusLines.push(`  ${pc.dim("○")} ${def.name}  ${pc.dim(def.hint)}`);
    }
  }
  p.log.message(statusLines.join("\n"));

  // Choose action
  const hasConnected = connectedCount > 0;
  const hasAvailable = Object.values(INTEGRATIONS).some((def) => !activeConnections.has(def.app));

  const actionOptions: Array<{ value: string; label: string; hint?: string }> = [];
  if (hasAvailable) {
    actionOptions.push({ value: "connect", label: "Connect a new integration" });
  }
  if (hasConnected) {
    actionOptions.push({ value: "disconnect", label: "Disconnect an integration" });
  }
  actionOptions.push({ value: "cancel", label: "Cancel" });

  if (actionOptions.length === 1) {
    p.outro("All integrations are connected!");
    return;
  }

  const action = await p.select({
    message: "What would you like to do?",
    options: actionOptions,
  });

  if (p.isCancel(action) || action === "cancel") {
    p.outro("Done.");
    return;
  }

  if (action === "connect") {
    await handleConnect(projectDir, composioKey!, activeConnections);
  } else if (action === "disconnect") {
    await handleDisconnect(projectDir, composioKey!, activeConnections);
  }
}

/* ── Connect flow ──────────────────────────────────────────────── */

async function handleConnect(
  projectDir: string,
  composioKey: string,
  activeConnections: Map<string, string>,
): Promise<void> {
  const available = Object.entries(INTEGRATIONS)
    .filter(([, def]) => !activeConnections.has(def.app))
    .map(([id, def]) => ({
      value: id,
      label: def.name,
      hint: def.hint,
    }));

  if (available.length === 0) {
    p.outro("All integrations are connected!");
    return;
  }

  const selected = await p.select({
    message: "Connect an integration:",
    options: [
      ...available,
      { value: "_cancel", label: "Cancel" },
    ],
  });

  if (p.isCancel(selected) || selected === "_cancel") {
    p.outro("Cancelled.");
    return;
  }

  const def = INTEGRATIONS[selected];
  const s = p.spinner();

  s.start(`Connecting ${def.name} via Composio...`);

  try {
    const userId = await getComposioUserId(projectDir);

    // Step 1: Get auth config for this app
    const authConfigId = await getOrCreateAuthConfig(composioKey, def.app);

    // Step 2: Create connected account (initiates OAuth)
    const connection = await createConnection(composioKey, authConfigId, userId);

    s.stop(`${def.name} authorization ready.`);

    if (connection.redirectUrl) {
      p.log.info(
        `${pc.bold("Complete the authorization:")}\n` +
        `  ${pc.dim("Opening:")} ${pc.cyan(connection.redirectUrl)}\n\n` +
        `  ${pc.dim("Sign in and grant access to")} ${pc.bold(def.name)}.\n` +
        `  ${pc.dim("If browser didn't open, copy the URL above.")}`
      );

      openBrowser(connection.redirectUrl);

      const done = await p.confirm({
        message: `Did you complete the ${def.name} authorization?`,
        initialValue: true,
      });

      if (p.isCancel(done) || !done) {
        p.outro(`You can retry later with: ${pc.cyan("npx seclaw integrations")}`);
        return;
      }

      // Restart agent to pick up new integration
      const restartSpinner = p.spinner();
      restartSpinner.start("Restarting agent to activate integration...");
      await restartAgent(projectDir);
      restartSpinner.stop("Agent restarted.");

      p.outro(`${pc.green("✓")} ${def.name} connected! Your agent can now use it.`);
    } else {
      s.stop("No authorization URL returned.");
      p.outro("Try again or check your Composio dashboard.");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    s.stop(`Failed: ${msg}`);
    p.log.error(
      `Could not connect ${def.name}.\n` +
      `  ${pc.dim("Check your Composio API key and try again.")}`
    );
  }
}

/* ── Disconnect flow ───────────────────────────────────────────── */

async function handleDisconnect(
  projectDir: string,
  composioKey: string,
  activeConnections: Map<string, string>,
): Promise<void> {
  const connected = Object.entries(INTEGRATIONS)
    .filter(([, def]) => activeConnections.has(def.app))
    .map(([id, def]) => ({
      value: id,
      label: def.name,
    }));

  if (connected.length === 0) {
    p.outro("No integrations to disconnect.");
    return;
  }

  const selected = await p.select({
    message: "Disconnect an integration:",
    options: [
      ...connected,
      { value: "_cancel", label: "Cancel" },
    ],
  });

  if (p.isCancel(selected) || selected === "_cancel") {
    p.outro("Cancelled.");
    return;
  }

  const def = INTEGRATIONS[selected];
  const accountId = activeConnections.get(def.app);

  if (!accountId) {
    p.log.error(`Could not find account ID for ${def.name}.`);
    return;
  }

  const confirmed = await p.confirm({
    message: `Disconnect ${def.name}? Your agent will lose access to it.`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro("Cancelled.");
    return;
  }

  const s = p.spinner();
  s.start(`Disconnecting ${def.name}...`);

  try {
    await composioFetch(composioKey, `/connected_accounts/${accountId}`, {
      method: "DELETE",
    });

    s.stop(`${def.name} disconnected.`);

    const restartSpinner = p.spinner();
    restartSpinner.start("Restarting agent to update tools...");
    await restartAgent(projectDir);
    restartSpinner.stop("Agent restarted.");

    p.outro(`${pc.green("✓")} ${def.name} disconnected.`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    s.stop(`Failed: ${msg}`);
    p.log.error(
      `Could not disconnect ${def.name}.\n` +
      `  ${pc.dim("Check your Composio dashboard.")}`
    );
  }
}

/* ── Composio REST API ───────────────────────────────────────── */

const COMPOSIO_API = "https://backend.composio.dev/api/v3";

async function composioFetch(apiKey: string, path: string, options?: RequestInit) {
  const res = await fetch(`${COMPOSIO_API}${path}`, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Composio API ${res.status}: ${body}`);
  }
  return res.json();
}

async function getOrCreateAuthConfig(apiKey: string, appSlug: string): Promise<string> {
  // Try to get existing auth config (filter by toolkit.slug — API may return wrong app)
  const data = await composioFetch(apiKey, `/auth_configs?appName=${appSlug}`);
  const match = (data.items || []).find(
    (c: { toolkit?: { slug?: string } }) => c.toolkit?.slug === appSlug
  );
  if (match) {
    return match.id;
  }

  // Create one using Composio-managed OAuth credentials
  const created = await composioFetch(apiKey, "/auth_configs", {
    method: "POST",
    body: JSON.stringify({ toolkit: { slug: appSlug } }),
  });
  return created.auth_config?.id ?? created.id;
}

async function createConnection(
  apiKey: string,
  authConfigId: string,
  entityId: string,
): Promise<{ id: string; redirectUrl: string | null }> {
  const data = await composioFetch(apiKey, "/connected_accounts", {
    method: "POST",
    body: JSON.stringify({
      auth_config: { id: authConfigId },
      connection: { entity_id: entityId },
    }),
  });
  return {
    id: data.id,
    redirectUrl: data.redirect_url || data.redirect_uri || null,
  };
}

/* ── Helpers ─────────────────────────────────────────────────── */

function findProjectDir(): string | null {
  return findProject();
}

async function getComposioKey(projectDir: string): Promise<string | null> {
  try {
    const env = await readFile(resolve(projectDir, ".env"), "utf-8");
    const match = env.match(/COMPOSIO_API_KEY=(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getComposioUserId(projectDir: string): Promise<string> {
  try {
    const env = await readFile(resolve(projectDir, ".env"), "utf-8");
    const match = env.match(/COMPOSIO_USER_ID=(\S+)/);
    return match ? match[1] : "default-user";
  } catch {
    return "default-user";
  }
}

function generateUserId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "seclaw-user-";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function appendEnv(projectDir: string, key: string, value: string) {
  const envPath = resolve(projectDir, ".env");
  let content = "";
  try { content = await readFile(envPath, "utf-8"); } catch { /* new file */ }

  // Remove existing key
  content = content
    .split("\n")
    .filter((l) => !l.startsWith(`${key}=`))
    .join("\n");

  content = content.trimEnd() + `\n${key}=${value}\n`;
  await writeFile(envPath, content);
}

async function restartAgent(projectDir: string) {
  const env = { ...process.env, COMPOSE_PROJECT_NAME: "seclaw" };
  try {
    await execa("docker", ["compose", "restart", "agent"], { cwd: projectDir, env });
  } catch { /* best effort */ }
}

/**
 * Returns Map<appSlug, accountId> for all active Composio connections.
 * Account ID (nanoid like ca_xxxxx) is needed for DELETE /connected_accounts/{id}.
 */
async function getActiveConnections(apiKey: string): Promise<Map<string, string>> {
  try {
    const data = await composioFetch(apiKey, "/connected_accounts?status=ACTIVE");
    const map = new Map<string, string>();
    for (const a of (data.items || [])) {
      if (a.status === "ACTIVE" && a.toolkit?.slug) {
        // Keep first active account per app (most recent connections appear first)
        if (!map.has(a.toolkit.slug)) {
          map.set(a.toolkit.slug, a.id);
        }
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function readComposioLocalKey(): string | null {
  try {
    const dataPath = resolve(homedir(), ".composio", "user_data.json");
    if (!existsSync(dataPath)) return null;
    const data = JSON.parse(readFileSync(dataPath, "utf-8"));
    const key = data.api_key;
    return key && typeof key === "string" && key.startsWith("ak_") ? key : null;
  } catch {
    return null;
  }
}

function openBrowser(url: string): void {
  const cmd = platform() === "darwin"
    ? `open "${url}"`
    : platform() === "win32"
      ? `start "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface AgentConfig {
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  telegramToken: string;
  composioApiKey: string;
  composioUserId: string;
  commanderUrl: string;
  workspace: string;
  timezone: string;
  telegramChatId: number;
  systemPrompt: string;
}

interface InstalledConfig {
  capabilities: string[];
  active?: string; // "auto" = all capabilities, or a specific capability ID
}

const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";

const BASE_PROMPT = `You are a personal AI assistant running on seclaw. You have multiple capabilities installed — use the right one based on the user's request.

## Communication
- Detect the user's language and respond in the same language
- Keep Telegram messages concise — use bullet points and short paragraphs
- Be proactive when you have relevant context to share

## Response Format
At the end of every response, write on a new line:
--- CapabilityName
Where CapabilityName is the capability you primarily used (e.g. "Inbox Management", "Research & Intelligence"). If no specific capability applies, write: --- General`;

export function loadConfig(): AgentConfig {
  return {
    // LLM
    llmProvider: process.env.LLM_PROVIDER || "openrouter",
    llmApiKey: process.env.OPENROUTER_API_KEY
      || process.env.OPENAI_API_KEY
      || process.env.ANTHROPIC_API_KEY
      || process.env.GOOGLE_AI_API_KEY
      || "",
    llmModel: process.env.LLM_MODEL || "",

    // Telegram
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",

    // Composio
    composioApiKey: process.env.COMPOSIO_API_KEY || "",
    composioUserId: process.env.COMPOSIO_USER_ID || "",

    // MCP
    commanderUrl: process.env.COMMANDER_URL || "http://desktop-commander:3000",

    // Workspace
    workspace: WORKSPACE,
    timezone: process.env.TIMEZONE || "UTC",
    telegramChatId: parseInt(process.env.TELEGRAM_CHAT_ID || "0", 10),

    // System prompt
    systemPrompt: loadSystemPrompt(),
  };
}

function loadSystemPrompt(): string {
  return reloadSystemPrompt(WORKSPACE);
}

/**
 * Reload system prompt from installed.json.
 * Respects active field: "auto" loads all, specific ID loads base + that one.
 */
export function reloadSystemPrompt(workspace: string): string {
  const installedPath = resolve(workspace, "config", "installed.json");
  if (existsSync(installedPath)) {
    try {
      const installed = JSON.parse(readFileSync(installedPath, "utf-8")) as InstalledConfig;
      if (installed.capabilities && installed.capabilities.length > 0) {
        const active = installed.active || "auto";

        if (active === "auto") {
          // Auto mode: load all capabilities
          return composeCapabilityPrompt(installed.capabilities);
        }

        // Focus mode: load base + active capability only
        const base = installed.capabilities[0]; // First is always base (productivity-agent)
        const caps = base === active ? [active] : [base, active];
        return composeCapabilityPrompt(caps);
      }
    } catch (err) {
      console.error(`[config] Failed to parse installed.json: ${(err as Error).message}`);
    }
  }

  // Fallback: single system-prompt.md
  const paths = [
    resolve(workspace, "config", "system-prompt.md"),
    "/templates/system-prompt.md",
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      return readFileSync(p, "utf-8");
    }
  }
  return `You are a helpful AI assistant. You can manage files, read emails, and help with tasks.
Always be concise in Telegram messages. Use bullet points.
Detect the user's language and respond in the same language.`;
}

/**
 * Read the current active mode from installed.json.
 * Returns "auto" or a specific capability ID.
 */
export function getActiveMode(workspace: string): string {
  const installedPath = resolve(workspace, "config", "installed.json");
  if (!existsSync(installedPath)) return "auto";
  try {
    const installed = JSON.parse(readFileSync(installedPath, "utf-8")) as InstalledConfig;
    return installed.active || "auto";
  } catch {
    return "auto";
  }
}

/**
 * Set the active mode in installed.json.
 * "auto" = all capabilities, or a specific capability ID for focus mode.
 */
export function setActiveMode(workspace: string, active: string): void {
  const installedPath = resolve(workspace, "config", "installed.json");
  if (!existsSync(installedPath)) return;
  try {
    const installed = JSON.parse(readFileSync(installedPath, "utf-8")) as InstalledConfig;
    installed.active = active;
    writeFileSync(installedPath, JSON.stringify(installed, null, 2) + "\n");
    console.log(`[config] Active mode set to: ${active}`);
  } catch (err) {
    console.error(`[config] Failed to update installed.json: ${(err as Error).message}`);
  }
}

function composeCapabilityPrompt(capabilities: string[]): string {
  const sections: string[] = [];

  for (const id of capabilities) {
    const promptPath = resolve(WORKSPACE, "config", "capabilities", id, "system-prompt.md");
    if (existsSync(promptPath)) {
      const content = readFileSync(promptPath, "utf-8").trim();
      sections.push(content);
      console.log(`[config] Loaded capability: ${id}`);
    } else {
      console.warn(`[config] Capability prompt not found: ${promptPath}`);
    }
  }

  if (sections.length === 0) {
    console.warn("[config] No capability prompts loaded, using base prompt only");
    return BASE_PROMPT;
  }

  return BASE_PROMPT + "\n\n" + sections.join("\n\n");
}

/**
 * Returns the list of installed capability IDs from installed.json.
 * Returns empty array if installed.json does not exist or is invalid.
 */
export function loadInstalledCapabilities(workspace: string): string[] {
  const installedPath = resolve(workspace, "config", "installed.json");
  if (!existsSync(installedPath)) return [];
  try {
    const installed = JSON.parse(readFileSync(installedPath, "utf-8")) as InstalledConfig;
    return installed.capabilities || [];
  } catch {
    return [];
  }
}

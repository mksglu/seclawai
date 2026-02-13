import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir, platform } from "node:os";
import { exec } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { verifyTelegramToken } from "./tunnel.js";

export type LLMProvider = "anthropic" | "openai" | "gemini" | "openrouter";

export interface SetupAnswers {
  llmProvider: LLMProvider;
  llmApiKey: string;
  telegramToken: string;
  telegramBotName: string;
  composioApiKey: string;
  composioUserId: string;
  template: string;
  timezone: string;
}

const PROVIDER_CONFIG: Record<
  LLMProvider,
  { label: string; hint: string; envVar: string; placeholder: string; prefix: string; keyUrl: string }
> = {
  anthropic: {
    label: "Anthropic (Claude)",
    hint: "Claude Opus, Sonnet, Haiku",
    envVar: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-api03-...",
    prefix: "sk-ant-",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    label: "OpenAI (GPT-4o)",
    hint: "GPT-4o, GPT-4o-mini, o1, o3",
    envVar: "OPENAI_API_KEY",
    placeholder: "sk-proj-...",
    prefix: "sk-",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  gemini: {
    label: "Google (Gemini)",
    hint: "Gemini 2.5 Pro, Flash",
    envVar: "GOOGLE_AI_API_KEY",
    placeholder: "AI...",
    prefix: "",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openrouter: {
    label: "OpenRouter (100+ models)",
    hint: "Claude, GPT, Llama, Mixtral and more",
    envVar: "OPENROUTER_API_KEY",
    placeholder: "sk-or-...",
    prefix: "sk-or-",
    keyUrl: "https://openrouter.ai/keys",
  },
};

export function getProviderConfig(provider: LLMProvider) {
  return PROVIDER_CONFIG[provider];
}

export async function collectSetupAnswers(): Promise<SetupAnswers> {
  p.intro(
    `${pc.bgCyan(pc.black(" seclaw "))} ${pc.dim("Secure autonomous AI agents in 60 seconds.")}`
  );

  // --- Step 1: LLM Provider ---
  const provider = await p.select({
    message: "Which LLM provider?",
    options: [
      { value: "openrouter" as const, label: "OpenRouter", hint: "recommended — smart routing, ~$5-15/mo" },
      { value: "anthropic" as const, label: "Anthropic (Claude)", hint: "~$15-30/mo" },
      { value: "openai" as const, label: "OpenAI (GPT-4o)", hint: "~$10-25/mo" },
      { value: "gemini" as const, label: "Google (Gemini)", hint: "~$7-20/mo" },
    ],
  });
  if (p.isCancel(provider)) process.exit(0);

  const config = PROVIDER_CONFIG[provider as LLMProvider];

  // --- API Key ---
  p.log.step(
    `${pc.bold("Step 1:")} ${config.label} API Key\n` +
      `  ${pc.dim("Go to")} ${pc.cyan(config.keyUrl)}\n` +
      `  ${pc.dim("Create a key and copy it")}`
  );

  const llmApiKey = await p.text({
    message: `Paste your ${config.label} API Key`,
    placeholder: config.placeholder,
    validate: (v) => {
      if (!v || v.length < 10) return "API key is too short";
      if (config.prefix && !v.startsWith(config.prefix)) {
        return `Expected key starting with ${config.prefix}`;
      }
    },
  });
  if (p.isCancel(llmApiKey)) process.exit(0);

  // --- Step 2: Telegram Bot Token ---
  p.log.step(
    `${pc.bold("Step 2:")} Telegram Bot Token\n` +
      `  ${pc.dim("1. Open Telegram, search")} ${pc.cyan("@BotFather")}\n` +
      `  ${pc.dim("2. Send")} ${pc.bold("/newbot")} ${pc.dim("-> pick a name")}\n` +
      `  ${pc.dim("3. Copy the token it gives you")}`
  );

  let telegramToken = "";
  let telegramBotName = "";

  const tokenInput = await p.text({
    message: "Paste your Telegram Bot Token (Enter to skip)",
    placeholder: "7234567890:AAF...",
    defaultValue: "",
  });
  if (p.isCancel(tokenInput)) process.exit(0);

  if (tokenInput && (tokenInput as string).includes(":")) {
    telegramToken = tokenInput as string;

    const s = p.spinner();
    s.start("Verifying Telegram token...");
    const result = await verifyTelegramToken(telegramToken);
    if (result.valid) {
      telegramBotName = result.botName || "";
      s.stop(`Bot verified: ${pc.green(telegramBotName)}`);
    } else {
      s.stop("Token looks invalid — continuing anyway, you can fix it later.");
    }
  }

  // --- Step 3: Composio (Integrations Hub) ---
  let composioApiKey = readComposioLocalKey() || "";

  if (composioApiKey) {
    p.log.step(
      `${pc.bold("Step 3:")} Composio ${pc.green("auto-detected!")}\n` +
        `  ${pc.dim("Found API key in")} ~/.composio/user_data.json`
    );
  } else {
    p.log.step(
      `${pc.bold("Step 3:")} Composio ${pc.dim("(for Gmail, Calendar, etc.)")}`
    );

    const method = await p.select({
      message: "How would you like to set up Composio?",
      options: [
        { value: "browser", label: "Open browser", hint: "sign up + get API key (recommended)" },
        { value: "paste", label: "Paste API key", hint: "if you already have one" },
        { value: "skip", label: "Skip for now", hint: "add later with: npx seclaw integrations" },
      ],
    });
    if (p.isCancel(method)) process.exit(0);

    if (method === "browser") {
      composioApiKey = await composioFromBrowser();
    } else if (method === "paste") {
      const composioKey = await p.text({
        message: "Paste your Composio API Key",
        placeholder: "ak_...",
      });
      if (p.isCancel(composioKey)) process.exit(0);
      composioApiKey = (composioKey as string) || "";
    }
  }

  // --- Template ---
  const template = await p.select({
    message: "Select a starter template",
    options: [
      {
        value: "productivity-agent",
        label: "Productivity Agent (recommended)",
        hint: "free — task management, Telegram chat, file tools",
      },
      {
        value: "blank",
        label: "Empty project",
        hint: "just the infrastructure, no template",
      },
    ],
  });
  if (p.isCancel(template)) process.exit(0);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    llmProvider: provider as LLMProvider,
    llmApiKey: llmApiKey as string,
    telegramToken,
    telegramBotName,
    composioApiKey,
    composioUserId: "",
    template: template as string,
    timezone: tz,
  };
}

/**
 * Open Composio in browser, wait for user to paste API key.
 */
async function composioFromBrowser(): Promise<string> {
  const url = "https://platform.composio.dev";

  p.log.info(
    `${pc.dim("Opening:")} ${pc.cyan(url)}\n` +
    `  ${pc.dim("1.")} Sign up or log in\n` +
    `  ${pc.dim("2.")} Click ${pc.bold("Settings")} → ${pc.bold("API Keys")} tab\n` +
    `  ${pc.dim("3.")} Click ${pc.bold("New API key")}, copy and paste it below`
  );

  openUrl(url);

  const key = await p.text({
    message: "Paste your Composio API Key",
    placeholder: "ak_...",
  });
  if (p.isCancel(key)) process.exit(0);
  return (key as string) || "";
}

function openUrl(url: string): void {
  const cmd = platform() === "darwin"
    ? `open "${url}"`
    : platform() === "win32"
      ? `start "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

/**
 * Read Composio API key from ~/.composio/user_data.json
 * (written by `npx composio login` or Composio CLI)
 */
function readComposioLocalKey(): string | null {
  try {
    const dataPath = resolve(homedir(), ".composio", "user_data.json");
    if (!existsSync(dataPath)) return null;

    const data = JSON.parse(readFileSync(dataPath, "utf-8"));
    const key = data.api_key;
    if (key && typeof key === "string" && key.startsWith("ak_")) {
      return key;
    }
    return null;
  } catch {
    return null;
  }
}

import type { IncomingMessage, ServerResponse } from "node:http";
import { runAgent } from "./llm.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { AgentConfig } from "./config.js";
import { pendingConfirmations, type ToolContext, type ToolDefinition } from "./tools.js";
import { loadScheduleConfig } from "./scheduler.js";
import { loadInstalledCapabilities, getActiveMode, setActiveMode, reloadSystemPrompt } from "./config.js";
import type { Inngest } from "inngest";

interface ChatMessage {
  role: string;
  content: string;
}

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number };
    from?: { first_name?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
    from?: { first_name?: string };
  };
}

const MAX_HISTORY = 20; // messages per chat

export async function handleWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  config: AgentConfig,
  toolCtx: ToolContext,
  inngestClient?: Inngest,
): Promise<void> {
  const body = await parseBody(req);
  // Respond immediately to Telegram (avoid timeout)
  res.writeHead(200);
  res.end();

  // Handle inline keyboard button presses
  const callback = body?.callback_query;
  if (callback?.data && callback.message?.chat?.id) {
    const chatId = callback.message.chat.id;
    const data = callback.data;
    console.log(`[telegram] Callback: ${data}`);

    // Acknowledge the button press
    await answerCallbackQuery(config.telegramToken, callback.id);

    if (data.startsWith("int_connect:")) {
      const app = data.replace("int_connect:", "");
      await handleIntegrationConnect(chatId, app, config, toolCtx);
    } else if (data.startsWith("int_disconnect:")) {
      const app = data.replace("int_disconnect:", "");
      await handleIntegrationDisconnect(chatId, app, config, toolCtx);
    } else if (data.startsWith("sched_approve:") || data.startsWith("sched_reject:")) {
      const isApprove = data.startsWith("sched_approve:");
      const scheduleId = data.replace(/^sched_(approve|reject):/, "");
      await handleScheduleConfirm(chatId, scheduleId, isApprove, config, inngestClient);
    } else if (data.startsWith("sched_toggle:")) {
      const schedId = data.replace("sched_toggle:", "");
      const msgId = callback.message?.message_id;
      if (schedId === "_noop") {
        if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Cancelled.");
      } else {
        await handleScheduleToggle(chatId, msgId, schedId, config);
      }
    } else if (data.startsWith("sched_run:")) {
      const schedId = data.replace("sched_run:", "");
      const msgId = callback.message?.message_id;
      await handleScheduleRun(chatId, msgId, schedId, config, toolCtx);
    } else if (data.startsWith("sched_del:")) {
      const schedId = data.replace("sched_del:", "");
      const msgId = callback.message?.message_id;
      await handleScheduleDeleteConfirm(chatId, msgId, schedId, config);
    } else if (data.startsWith("sched_delok:")) {
      const schedId = data.replace("sched_delok:", "");
      const msgId = callback.message?.message_id;
      await handleScheduleDeleteExecute(chatId, msgId, schedId, config);
    } else if (data.startsWith("confirm_yes:") || data.startsWith("confirm_no:")) {
      const isApprove = data.startsWith("confirm_yes:");
      const confirmId = data.replace(/^confirm_(yes|no):/, "");
      const msgId = callback.message?.message_id;
      await handleConfirmation(chatId, msgId, confirmId, isApprove, config, toolCtx);
    } else if (data.startsWith("cap_switch:")) {
      const capId = data.replace("cap_switch:", "");
      const msgId = callback.message?.message_id;
      await handleSwitchCallback(chatId, msgId, capId, config);
    }
    return;
  }

  const message = body?.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const userText = message.text;
  const userName = message.from?.first_name || "User";

  console.log(`[telegram] M: ${userText.substring(0, 80)}`);

  // Handle pending integration param collection
  if (pendingParams.has(chatId) && !userText.startsWith("/")) {
    await collectIntegrationParam(chatId, userText, config, toolCtx);
    return;
  }

  // Handle /integrations command
  if (userText.startsWith("/integrations")) {
    await handleIntegrations(chatId, config, toolCtx);
    return;
  }

  // Handle /schedules command
  if (userText.startsWith("/schedules")) {
    await handleSchedules(chatId, config);
    return;
  }

  // Handle /templates command (info + switch in one)
  if (userText.startsWith("/templates")) {
    await handleTemplates(chatId, config);
    return;
  }

  try {
    const history = loadHistory(chatId, config.workspace);
    const augmented = `[chat_id: ${chatId}, user: ${userName}]\n${userText}`;
    let response = await runAgent(config, toolCtx, history, augmented);

    console.log(`[telegram] Reply (${response.length} chars): ${response.substring(0, 120)}`);

    // Extract capability footer from LLM output
    let footer = "";
    const footerMatch = response.match(/\n[-—]{2,3}\s*(.+?)\s*$/);
    if (footerMatch) {
      response = response.replace(/\n[-—]{2,3}\s*.+?\s*$/, "").trimEnd();
      footer = `\n\n— ${footerMatch[1].trim()}`;
    }

    saveHistory(chatId, config.workspace, [
      ...history,
      { role: "user", content: userText },
      { role: "assistant", content: response },
    ]);

    await sendMessage(config.telegramToken, chatId, response + footer);
    console.log(`[telegram] Sent to chat ${chatId}`);
  } catch (err) {
    const e = err as Error & { status?: number };
    const detail = e.status ? `${e.status} ${e.message}` : e.message;
    console.error(`[telegram] Error: ${detail}`);
    await sendMessage(config.telegramToken, chatId, `Error: ${detail.substring(0, 200)}`);
  }
}

export async function sendMessage(token: string, chatId: number, text: string): Promise<void> {
  if (!token || !chatId) return;

  // Telegram max message length is 4096
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    try {
      // Try with Markdown first
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (!data.ok) {
        // Markdown parse failed — retry without parse_mode
        console.log(`[telegram] Markdown failed: ${data.description} — retrying plain`);
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: chunk }),
        });
      }
    } catch {
      // Network error — retry without Markdown
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: chunk }),
        });
      } catch { /* give up */ }
    }
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at newline
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx < maxLen / 2) splitIdx = maxLen;
    chunks.push(remaining.substring(0, splitIdx));
    remaining = remaining.substring(splitIdx);
  }
  return chunks;
}

function historyPath(chatId: number, workspace: string): string {
  return resolve(workspace, "memory", `chat-${chatId}.json`);
}

function loadHistory(chatId: number, workspace: string): ChatMessage[] {
  const p = historyPath(chatId, workspace);
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, "utf-8")) as ChatMessage[];
    return data.slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory(chatId: number, workspace: string, messages: ChatMessage[]): void {
  const p = historyPath(chatId, workspace);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(messages.slice(-MAX_HISTORY), null, 2));
}

/* ── /integrations command ────────────────────────────────────── */

interface IntegrationParam {
  key: string;
  label: string;
  example: string;
}

export const INTEGRATIONS: Record<string, { name: string; app: string; hint: string; params?: IntegrationParam[] }> = {
  gmail:      { name: "Gmail",           app: "gmail",          hint: "email" },
  drive:      { name: "Google Drive",    app: "googledrive",    hint: "files" },
  calendar:   { name: "Google Calendar", app: "googlecalendar", hint: "events" },
  twitter:    { name: "X (Twitter)",     app: "twitter",        hint: "tweets, leads, monitoring" },
  reddit:     { name: "Reddit",          app: "reddit",         hint: "subreddits, posts" },
  youtube:    { name: "YouTube",         app: "youtube",        hint: "channels, videos" },
  tavily:     { name: "Tavily",          app: "tavily",         hint: "web search" },
  hackernews: { name: "Hacker News",     app: "hackernews",     hint: "tech news, stories" },
  notion:     { name: "Notion",          app: "notion",         hint: "notes, databases" },
  github:     { name: "GitHub",          app: "github",         hint: "repos, issues" },
  slack:      { name: "Slack",           app: "slack",          hint: "messaging" },
  linear:     { name: "Linear",          app: "linear",         hint: "issues" },
  trello:     { name: "Trello",          app: "trello",         hint: "boards, cards" },
  todoist:    { name: "Todoist",         app: "todoist",        hint: "tasks" },
  sheets:     { name: "Google Sheets",   app: "googlesheets",   hint: "spreadsheets" },
  dropbox:    { name: "Dropbox",         app: "dropbox",        hint: "files" },
  whatsapp:   { name: "WhatsApp",        app: "whatsapp",       hint: "messaging", params: [
    { key: "WABA_ID", label: "WABA ID", example: "123456789012345" },
  ]},
};

/** Pending param collection: chatId → { key, params collected so far, integration key } */
const pendingParams = new Map<number, { integrationKey: string; params: IntegrationParam[]; collected: Record<string, string>; currentIndex: number }>();

export const COMPOSIO_API = "https://backend.composio.dev/api/v3";

/**
 * Fetch active connections as Map<appSlug, accountId>.
 * Account ID needed for DELETE disconnect.
 */
export async function getActiveConnections(apiKey: string): Promise<Map<string, string>> {
  const accounts = await composioFetch(apiKey, "/connected_accounts?status=ACTIVE");
  const map = new Map<string, string>();
  for (const a of (accounts.items || [])) {
    if (a.status === "ACTIVE" && a.toolkit?.slug) {
      if (!map.has(a.toolkit.slug)) {
        map.set(a.toolkit.slug, a.id);
      }
    }
  }
  return map;
}

async function handleIntegrations(chatId: number, config: AgentConfig, toolCtx: ToolContext): Promise<void> {
  const token = config.telegramToken;
  const apiKey = config.composioApiKey;

  if (!apiKey) {
    await sendMessage(token, chatId, "Composio API key is not configured. Set COMPOSIO_API_KEY in .env");
    return;
  }

  // Fetch active connections with account IDs
  let activeConnections: Map<string, string>;
  try {
    activeConnections = await getActiveConnections(apiKey);
  } catch {
    activeConnections = new Map();
  }

  // Check if new integrations were connected — reload tools if needed
  const currentToolApps = new Set(
    toolCtx.tools.filter((t) => (t as ToolDefinition & { _composio?: boolean })._composio)
      .map((t) => (t as ToolDefinition & { _app?: string })._app)
      .filter(Boolean)
  );
  const hasNewApps = [...activeConnections.keys()].some((app) => !currentToolApps.has(app));
  if (hasNewApps) {
    await toolCtx.reloadComposio();
    await sendMessage(token, chatId, "New integrations detected — tools reloaded!");
  }

  const connectedLines: string[] = [];
  const connectButtons: Array<{ text: string; callback_data: string }> = [];
  const disconnectButtons: Array<{ text: string; callback_data: string }> = [];

  for (const [key, def] of Object.entries(INTEGRATIONS)) {
    if (activeConnections.has(def.app)) {
      connectedLines.push(`\u2705 ${def.name}`);
      disconnectButtons.push({ text: `\u274C ${def.name}`, callback_data: `int_disconnect:${key}` });
    } else {
      connectButtons.push({ text: `${def.name} \u2014 ${def.hint}`, callback_data: `int_connect:${key}` });
    }
  }

  let statusText = "*Integrations*\n";
  if (connectedLines.length > 0) {
    statusText += `\n${connectedLines.join("\n")}\n`;
  }
  if (connectButtons.length > 0) {
    statusText += "\nTap to connect:";
  } else if (disconnectButtons.length > 0) {
    statusText += "\nAll integrations connected!";
  }

  // Build keyboard: connect buttons (2 per row), then disconnect buttons (2 per row)
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < connectButtons.length; i += 2) {
    keyboard.push(connectButtons.slice(i, i + 2));
  }
  if (disconnectButtons.length > 0) {
    for (let i = 0; i < disconnectButtons.length; i += 2) {
      keyboard.push(disconnectButtons.slice(i, i + 2));
    }
  }

  await sendMessageWithButtons(token, chatId, statusText, keyboard);
}

async function handleIntegrationConnect(chatId: number, key: string, config: AgentConfig, toolCtx: ToolContext): Promise<void> {
  const token = config.telegramToken;
  const apiKey = config.composioApiKey;

  if (!apiKey) {
    await sendMessage(token, chatId, "Composio API key is not configured.");
    return;
  }

  const integration = INTEGRATIONS[key];
  if (!integration) {
    await sendMessage(token, chatId, `Unknown integration: "${key}"`);
    return;
  }

  // If integration requires extra params, start collection flow
  if (integration.params?.length) {
    pendingParams.set(chatId, {
      integrationKey: key,
      params: integration.params,
      collected: {},
      currentIndex: 0,
    });
    const first = integration.params[0];
    await sendMessage(token, chatId,
      `${integration.name} requires additional configuration.\n\n` +
      `Please send your *${first.label}*\n` +
      `Example: \`${first.example}\``
    );
    return;
  }

  // No extra params needed — connect directly
  await doIntegrationConnect(chatId, key, {}, config, toolCtx);
}

async function collectIntegrationParam(chatId: number, text: string, config: AgentConfig, toolCtx: ToolContext): Promise<void> {
  const pending = pendingParams.get(chatId);
  if (!pending) return;

  const param = pending.params[pending.currentIndex];
  pending.collected[param.key] = text.trim();
  pending.currentIndex++;

  if (pending.currentIndex < pending.params.length) {
    // Ask for next param
    const next = pending.params[pending.currentIndex];
    await sendMessage(config.telegramToken, chatId,
      `Please send your *${next.label}*\nExample: \`${next.example}\``
    );
    return;
  }

  // All params collected — proceed with connection
  const integrationKey = pending.integrationKey;
  const collected = { ...pending.collected };
  pendingParams.delete(chatId);

  await doIntegrationConnect(chatId, integrationKey, collected, config, toolCtx);
}

async function doIntegrationConnect(
  chatId: number,
  key: string,
  extraParams: Record<string, string>,
  config: AgentConfig,
  toolCtx: ToolContext,
): Promise<void> {
  const token = config.telegramToken;
  const apiKey = config.composioApiKey!;
  const integration = INTEGRATIONS[key];

  try {
    await sendMessage(token, chatId, `Connecting ${integration.name}...`);

    // 1. Get or create auth config (filter by toolkit.slug — API may return wrong app)
    const configRes = await composioFetch(apiKey, `/auth_configs?appName=${integration.app}`);
    const matchingConfig = (configRes.items || []).find(
      (c: { toolkit?: { slug?: string } }) => c.toolkit?.slug === integration.app
    );
    let authConfigId: string;

    if (matchingConfig) {
      authConfigId = matchingConfig.id;
    } else {
      const created = await composioFetch(apiKey, "/auth_configs", {
        method: "POST",
        body: JSON.stringify({ toolkit: { slug: integration.app } }),
      });
      authConfigId = created.auth_config?.id ?? created.id;
    }

    // 2. Create connection → get OAuth redirect URL
    const entityId = config.composioUserId || "default";
    const connectionBody: Record<string, unknown> = { entity_id: entityId };
    if (Object.keys(extraParams).length > 0) {
      connectionBody.config = extraParams;
    }

    const connection = await composioFetch(apiKey, "/connected_accounts", {
      method: "POST",
      body: JSON.stringify({
        auth_config: { id: authConfigId },
        connection: connectionBody,
      }),
    });

    const redirectUrl = connection.redirect_url || connection.redirect_uri;

    if (redirectUrl) {
      await sendMessage(token, chatId,
        `\uD83D\uDD17 *Authorize ${integration.name}:*\n\n${redirectUrl}\n\n` +
        `Open the link, sign in, and grant access.\nThen send /integrations to verify.`
      );
      console.log(`[integrations] ${integration.name} OAuth URL sent to chat ${chatId}`);
    } else {
      await sendMessage(token, chatId, `Could not get authorization URL for ${integration.name}. Try again later.`);
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[integrations] Connect error: ${msg}`);
    await sendMessage(token, chatId, `Failed to connect ${integration.name}: ${msg}`);
  }
}

async function handleIntegrationDisconnect(chatId: number, key: string, config: AgentConfig, toolCtx: ToolContext): Promise<void> {
  const token = config.telegramToken;
  const apiKey = config.composioApiKey;

  if (!apiKey) {
    await sendMessage(token, chatId, "Composio API key is not configured.");
    return;
  }

  const integration = INTEGRATIONS[key];
  if (!integration) {
    await sendMessage(token, chatId, `Unknown integration: "${key}"`);
    return;
  }

  try {
    // Fetch account ID for this app
    const activeConnections = await getActiveConnections(apiKey);
    const accountId = activeConnections.get(integration.app);

    if (!accountId) {
      await sendMessage(token, chatId, `${integration.name} is not connected.`);
      return;
    }

    await sendMessage(token, chatId, `Disconnecting ${integration.name}...`);

    // DELETE the connected account
    await composioFetch(apiKey, `/connected_accounts/${accountId}`, {
      method: "DELETE",
    });

    // Reload tools to remove disconnected integration
    await toolCtx.reloadComposio();

    await sendMessage(token, chatId, `\u2705 ${integration.name} disconnected. Tools updated.`);
    console.log(`[integrations] ${integration.name} disconnected for chat ${chatId}`);
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[integrations] Disconnect error: ${msg}`);
    await sendMessage(token, chatId, `Failed to disconnect ${integration.name}: ${msg}`);
  }
}

async function handleScheduleConfirm(
  chatId: number,
  scheduleId: string,
  approved: boolean,
  config: AgentConfig,
  inngestClient?: Inngest,
): Promise<void> {
  const action = approved ? "approve" : "reject";
  console.log(`[scheduler] ${scheduleId} ${action}d by user`);

  if (inngestClient) {
    try {
      await inngestClient.send({
        name: "schedule/confirmed",
        data: { scheduleId, action },
      });
      await sendMessage(
        config.telegramToken,
        chatId,
        approved ? `Approved: ${scheduleId}` : `Rejected: ${scheduleId}`,
      );
    } catch (err) {
      console.error(`[scheduler] Failed to send event: ${(err as Error).message}`);
      await sendMessage(config.telegramToken, chatId, `Failed to process confirmation.`);
    }
  } else {
    await sendMessage(config.telegramToken, chatId, `Scheduler not available.`);
  }
}

async function handleConfirmation(
  chatId: number,
  messageId: number | undefined,
  confirmId: string,
  approved: boolean,
  config: AgentConfig,
  toolCtx: ToolContext,
): Promise<void> {
  const pending = pendingConfirmations.get(confirmId);
  if (!pending) {
    // Already processed — just remove stale buttons silently
    if (messageId) {
      await removeButtons(config.telegramToken, chatId, messageId, "Expired.");
    }
    return;
  }

  pendingConfirmations.delete(confirmId);

  // Remove buttons and update message with result
  const label = approved ? "Approved" : "Rejected";
  if (messageId) {
    await removeButtons(config.telegramToken, chatId, messageId, label);
  }

  if (!approved) {
    return;
  }

  console.log(`[confirm] Approved: ${pending.onApprove.substring(0, 80)}`);

  try {
    const result = await runAgent(config, toolCtx, [], pending.onApprove);
    await sendMessage(config.telegramToken, chatId, result);
  } catch (err) {
    await sendMessage(config.telegramToken, chatId, `Failed: ${(err as Error).message}`);
  }
}

async function removeButtons(token: string, chatId: number, messageId: number, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch { /* ignore */ }
}

async function handleSchedules(chatId: number, config: AgentConfig): Promise<void> {
  const scheduleConfig = loadScheduleConfig(config.workspace);
  if (!scheduleConfig || scheduleConfig.schedules.length === 0) {
    await sendMessage(config.telegramToken, chatId, "No scheduled tasks configured.");
    return;
  }

  const lines: string[] = [];
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  for (const s of scheduleConfig.schedules) {
    const enabled = s.enabled !== false;
    const status = enabled ? "\u2705" : "\u23F8\uFE0F";

    let displayId = s.id;
    let capLabel = "";
    if (s.id.includes(":")) {
      const [capId, schedId] = s.id.split(":", 2);
      displayId = schedId;
      capLabel = ` (${capId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")})`;
    }

    lines.push(`${status} *${displayId}*${capLabel}\n   ${s.description}\n   \`${s.cron}\` (${s.timezone})`);

    // Action buttons per schedule
    const toggleLabel = enabled ? "\u23F8 Disable" : "\u25B6 Enable";
    keyboard.push([
      { text: toggleLabel, callback_data: `sched_toggle:${s.id}` },
      { text: "\u26A1 Run Now", callback_data: `sched_run:${s.id}` },
      { text: "\uD83D\uDDD1 Delete", callback_data: `sched_del:${s.id}` },
    ]);
  }

  await sendMessageWithButtons(
    config.telegramToken,
    chatId,
    `*Scheduled Tasks*\n\n${lines.join("\n\n")}`,
    keyboard,
  );
}

/* ── Schedule management callbacks ──────────────────────────── */

/**
 * Find the correct schedules.json file for a given (possibly prefixed) schedule ID.
 * Returns { filePath, localId } where localId is the ID within that file.
 */
function findScheduleFile(workspace: string, fullId: string): { filePath: string; localId: string } | null {
  if (fullId.includes(":")) {
    const [capId, localId] = fullId.split(":", 2);
    const filePath = resolve(workspace, "config", "capabilities", capId, "schedules.json");
    if (existsSync(filePath)) return { filePath, localId };
  }
  const filePath = resolve(workspace, "config", "schedules.json");
  if (existsSync(filePath)) return { filePath, localId: fullId };
  return null;
}

function readScheduleFile(filePath: string): { schedules: Array<{ id: string; cron: string; timezone: string; action: string; description: string; enabled?: boolean }>; actions: Record<string, unknown> } | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function handleScheduleToggle(chatId: number, msgId: number | undefined, scheduleId: string, config: AgentConfig): Promise<void> {
  const loc = findScheduleFile(config.workspace, scheduleId);
  if (!loc) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Schedule not found.");
    return;
  }

  const data = readScheduleFile(loc.filePath);
  if (!data) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Failed to read config.");
    return;
  }

  const entry = data.schedules.find((s) => s.id === loc.localId);
  if (!entry) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Schedule not found in config.");
    return;
  }

  entry.enabled = entry.enabled === false ? true : false;
  writeFileSync(loc.filePath, JSON.stringify(data, null, 2) + "\n");

  const state = entry.enabled ? "enabled" : "disabled";
  const icon = entry.enabled ? "\u2705" : "\u23F8\uFE0F";
  if (msgId) await removeButtons(config.telegramToken, chatId, msgId, `${icon} ${scheduleId} — ${state}`);
  console.log(`[schedules] ${scheduleId} toggled to ${state}`);
}

async function handleScheduleRun(chatId: number, msgId: number | undefined, scheduleId: string, config: AgentConfig, toolCtx: ToolContext): Promise<void> {
  // Hide buttons immediately
  if (msgId) await removeButtons(config.telegramToken, chatId, msgId, `Running ${scheduleId}...`);

  const scheduleConfig = loadScheduleConfig(config.workspace);
  if (!scheduleConfig) {
    await sendMessage(config.telegramToken, chatId, "No schedules configured.");
    return;
  }

  const schedule = scheduleConfig.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    await sendMessage(config.telegramToken, chatId, `Schedule "${scheduleId}" not found.`);
    return;
  }

  const action = scheduleConfig.actions[schedule.action];
  if (!action) {
    await sendMessage(config.telegramToken, chatId, `Action for "${scheduleId}" not defined.`);
    return;
  }

  try {
    // Fetch data from Composio tools (if any)
    let fetchedData = "No data sources configured.";
    const composioActions = (action as { composio?: Array<{ tool: string; args: Record<string, unknown> }> }).composio;
    if (composioActions?.length) {
      const results = await Promise.all(
        composioActions.map((t) => toolCtx.executeTool(t.tool, t.args)),
      );
      fetchedData = results.join("\n---\n");
    }

    // Process with LLM
    const prompt = `${(action as { prompt: string }).prompt}\n\nData:\n${fetchedData}`;
    const response = await runAgent(config, toolCtx, [], prompt);
    console.log(`[schedules] Run ${scheduleId}: LLM responded (${response.length} chars)`);

    // Format and send
    const format = (action as { telegram_format: string }).telegram_format || "{response}";
    const msg = format
      .replace("{response}", response)
      .replace("{timestamp}", new Date().toLocaleString("tr-TR", { timeZone: config.timezone }));

    await sendMessage(config.telegramToken, chatId, msg);
  } catch (err) {
    console.error(`[schedules] Run ${scheduleId} failed: ${(err as Error).message}`);
    await sendMessage(config.telegramToken, chatId, `Failed to run: ${(err as Error).message}`);
  }
}

async function handleScheduleDeleteConfirm(chatId: number, msgId: number | undefined, scheduleId: string, config: AgentConfig): Promise<void> {
  // Replace the schedule list with delete confirmation
  if (msgId) {
    await editMessageWithButtons(
      config.telegramToken,
      chatId,
      msgId,
      `Delete schedule "${scheduleId}"?`,
      [[
        { text: "\u2705 Yes, delete", callback_data: `sched_delok:${scheduleId}` },
        { text: "\u274C Cancel", callback_data: `sched_toggle:_noop` },
      ]],
    );
  }
}

async function handleScheduleDeleteExecute(chatId: number, msgId: number | undefined, scheduleId: string, config: AgentConfig): Promise<void> {
  const loc = findScheduleFile(config.workspace, scheduleId);
  if (!loc) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Schedule not found.");
    return;
  }

  const data = readScheduleFile(loc.filePath);
  if (!data) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Failed to read config.");
    return;
  }

  const idx = data.schedules.findIndex((s) => s.id === loc.localId);
  if (idx === -1) {
    if (msgId) await removeButtons(config.telegramToken, chatId, msgId, "Schedule not found in config.");
    return;
  }

  const removed = data.schedules.splice(idx, 1)[0];
  delete data.actions[removed.action];
  writeFileSync(loc.filePath, JSON.stringify(data, null, 2) + "\n");

  if (msgId) await removeButtons(config.telegramToken, chatId, msgId, `Deleted: ${scheduleId}`);
  console.log(`[schedules] ${scheduleId} deleted`);
}

async function editMessageWithButtons(
  token: string,
  chatId: number,
  messageId: number,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup: { inline_keyboard: keyboard },
      }),
    });
  } catch { /* ignore */ }
}

/* ── Template catalog (shared between runtime + web) ─────── */

const TEMPLATE_CATALOG = [
  { id: "productivity-agent", name: "Productivity Agent", price: "Free" },
  { id: "data-analyst", name: "Data Analyst", price: "Free" },
  { id: "inbox-agent", name: "Inbox Agent", price: "$19" },
  { id: "reddit-hn-digest", name: "Reddit & HN Digest", price: "$19" },
  { id: "youtube-digest", name: "YouTube Digest", price: "$19" },
  { id: "health-tracker", name: "Health Tracker", price: "$29" },
  { id: "earnings-tracker", name: "Earnings Tracker", price: "$29" },
  { id: "research-agent", name: "Research Agent", price: "$39" },
  { id: "knowledge-base", name: "Knowledge Base", price: "$39" },
  { id: "family-calendar", name: "Family Calendar", price: "$39" },
  { id: "content-agent", name: "Content Agent", price: "$49" },
  { id: "personal-crm", name: "Personal CRM", price: "$49" },
  { id: "youtube-creator", name: "YouTube Creator", price: "$69" },
  { id: "devops-agent", name: "DevOps Agent", price: "$79" },
  { id: "customer-service", name: "Customer Service", price: "$79" },
  { id: "sales-agent", name: "Sales Agent", price: "$79" },
  { id: "six-agent-company", name: "6-Agent Company", price: "$149" },
];

/* ── /templates command (info + switch unified) ──────────── */

async function handleTemplates(chatId: number, config: AgentConfig): Promise<void> {
  const capabilities = loadInstalledCapabilities(config.workspace);

  if (capabilities.length === 0) {
    // Show full template catalog with URL buttons
    const lines = TEMPLATE_CATALOG.map((t) => {
      const tag = t.price === "Free" ? "FREE" : t.price;
      return `\u2022 *${t.name}* \u2014 ${tag}`;
    });

    const text =
      `*seclaw Templates (${TEMPLATE_CATALOG.length})*\n\n` +
      lines.join("\n") +
      "\n\n_Tap a template to view details:_";

    // Build URL keyboard — 1 per row for readability
    const keyboard: Array<Array<{ text: string; url: string }>> = [];
    for (const t of TEMPLATE_CATALOG) {
      keyboard.push([{
        text: `${t.name} — ${t.price}`,
        url: `https://seclawai.com/templates/${t.id}`,
      }]);
    }

    await sendMessageWithButtons(config.telegramToken, chatId, text, keyboard as any);
    return;
  }

  const activeMode = getActiveMode(config.workspace);

  // Count enabled schedules per capability
  const scheduleConfig = loadScheduleConfig(config.workspace);
  const scheduleCountByCapability: Record<string, number> = {};
  if (scheduleConfig) {
    for (const s of scheduleConfig.schedules) {
      if (s.enabled === false) continue;
      if (s.id.includes(":")) {
        const capId = s.id.split(":")[0];
        scheduleCountByCapability[capId] = (scheduleCountByCapability[capId] || 0) + 1;
      }
    }
  }

  const lines = capabilities.map((capId) => {
    const displayName = capId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const schedCount = scheduleCountByCapability[capId] || 0;
    const schedLabel = schedCount > 0 ? ` \u2014 ${schedCount} schedule${schedCount > 1 ? "s" : ""}` : "";
    const promptPath = resolve(config.workspace, "config", "capabilities", capId, "system-prompt.md");
    const hasPrompt = existsSync(promptPath);
    const statusIcon = hasPrompt ? "\u2705" : "\u26A0\uFE0F";
    return `${statusIcon} *${displayName}*${schedLabel}`;
  });

  // Mode label
  let modeLabel: string;
  if (activeMode === "auto") {
    modeLabel = `Auto \u2014 all ${capabilities.length} templates active`;
  } else {
    const activeName = activeMode.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    modeLabel = `${activeName} (focus mode)`;
  }

  // Available templates not yet installed
  const notInstalled = TEMPLATE_CATALOG.filter((t) => !capabilities.includes(t.id));

  let text = `*Installed Templates (${capabilities.length})*\n\n${lines.join("\n")}\n\nMode: *${modeLabel}*`;

  if (notInstalled.length > 0) {
    text += `\n\n${notInstalled.length} more available:`;
  }

  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

  // Switch buttons (only when 2+ installed)
  if (capabilities.length >= 2) {
    const autoLabel = activeMode === "auto" ? "\u2705 Auto (All Templates)" : "\uD83D\uDD04 Auto (All Templates)";
    keyboard.push([{ text: autoLabel, callback_data: "cap_switch:auto" }]);

    const capButtons: Array<{ text: string; callback_data: string }> = [];
    for (const capId of capabilities) {
      const displayName = capId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const icon = activeMode === capId ? "\u2705" : "\u25CB";
      capButtons.push({ text: `${icon} ${displayName}`, callback_data: `cap_switch:${capId}` });
    }
    for (let i = 0; i < capButtons.length; i += 2) {
      keyboard.push(capButtons.slice(i, i + 2));
    }
  }

  // Not-installed templates — 1 per row with details link
  for (const t of notInstalled) {
    keyboard.push([{
      text: `${t.name} — Details`,
      url: `https://seclawai.com/templates/${t.id}`,
    }]);
  }

  await sendMessageWithButtons(config.telegramToken, chatId, text, keyboard as any);
}

async function handleSwitchCallback(chatId: number, msgId: number | undefined, capId: string, config: AgentConfig): Promise<void> {
  const capabilities = loadInstalledCapabilities(config.workspace);

  // Validate
  if (capId !== "auto" && !capabilities.includes(capId)) {
    await sendMessage(config.telegramToken, chatId, `Capability "${capId}" is not installed.`);
    return;
  }

  // Update installed.json
  setActiveMode(config.workspace, capId);

  // Reload system prompt in-memory
  config.systemPrompt = reloadSystemPrompt(config.workspace);

  // Remove buttons from original message
  if (msgId) {
    const label = capId === "auto"
      ? `\u2705 Switched to *Auto* \u2014 all capabilities active`
      : `\u2705 Switched to *${capId.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}*`;
    await removeButtons(config.telegramToken, chatId, msgId, label);
  }

  console.log(`[switch] Mode changed to: ${capId}`);
}

export async function sendMessageWithButtons(
  token: string,
  chatId: number,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>,
): Promise<void> {
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.log(`[telegram] Markdown failed (buttons): ${data.description} — retrying plain`);
      const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: { inline_keyboard: keyboard },
        }),
      });
      const retryData = await retryRes.json() as { ok: boolean; description?: string };
      if (!retryData.ok) {
        console.error(`[telegram] Plain also failed (buttons): ${retryData.description}`);
      }
    }
  } catch (err) {
    console.error(`[telegram] sendMessageWithButtons error:`, (err as Error).message);
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: { inline_keyboard: keyboard },
        }),
      });
    } catch { /* give up */ }
  }
}

async function answerCallbackQuery(token: string, callbackId: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId }),
    });
  } catch { /* best effort */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function composioFetch(apiKey: string, path: string, options?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${COMPOSIO_API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Composio ${res.status}: ${body.substring(0, 200)}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Composio API timeout (15s). Try again later.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseBody(req: IncomingMessage): Promise<TelegramUpdate | null> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data) as TelegramUpdate); }
      catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

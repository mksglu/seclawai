import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentConfig } from "./config.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  _composio?: boolean;
  _app?: string;
}

export interface ToolContext {
  tools: ToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
  reloadComposio: () => Promise<void>;
}

// Agent runner injected from agent.ts to avoid circular deps (tools.ts <-> llm.ts)
export type AgentRunner = (message: string) => Promise<string>;
let _agentRunner: AgentRunner | null = null;
export function setAgentRunner(runner: AgentRunner): void {
  _agentRunner = runner;
}

// Pending confirmations: confirmId -> { chatId, onApprove, onReject }
export interface PendingConfirmation {
  chatId: number;
  onApprove: string;
  onReject?: string;
  token: string;
}
export const pendingConfirmations = new Map<string, PendingConfirmation>();

interface ToolSource {
  client?: Client;
  execute?: (name: string, args: Record<string, unknown>) => Promise<string>;
  source: string;
}

interface CommanderConnection {
  client: Client;
  tools: ToolDefinition[];
}

interface ComposioConnection {
  tools: ToolDefinition[];
  execute: (name: string, args: Record<string, unknown>) => Promise<string>;
}

interface ComposioAccount {
  toolkit?: { slug?: string };
  user_id?: string;
  [key: string]: unknown;
}

interface ComposioToolDef {
  slug: string;
  name?: string;
  description?: string;
  input_parameters?: Record<string, unknown>;
  toolkit?: { slug?: string };
}

interface MCPToolResult {
  content?: Array<{ text?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * Initialize tool connections to MCP servers.
 * Returns a tool context with all available tools and an executeTool function.
 */
export async function initTools(config: AgentConfig): Promise<ToolContext> {
  const allTools: ToolDefinition[] = [];
  const toolSources = new Map<string, ToolSource>();

  // 1. Connect to Desktop Commander MCP (SSE)
  const commanderTools = await connectCommander(config.commanderUrl);
  if (commanderTools) {
    for (const tool of commanderTools.tools) {
      allTools.push(tool);
      toolSources.set(tool.name, { client: commanderTools.client, source: "commander" });
    }
    console.log(`[tools] Commander: ${commanderTools.tools.length} tools`);
  }

  // 2. Connect to Composio (if API key provided)
  const loadComposio = async () => {
    if (!config.composioApiKey) return;

    // Remove old Composio tools
    for (let i = allTools.length - 1; i >= 0; i--) {
      if (allTools[i]._composio) {
        toolSources.delete(allTools[i].name);
        allTools.splice(i, 1);
      }
    }

    const composioTools = await connectComposio(config);
    if (composioTools) {
      for (const tool of composioTools.tools) {
        allTools.push(tool);
        toolSources.set(tool.name, {
          execute: composioTools.execute,
          source: "composio",
        });
      }
      console.log(`[tools] Composio: ${composioTools.tools.length} tools`);
    }
  };

  await loadComposio();

  // 3. Built-in tools
  const builtins = createBuiltinTools(config);
  for (const b of builtins) {
    allTools.push(b.definition);
    toolSources.set(b.definition.name, { execute: b.execute, source: "builtin" });
  }

  const ctx: ToolContext = {
    tools: allTools,
    executeTool: async (name: string, args: Record<string, unknown>): Promise<string> => {
      const source = toolSources.get(name);
      if (!source) {
        return `Error: Unknown tool "${name}"`;
      }

      try {
        if (source.client) {
          // MCP tool call (Commander)
          const result = await source.client.callTool({ name, arguments: args });
          return formatToolResult(result as MCPToolResult);
        } else if (source.execute) {
          // Direct execution (Composio / builtin)
          return await source.execute(name, args);
        }
        return `Error: No executor for tool "${name}"`;
      } catch (err) {
        return `Error executing ${name}: ${(err as Error).message}`;
      }
    },
    reloadComposio: async () => {
      console.log("[tools] Reloading Composio tools...");
      await loadComposio();
      console.log(`[tools] Reload complete: ${allTools.length} total tools`);
    },
  };

  // 4. Built-in tools that need toolCtx
  const advancedTools = [
    createTriggerScheduleTool(config, ctx),
    createScheduleActionTool(config),
  ];
  for (const t of advancedTools) {
    allTools.push(t.definition);
    toolSources.set(t.definition.name, { execute: t.execute, source: "builtin" });
  }

  return ctx;
}

/**
 * Connect to Desktop Commander MCP server via SSE.
 */
async function connectCommander(baseUrl: string): Promise<CommanderConnection | null> {
  const sseUrl = `${baseUrl}/sse`;
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const transport = new SSEClientTransport(new URL(sseUrl));
      const client = new Client(
        { name: "seclaw-agent", version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      const { tools } = await client.listTools();
      return { client, tools: tools as unknown as ToolDefinition[] };
    } catch (err) {
      if (attempt < maxRetries - 1) {
        console.log(`[tools] Commander not ready, retrying (${attempt + 1}/${maxRetries})...`);
        await sleep(3000);
      } else {
        console.error(`[tools] Failed to connect to Commander: ${(err as Error).message}`);
        return null;
      }
    }
  }
  return null;
}

/**
 * Connect to Composio via REST API and dynamically discover tools.
 * No SDK needed -- uses direct fetch() calls to backend.composio.dev/api/v3.
 *
 * Discovery flow:
 * 1. GET /connected_accounts?status=ACTIVE -> which apps are connected
 * 2. GET /tools?toolkit_slug={app}&important=true -> important tools per app
 * 3. POST /tools/execute/{slug} -> execute tool with entity_id
 */
async function connectComposio(config: AgentConfig): Promise<ComposioConnection | null> {
  const { composioApiKey, composioUserId } = config;
  const API = "https://backend.composio.dev/api/v3";

  const apiFetch = async (path: string, options?: RequestInit): Promise<Record<string, unknown>> => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "x-api-key": composioApiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Composio API ${res.status}: ${body}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  };

  try {
    // 1. List active connected accounts
    const accounts = await apiFetch("/connected_accounts?status=ACTIVE") as { items?: (ComposioAccount & { status?: string })[] };
    const activeApps = [...new Set(
      (accounts.items || [])
        .filter((a) => a.status === "ACTIVE")
        .map((a) => a.toolkit?.slug)
        .filter(Boolean) as string[]
    )];

    if (activeApps.length === 0) {
      console.log("[tools] Composio: no active connections");
      return null;
    }

    console.log(`[tools] Composio active: ${activeApps.join(", ")}`);

    // Map first active account per app (for entity_id during execution)
    const accountByApp: Record<string, ComposioAccount> = {};
    for (const acc of accounts.items || []) {
      const slug = acc.toolkit?.slug;
      if (slug && !accountByApp[slug]) accountByApp[slug] = acc;
    }

    // 2. Fetch important tools for each connected app in parallel
    const toolResults = await Promise.allSettled(
      activeApps.map((app) =>
        apiFetch(`/tools?toolkit_slug=${app}&important=true&limit=20`)
      )
    );

    const tools: ToolDefinition[] = [];
    for (let i = 0; i < activeApps.length; i++) {
      const r = toolResults[i];
      if (r.status !== "fulfilled") continue;
      const items = (r.value.items || []) as ComposioToolDef[];
      for (const def of items) {
        tools.push({
          name: def.slug,
          description: def.description || def.name || "",
          inputSchema: def.input_parameters || { type: "object", properties: {} },
          _composio: true,
          _app: def.toolkit?.slug || activeApps[i],
        });
      }
    }

    if (tools.length === 0) {
      console.log("[tools] Composio: no important tools found");
      return null;
    }

    console.log(`[tools] Composio: ${tools.length} tools loaded`);

    // 3. Return tool definitions + executor
    return {
      tools,
      execute: async (toolName: string, args: Record<string, unknown>): Promise<string> => {
        try {
          const tool = tools.find((t) => t.name === toolName);
          const account = tool?._app ? accountByApp[tool._app] : null;
          const entityId = account?.user_id || composioUserId || "default";

          const result = await apiFetch(`/tools/execute/${toolName}`, {
            method: "POST",
            body: JSON.stringify({
              entity_id: entityId,
              arguments: args,
            }),
          });
          const data = result.data || result;
          return typeof data === "string" ? data : JSON.stringify(data, null, 2);
        } catch (err) {
          return `Error executing ${toolName}: ${(err as Error).message}`;
        }
      },
    };
  } catch (err) {
    console.error(`[tools] Composio init failed: ${(err as Error).message}`);
    return null;
  }
}

function formatToolResult(result: MCPToolResult | string | null): string {
  if (!result) return "(no result)";
  if (typeof result === "string") return result;
  if (result.content) {
    return result.content
      .map((c) => c.text || JSON.stringify(c))
      .join("\n");
  }
  return JSON.stringify(result);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface BuiltinTool {
  definition: ToolDefinition;
  execute: (name: string, args: Record<string, unknown>) => Promise<string>;
}

function readSchedules(workspace: string): { schedules: ScheduleEntry[]; actions: Record<string, ActionDef> } | null {
  const p = resolve(workspace, "config", "schedules.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function writeSchedules(workspace: string, data: { schedules: ScheduleEntry[]; actions: Record<string, ActionDef> }): void {
  const p = resolve(workspace, "config", "schedules.json");
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

interface ScheduleEntry {
  id: string;
  cron: string;
  timezone: string;
  action: string;
  description: string;
  enabled?: boolean;
}

interface ActionDef {
  composio?: Array<{ tool: string; args: Record<string, unknown> }>;
  prompt: string;
  telegram_format: string;
  confirm?: boolean;
}

function sendTelegram(token: string, chatId: number, text: string): void {
  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error(`[telegram] Send failed: ${(err as Error).message}`));
}

function createBuiltinTools(config: AgentConfig): BuiltinTool[] {
  return [
    // 1. Send a message after a delay
    {
      definition: {
        name: "send_delayed_message",
        description:
          "Send a Telegram message after a delay. Use when user asks to be reminded, notified later, or to send something after N seconds/minutes.",
        inputSchema: {
          type: "object",
          properties: {
            chat_id: { type: "number", description: "Telegram chat ID" },
            delay_seconds: { type: "number", description: "Seconds to wait (1-3600)" },
            message: { type: "string", description: "Message text to send" },
          },
          required: ["chat_id", "delay_seconds", "message"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const chatId = (args.chat_id as number) || config.telegramChatId;
        const delay = Math.min(Math.max(args.delay_seconds as number || 5, 1), 3600);
        const message = args.message as string;
        if (!chatId) return "Error: no chat_id provided and TELEGRAM_CHAT_ID not set.";

        setTimeout(() => {
          sendTelegram(config.telegramToken, chatId, message);
          console.log(`[delayed] Sent to ${chatId} after ${delay}s`);
        }, delay * 1000);

        return `Message scheduled. Will be sent in ${delay} seconds.`;
      },
    },

    // 2. Request confirmation from user (HITL)
    {
      definition: {
        name: "request_confirmation",
        description:
          "Send a confirmation request to the user with Approve/Reject buttons. If approved, executes the specified action with full agent capabilities. Use for 'ask me first', 'confirm before doing', HITL workflows.",
        inputSchema: {
          type: "object",
          properties: {
            chat_id: { type: "number", description: "Telegram chat ID" },
            question: { type: "string", description: "Question to ask the user" },
            on_approve: {
              type: "string",
              description: "Action to perform if user approves (natural language, e.g. 'send naber to the user')",
            },
            delay_seconds: {
              type: "number",
              description: "Optional: seconds to wait before sending the confirmation (0 = immediate)",
            },
          },
          required: ["chat_id", "question", "on_approve"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const chatId = (args.chat_id as number) || config.telegramChatId;
        const question = args.question as string;
        const onApprove = args.on_approve as string;
        const delay = Math.min(Math.max((args.delay_seconds as number) || 0, 0), 3600);
        if (!chatId) return "Error: no chat_id provided.";

        const confirmId = `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        pendingConfirmations.set(confirmId, {
          chatId,
          onApprove,
          token: config.telegramToken,
        });

        // Auto-expire after 1 hour
        setTimeout(() => pendingConfirmations.delete(confirmId), 3600_000);

        const sendConfirmation = () => {
          fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: question,
              reply_markup: {
                inline_keyboard: [[
                  { text: "Approve", callback_data: `confirm_yes:${confirmId}` },
                  { text: "Reject", callback_data: `confirm_no:${confirmId}` },
                ]],
              },
            }),
          }).catch((err) => console.error(`[confirm] Send failed: ${(err as Error).message}`));
        };

        if (delay > 0) {
          setTimeout(sendConfirmation, delay * 1000);
          return `Confirmation will be sent in ${delay} seconds.`;
        }
        sendConfirmation();
        return `Confirmation request sent. Waiting for user response.`;
      },
    },

    // 3. List all configured schedules
    {
      definition: {
        name: "list_schedules",
        description:
          "List all configured recurring schedules (cron jobs). Shows ID, cron expression, timezone, description, and enabled status.",
        inputSchema: { type: "object", properties: {} },
      },
      execute: async (): Promise<string> => {
        const data = readSchedules(config.workspace);
        if (!data || data.schedules.length === 0) return "No schedules configured.";

        return data.schedules.map((s) => {
          const status = s.enabled !== false ? "enabled" : "disabled";
          return `- ${s.id} [${status}]: "${s.description}" | cron: ${s.cron} | tz: ${s.timezone}`;
        }).join("\n");
      },
    },

    // 3. Enable or disable a schedule
    {
      definition: {
        name: "toggle_schedule",
        description:
          "Enable or disable a recurring schedule. Takes effect on the next cron tick (no restart needed).",
        inputSchema: {
          type: "object",
          properties: {
            schedule_id: { type: "string", description: "Schedule ID to toggle" },
            enabled: { type: "boolean", description: "true to enable, false to disable" },
          },
          required: ["schedule_id", "enabled"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const data = readSchedules(config.workspace);
        if (!data) return "No schedules configured.";

        const schedule = data.schedules.find((s) => s.id === args.schedule_id);
        if (!schedule) {
          const ids = data.schedules.map((s) => s.id).join(", ");
          return `Schedule "${args.schedule_id}" not found. Available: ${ids}`;
        }

        schedule.enabled = args.enabled as boolean;
        writeSchedules(config.workspace, data);

        const state = schedule.enabled ? "enabled" : "disabled";
        return `Schedule "${schedule.id}" is now ${state}. Takes effect on next cron tick.`;
      },
    },

    // 4. Create a new schedule
    {
      definition: {
        name: "create_schedule",
        description:
          "Create a new recurring schedule. Requires agent restart to activate the cron trigger. Use standard cron expressions (e.g. '0 9 * * *' for daily at 9am, '0 */2 * * *' for every 2 hours).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique schedule ID (lowercase, hyphens ok)" },
            cron: { type: "string", description: "Cron expression (e.g. '0 9 * * *')" },
            description: { type: "string", description: "Human-readable description" },
            prompt: { type: "string", description: "LLM prompt for processing fetched data" },
            telegram_format: {
              type: "string",
              description: "Telegram message format. Use {response} for LLM output, {timestamp} for current time.",
            },
          },
          required: ["id", "cron", "description", "prompt"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const data = readSchedules(config.workspace) || { schedules: [], actions: {} };
        const id = args.id as string;

        if (data.schedules.some((s) => s.id === id)) {
          return `Schedule "${id}" already exists. Use a different ID.`;
        }

        const actionId = id;
        data.schedules.push({
          id,
          cron: args.cron as string,
          timezone: config.timezone,
          action: actionId,
          description: args.description as string,
          enabled: true,
        });

        data.actions[actionId] = {
          prompt: args.prompt as string,
          telegram_format: (args.telegram_format as string) || `*${args.description}*\n_{timestamp}_\n\n{response}`,
        };

        writeSchedules(config.workspace, data);
        return `Schedule "${id}" created (cron: ${args.cron}). Restart the agent to activate.`;
      },
    },

    // 5. Update persistent memory (no MCP dependency)
    {
      definition: {
        name: "update_memory",
        description:
          "Append a new entry to memory/learnings.md. Use this EVERY TIME you learn something new about the user (name, preferences, habits, language, etc.). Each entry is timestamped automatically.",
        inputSchema: {
          type: "object",
          properties: {
            entry: {
              type: "string",
              description: "What you learned, as a concise bullet point (e.g. 'User prefers Turkish', 'User name is Mert')",
            },
          },
          required: ["entry"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const entry = args.entry as string;
        if (!entry) return "Error: entry is required.";

        const memDir = resolve(config.workspace, "memory");
        const memPath = resolve(memDir, "learnings.md");

        try {
          mkdirSync(memDir, { recursive: true });

          let content = "";
          if (existsSync(memPath)) {
            content = readFileSync(memPath, "utf-8");
          }

          const timestamp = new Date().toISOString().split("T")[0];
          const newEntry = `- [${timestamp}] ${entry}`;

          // Avoid duplicate entries
          if (content.includes(entry)) {
            return `Already saved: "${entry}"`;
          }

          const updated = content.trim()
            ? `${content.trim()}\n${newEntry}\n`
            : `# Learnings\n\n${newEntry}\n`;

          writeFileSync(memPath, updated);
          return `Saved to memory: "${entry}"`;
        } catch (err) {
          return `Error writing memory: ${(err as Error).message}`;
        }
      },
    },

    // 6. Delete a schedule
    {
      definition: {
        name: "delete_schedule",
        description:
          "Delete a recurring schedule permanently. Removes from config. Restart needed to fully remove the cron trigger.",
        inputSchema: {
          type: "object",
          properties: {
            schedule_id: { type: "string", description: "Schedule ID to delete" },
          },
          required: ["schedule_id"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const data = readSchedules(config.workspace);
        if (!data) return "No schedules configured.";

        const idx = data.schedules.findIndex((s) => s.id === args.schedule_id);
        if (idx === -1) {
          const ids = data.schedules.map((s) => s.id).join(", ");
          return `Schedule "${args.schedule_id}" not found. Available: ${ids}`;
        }

        const removed = data.schedules.splice(idx, 1)[0];
        delete data.actions[removed.action];
        writeSchedules(config.workspace, data);

        return `Schedule "${removed.id}" deleted. Restart to fully remove the cron trigger.`;
      },
    },

    // 7. Save a note
    {
      definition: {
        name: "save_note",
        description:
          "Save a note to the notes/ directory. Use for quick thoughts, links, ideas, meeting notes, or anything the user wants to jot down.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short title for the note (used as filename, e.g. 'meeting-ideas')" },
            content: { type: "string", description: "The note content in markdown" },
          },
          required: ["title", "content"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const title = slugify(args.title as string);
        const content = args.content as string;
        const dir = resolve(config.workspace, "notes");
        mkdirSync(dir, { recursive: true });
        const filePath = resolve(dir, `${title}.md`);
        const exists = existsSync(filePath);
        writeFileSync(filePath, content);
        return exists ? `Note updated: notes/${title}.md` : `Note saved: notes/${title}.md`;
      },
    },

    // 8. Create a task
    {
      definition: {
        name: "create_task",
        description:
          "Create a task in the tasks/ directory. Use when the user wants to track something to do later, a TODO, a reminder for a future action, or a project step.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short task title (used as filename, e.g. 'review-contract')" },
            description: { type: "string", description: "What needs to be done" },
            priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority (default: medium)" },
            due: { type: "string", description: "Optional due date (e.g. '2026-02-15')" },
          },
          required: ["title", "description"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const title = slugify(args.title as string);
        const priority = (args.priority as string) || "medium";
        const due = args.due as string || "";
        const created = new Date().toISOString().split("T")[0];
        const dir = resolve(config.workspace, "tasks");
        mkdirSync(dir, { recursive: true });
        const filePath = resolve(dir, `${title}.md`);

        const content = [
          `# ${args.title as string}`,
          ``,
          `- **Status:** open`,
          `- **Priority:** ${priority}`,
          `- **Created:** ${created}`,
          due ? `- **Due:** ${due}` : null,
          ``,
          args.description as string,
          ``,
        ].filter(Boolean).join("\n");

        writeFileSync(filePath, content);
        return `Task created: tasks/${title}.md [${priority}]`;
      },
    },

    // 9. Complete a task
    {
      definition: {
        name: "complete_task",
        description:
          "Mark a task as completed. Updates the status in the task file.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task filename (without .md extension)" },
          },
          required: ["title"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const title = slugify(args.title as string);
        const filePath = resolve(config.workspace, "tasks", `${title}.md`);
        if (!existsSync(filePath)) return `Task not found: tasks/${title}.md`;

        let content = readFileSync(filePath, "utf-8");
        content = content.replace("**Status:** open", "**Status:** done");
        writeFileSync(filePath, content);
        return `Task completed: tasks/${title}.md`;
      },
    },

    // 10. Save a report
    {
      definition: {
        name: "save_report",
        description:
          "Save a report to the reports/ directory. Use for research results, analysis summaries, email digests, daily briefings, or any structured output the user requests.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Report title (e.g. 'weekly-email-summary')" },
            content: { type: "string", description: "The report content in markdown" },
          },
          required: ["title", "content"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const title = slugify(args.title as string);
        const date = new Date().toISOString().split("T")[0];
        const dir = resolve(config.workspace, "reports");
        mkdirSync(dir, { recursive: true });
        const filePath = resolve(dir, `${date}-${title}.md`);
        writeFileSync(filePath, args.content as string);
        return `Report saved: reports/${date}-${title}.md`;
      },
    },

    // 11. Save a draft
    {
      definition: {
        name: "save_draft",
        description:
          "Save a draft to the drafts/ directory. Use for draft emails, messages, documents, blog posts, or any content the user wants to review before sending/publishing.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Draft title (e.g. 'reply-to-client')" },
            content: { type: "string", description: "The draft content" },
          },
          required: ["title", "content"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const title = slugify(args.title as string);
        const dir = resolve(config.workspace, "drafts");
        mkdirSync(dir, { recursive: true });
        const filePath = resolve(dir, `${title}.md`);
        const exists = existsSync(filePath);
        writeFileSync(filePath, args.content as string);
        return exists ? `Draft updated: drafts/${title}.md` : `Draft saved: drafts/${title}.md`;
      },
    },

    // 12. List files in a workspace directory
    {
      definition: {
        name: "list_files",
        description:
          "List files in a workspace directory. Use to show the user their tasks, notes, reports, or drafts.",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              enum: ["tasks", "notes", "reports", "drafts", "memory"],
              description: "Which workspace directory to list",
            },
          },
          required: ["directory"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const dirName = args.directory as string;
        const allowed = ["tasks", "notes", "reports", "drafts", "memory"];
        if (!allowed.includes(dirName)) return `Invalid directory. Use: ${allowed.join(", ")}`;

        const dir = resolve(config.workspace, dirName);
        if (!existsSync(dir)) return `No files in ${dirName}/ yet.`;

        const files = readdirSync(dir).filter((f) => !f.startsWith("."));
        if (files.length === 0) return `No files in ${dirName}/ yet.`;

        return `${dirName}/ (${files.length} files):\n${files.map((f) => `- ${f}`).join("\n")}`;
      },
    },

    // 13. Read a workspace file
    {
      definition: {
        name: "read_file",
        description:
          "Read a file from the workspace. Use to show the user a specific task, note, report, or draft.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Relative path from workspace root (e.g. 'tasks/review-contract.md', 'notes/ideas.md')",
            },
          },
          required: ["path"],
        },
      },
      execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
        const relPath = (args.path as string).replace(/^\/+/, "");
        // Security: prevent directory traversal
        if (relPath.includes("..") || relPath.startsWith("/")) {
          return "Error: invalid path.";
        }
        const filePath = resolve(config.workspace, relPath);
        if (!existsSync(filePath)) return `File not found: ${relPath}`;

        const content = readFileSync(filePath, "utf-8");
        if (content.length > 3000) {
          return content.substring(0, 3000) + "\n\n...(truncated)";
        }
        return content;
      },
    },
  ];
}

/** Convert a title to a safe filename slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
}

// Separate: needs toolCtx for Composio tool execution
function createTriggerScheduleTool(config: AgentConfig, ctx: ToolContext): BuiltinTool {
  return {
    definition: {
      name: "trigger_schedule_now",
      description:
        "Manually run a scheduled task right now. Fetches data from configured sources and returns it with the action prompt for you to process.",
      inputSchema: {
        type: "object",
        properties: {
          schedule_id: { type: "string", description: "Schedule ID to trigger" },
        },
        required: ["schedule_id"],
      },
    },
    execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
      const data = readSchedules(config.workspace);
      if (!data) return "No schedules configured.";

      const schedule = data.schedules.find((s) => s.id === args.schedule_id);
      if (!schedule) {
        const ids = data.schedules.map((s) => s.id).join(", ");
        return `Schedule "${args.schedule_id}" not found. Available: ${ids}`;
      }

      const action = data.actions[schedule.action];
      if (!action) return `Action "${schedule.action}" not defined.`;

      // Fetch data from configured Composio tools
      let fetchedData = "No data sources configured for this schedule.";
      if (action.composio?.length) {
        const results = await Promise.all(
          action.composio.map((t) => ctx.executeTool(t.tool, t.args)),
        );
        fetchedData = results.join("\n---\n");
      }

      // Return data + prompt for the calling LLM to process
      return [
        `Data fetched for "${schedule.description}".`,
        ``,
        `Action prompt: ${action.prompt}`,
        ``,
        `Fetched data:`,
        fetchedData,
      ].join("\n");
    },
  };
}

// General-purpose delayed action: runs the full agent after a delay
function createScheduleActionTool(config: AgentConfig): BuiltinTool {
  return {
    definition: {
      name: "schedule_action",
      description:
        "Schedule ANY action to be performed after a delay. The action runs with full agent capabilities: file creation, emails, API calls, calculations, etc. Use this when the user asks to do something 'after X seconds/minutes' or 'later'.",
      inputSchema: {
        type: "object",
        properties: {
          chat_id: { type: "number", description: "Telegram chat ID for result notification" },
          delay_seconds: { type: "number", description: "Seconds to wait before executing (1-3600)" },
          action: { type: "string", description: "What to do, in natural language (e.g. 'Create a file called notes.md with today\\'s date')" },
        },
        required: ["chat_id", "delay_seconds", "action"],
      },
    },
    execute: async (_name: string, args: Record<string, unknown>): Promise<string> => {
      const chatId = (args.chat_id as number) || config.telegramChatId;
      const delay = Math.min(Math.max(args.delay_seconds as number || 5, 1), 3600);
      const action = args.action as string;

      if (!chatId) return "Error: no chat_id provided.";
      if (!_agentRunner) return "Error: agent runner not initialized.";

      const runner = _agentRunner;
      setTimeout(async () => {
        try {
          console.log(`[scheduled] Executing after ${delay}s: ${action.substring(0, 80)}`);
          const result = await runner(action);
          sendTelegram(config.telegramToken, chatId, result);
          console.log(`[scheduled] Done, result sent to ${chatId}`);
        } catch (err) {
          const msg = `Scheduled action failed: ${(err as Error).message}`;
          sendTelegram(config.telegramToken, chatId, msg);
          console.error(`[scheduled] ${msg}`);
        }
      }, delay * 1000);

      return `Action scheduled. Will execute "${action}" in ${delay} seconds and send the result to Telegram.`;
    },
  };
}

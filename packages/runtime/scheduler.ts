import { Inngest } from "inngest";
import { serve } from "inngest/node";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AgentConfig } from "./config.js";
import type { ToolContext } from "./tools.js";
import { runAgent } from "./llm.js";
import { sendMessage, sendMessageWithButtons } from "./telegram.js";
import { loadInstalledCapabilities } from "./config.js";

export interface ScheduleConfig {
  schedules: ScheduleEntry[];
  actions: Record<string, ActionDef>;
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

/**
 * Load a single schedule config file and return it, or null.
 */
function loadSingleScheduleConfig(filePath: string): ScheduleConfig | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as ScheduleConfig;
  } catch (err) {
    console.error(`[scheduler] Failed to load ${filePath}: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Load schedule config with support for multi-capability schedule merging.
 * 1. First try the old way: /workspace/config/schedules.json (backwards compat)
 * 2. If installed.json exists, ALSO load schedules from each capability
 * 3. Merge all schedules and actions (prefix schedule IDs with capability ID)
 */
export function loadScheduleConfig(workspace: string): ScheduleConfig | null {
  const mergedSchedules: ScheduleEntry[] = [];
  const mergedActions: Record<string, ActionDef> = {};

  // 1. Load root schedules.json (backwards compat)
  const rootPath = resolve(workspace, "config", "schedules.json");
  const rootConfig = loadSingleScheduleConfig(rootPath);
  if (rootConfig) {
    mergedSchedules.push(...rootConfig.schedules);
    Object.assign(mergedActions, rootConfig.actions);
  }

  // 2. Load capability-specific schedules
  const capabilities = loadInstalledCapabilities(workspace);
  for (const capId of capabilities) {
    const capSchedulePath = resolve(workspace, "config", "capabilities", capId, "schedules.json");
    const capConfig = loadSingleScheduleConfig(capSchedulePath);
    if (capConfig) {
      // Prefix schedule IDs and action keys with capability ID to avoid conflicts
      for (const schedule of capConfig.schedules) {
        const prefixedId = `${capId}:${schedule.id}`;
        const prefixedAction = `${capId}:${schedule.action}`;
        mergedSchedules.push({
          ...schedule,
          id: prefixedId,
          action: prefixedAction,
        });
      }
      for (const [actionKey, actionDef] of Object.entries(capConfig.actions)) {
        mergedActions[`${capId}:${actionKey}`] = actionDef;
      }
      console.log(`[scheduler] Loaded ${capConfig.schedules.length} schedules from capability: ${capId}`);
    }
  }

  if (mergedSchedules.length === 0) return null;

  return {
    schedules: mergedSchedules,
    actions: mergedActions,
  };
}

interface SchedulerResult {
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  client: Inngest;
  count: number;
}

export function initScheduler(config: AgentConfig, toolCtx: ToolContext): SchedulerResult {
  const client = new Inngest({ id: "seclaw-agent" });
  const scheduleConfig = loadScheduleConfig(config.workspace);

  if (!scheduleConfig || scheduleConfig.schedules.length === 0) {
    const handler = serve({ client, functions: [] });
    return { handler: handler as unknown as SchedulerResult["handler"], client, count: 0 };
  }

  const functions = scheduleConfig.schedules
    .filter((s) => s.enabled !== false)
    .map((schedule) => {
      const action = scheduleConfig.actions[schedule.action];

      return client.createFunction(
        { id: schedule.id, name: schedule.description },
        { cron: `TZ=${schedule.timezone} ${schedule.cron}` },
        async ({ step }) => {
          // Check if still enabled (re-read config so toggle takes effect without restart)
          const current = loadScheduleConfig(config.workspace);
          const entry = current?.schedules.find((s) => s.id === schedule.id);
          if (!entry || entry.enabled === false) {
            console.log(`[scheduler] ${schedule.id} is disabled, skipping`);
            return;
          }

          // Step 1: Fetch data via Composio tools
          const data = await step.run("fetch-data", async () => {
            if (!action.composio?.length) return "No data sources configured.";
            const results = await Promise.all(
              action.composio.map((t) => toolCtx.executeTool(t.tool, t.args)),
            );
            return results.join("\n---\n");
          });

          // Step 2: Process with LLM
          const response = await step.run("llm-process", async () => {
            return runAgent(config, toolCtx, [], `${action.prompt}\n\nData:\n${data}`);
          });

          // Step 3: Human-in-the-loop confirmation (if enabled)
          if (action.confirm) {
            // Send preview with approve/reject buttons
            await step.run("send-preview", async () => {
              const chatId = config.telegramChatId;
              if (!chatId) return;
              const preview = action.telegram_format
                .replace("{response}", response)
                .replace("{timestamp}", new Date().toLocaleString("tr-TR", { timeZone: config.timezone }));
              await sendMessageWithButtons(
                config.telegramToken,
                chatId,
                `*Preview — ${schedule.description}*\n\n${preview}`,
                [[
                  { text: "Approve", callback_data: `sched_approve:${schedule.id}` },
                  { text: "Reject", callback_data: `sched_reject:${schedule.id}` },
                ]],
              );
            });

            // Wait for user approval (timeout: 1 hour)
            const approval = await step.waitForEvent("wait-approval", {
              event: "schedule/confirmed",
              match: "data.scheduleId",
              timeout: "1h",
            });

            if (!approval || approval.data?.action === "reject") {
              console.log(`[scheduler] ${schedule.id} rejected by user`);
              const chatId = config.telegramChatId;
              if (chatId) {
                await sendMessage(config.telegramToken, chatId, `Rejected: ${schedule.description}`);
              }
              return;
            }

            console.log(`[scheduler] ${schedule.id} approved by user`);
          }

          // Step 4: Send final message to Telegram with capability footer
          await step.run("send-telegram", async () => {
            const chatId = config.telegramChatId;
            if (!chatId) return;
            let msg = action.telegram_format
              .replace("{response}", response)
              .replace("{timestamp}", new Date().toLocaleString("tr-TR", { timeZone: config.timezone }));

            // Strip LLM capability footer if present (will be replaced with schedule-based footer)
            msg = msg.replace(/\n--- .+$/, "");

            // Append capability footer based on schedule ID prefix
            const capabilityName = schedule.id.includes(":") ? schedule.id.split(":")[0] : schedule.id;
            msg += `\n\n_\u2014 ${capabilityName}_`;

            await sendMessage(config.telegramToken, chatId, msg);
          });
        },
      );
    });

  console.log(`[scheduler] ${functions.length} functions from ${scheduleConfig.schedules.length} schedules`);

  const handler = serve({ client, functions });
  return { handler: handler as unknown as SchedulerResult["handler"], client, count: functions.length };
}

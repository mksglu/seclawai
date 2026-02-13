import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleWebhook } from "./telegram.js";
import { initTools, setAgentRunner } from "./tools.js";
import { runAgent } from "./llm.js";
import { loadConfig, loadInstalledCapabilities } from "./config.js";
import { initScheduler } from "./scheduler.js";

const config = loadConfig();

// Initialize tool connections (Composio + Desktop Commander)
console.log("[agent] Initializing tools...");
const toolCtx = await initTools(config);
console.log(`[agent] ${toolCtx.tools.length} tools available`);

// Wire up agent runner for schedule_action tool (avoids circular dep)
setAgentRunner((msg) => runAgent(config, toolCtx, [], msg));

// Initialize Inngest scheduler
const scheduler = initScheduler(config, toolCtx);
console.log(`[agent] ${scheduler.count} scheduled functions`);

// HTTP server for Telegram webhooks + health checks
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    if (req.method === "POST" && req.url === "/webhook") {
      await handleWebhook(req, res, config, toolCtx, scheduler.client);
    } else if (req.url?.startsWith("/api/inngest")) {
      await scheduler.handler(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        tools: toolCtx.tools.length,
        schedules: scheduler.count,
        capabilities: loadInstalledCapabilities(config.workspace),
        uptime: process.uptime(),
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (err) {
    console.error("[agent] Request error:", (err as Error).message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal error");
    }
  }
});

const PORT = parseInt(process.env.AGENT_PORT || "3000", 10);
server.listen(PORT, () => {
  console.log(`[agent] seclaw agent running on port ${PORT}`);
  if (config.telegramToken) {
    console.log(`[agent] Telegram webhook: POST /webhook`);
  }
});

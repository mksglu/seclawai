import { mkdir, writeFile, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { SetupAnswers } from "./prompts.js";
import { getProviderConfig } from "./prompts.js";

export async function scaffoldProject(
  targetDir: string,
  answers: SetupAnswers
) {
  const dirs = [
    "shared/tasks",
    "shared/reports",
    "shared/notes",
    "shared/drafts",
    "shared/memory",
    "shared/config",
    "templates",
    "commander",
    "agent",
  ];

  for (const dir of dirs) {
    await mkdir(join(targetDir, dir), { recursive: true });
  }

  await writeEnv(targetDir, answers);
  await writeDockerCompose(targetDir);
  await writePermissions(targetDir);
  await writeGitignore(targetDir);
  await writeDockerignore(targetDir);
  await copyAgentFiles(targetDir);
  await copyCommanderFiles(targetDir);
  await writeSeedFiles(targetDir, answers);
}

async function writeEnv(dir: string, answers: SetupAnswers) {
  const config = getProviderConfig(answers.llmProvider);

  const lines = [
    `# LLM Provider: ${config.label}`,
    `LLM_PROVIDER=${answers.llmProvider}`,
    `${config.envVar}=${answers.llmApiKey}`,
    `TIMEZONE=${answers.timezone}`,
    `TELEGRAM_BOT_TOKEN=${answers.telegramToken}`,
    `TELEGRAM_CHAT_ID=`,
  ];

  if (answers.composioApiKey) {
    lines.push(`COMPOSIO_API_KEY=${answers.composioApiKey}`);
    lines.push(`COMPOSIO_USER_ID=${answers.composioUserId || generateUserId()}`);
  }

  await writeFile(join(dir, ".env"), lines.join("\n") + "\n");
}

function generateUserId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "seclaw-user-";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function writeDockerCompose(dir: string) {
  const content = `services:
  inngest:
    image: inngest/inngest:latest
    command: ["inngest", "dev", "-u", "http://agent:3000/api/inngest", "--no-discovery"]
    ports:
      - "8288:8288"
    networks:
      - agent-net
    restart: unless-stopped

  agent:
    build:
      context: ./agent
      dockerfile: Dockerfile
    image: seclaw/agent:latest
    restart: unless-stopped
    volumes:
      - ./shared:/workspace:rw
      - ./templates:/templates:ro
    env_file:
      - .env
    environment:
      - WORKSPACE_PATH=/workspace
      - COMMANDER_URL=http://desktop-commander:3000
      - INNGEST_BASE_URL=http://inngest:8288
      - INNGEST_DEV=1
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - agent-net
    depends_on:
      - inngest
      - desktop-commander
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate --url http://agent:3000
    networks:
      - agent-net
    depends_on:
      agent:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://agent:3000/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s

  desktop-commander:
    build:
      context: ./commander
      dockerfile: Dockerfile
    image: seclaw/desktop-commander:latest
    restart: unless-stopped
    volumes:
      - ./shared:/workspace:rw
      - ./permissions.yml:/permissions.yml:ro
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:size=100M
    cap_drop:
      - ALL
    networks:
      - agent-net
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"

networks:
  agent-net:
    driver: bridge
`;

  await writeFile(join(dir, "docker-compose.yml"), content);
}

/**
 * Copy agent runtime files from CLI templates.
 */
async function copyAgentFiles(dir: string) {
  const agentTemplateSrc = resolve(import.meta.dirname, "..", "runtime");
  const agentDest = join(dir, "agent");

  if (existsSync(agentTemplateSrc)) {
    await cp(agentTemplateSrc, agentDest, { recursive: true });
  } else {
    // Fallback: write minimal agent inline
    await writeMinimalAgent(agentDest);
  }
}

/**
 * Fallback: write minimal agent files if templates/agent not found.
 */
async function writeMinimalAgent(dir: string) {
  await mkdir(dir, { recursive: true });

  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "seclaw-agent",
        version: "1.0.0",
        private: true,
        type: "module",
        dependencies: {
          openai: "^4.73.0",
          "@modelcontextprotocol/sdk": "^1.0.0",
          inngest: "^3.22.0",
        },
      },
      null,
      2
    )
  );

  await writeFile(
    join(dir, "Dockerfile"),
    `FROM node:20-alpine
RUN apk add --no-cache wget && rm -rf /var/cache/apk/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY *.js ./
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget --spider -q http://localhost:3000/health || exit 1
CMD ["node", "agent.js"]
`
  );

  // Minimal agent that just handles Telegram webhooks
  await writeFile(
    join(dir, "agent.js"),
    `import { createServer } from "node:http";
const PORT = parseInt(process.env.AGENT_PORT || "3000", 10);
const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (req.method === "POST" && req.url === "/webhook") {
    let data = "";
    req.on("data", (c) => data += c);
    req.on("end", async () => {
      res.writeHead(200); res.end();
      try {
        const body = JSON.parse(data);
        const chatId = body?.message?.chat?.id;
        const text = body?.message?.text;
        if (chatId && text) {
          await fetch(\`https://api.telegram.org/bot\${process.env.TELEGRAM_BOT_TOKEN}/sendMessage\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "Agent is starting up. Please wait..." }),
          });
        }
      } catch {}
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, () => console.log(\`seclaw agent on port \${PORT}\`));
`
  );
}

async function copyCommanderFiles(dir: string) {
  const packageJson = `{
  "name": "seclaw-commander",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
`;

  const dockerfile = `FROM node:20-alpine

RUN apk add --no-cache git python3 && rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S commander && \\
    adduser -S commander -u 1001 -G commander

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./

RUN mkdir -p /workspace /tmp && \\
    chown -R commander:commander /workspace /tmp

USER commander

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \\
    CMD wget --spider -q http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
`;

  const serverJs = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "node:child_process";
import {
  readFileSync, writeFileSync, mkdirSync,
  readdirSync, statSync, existsSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { createServer } from "node:http";

const WORKSPACE = "/workspace";

function safePath(p) {
  const resolved = resolve(WORKSPACE, p);
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error("Path outside workspace");
  }
  return resolved;
}

const TOOLS = [
  {
    name: "read_file",
    description: "Read a file from the workspace",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Relative path within workspace" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file (creates parent directories automatically)",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path within workspace" },
        content: { type: "string", description: "File content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "List files and directories in the workspace",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Relative path within workspace (use '.' for root)" } },
      required: ["path"],
    },
  },
  {
    name: "execute_command",
    description: "Execute a shell command in the workspace",
    inputSchema: {
      type: "object",
      properties: { command: { type: "string", description: "Shell command to execute" } },
      required: ["command"],
    },
  },
];

function handleTool(name, args) {
  switch (name) {
    case "read_file": {
      const p = safePath(args.path);
      if (!existsSync(p)) {
        return { content: [{ type: "text", text: "File not found: " + args.path }], isError: true };
      }
      const content = readFileSync(p, "utf-8");
      return { content: [{ type: "text", text: content }] };
    }
    case "write_file": {
      const p = safePath(args.path);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, args.content);
      return { content: [{ type: "text", text: "Written: " + args.path }] };
    }
    case "list_directory": {
      const dirPath = safePath(args.path);
      if (!existsSync(dirPath)) {
        return { content: [{ type: "text", text: "Directory not found: " + args.path }], isError: true };
      }
      const entries = readdirSync(dirPath).map((name) => {
        const full = join(dirPath, name);
        const stat = statSync(full);
        return (stat.isDirectory() ? "d" : "-") + " " + name;
      });
      return { content: [{ type: "text", text: entries.join("\\n") || "(empty)" }] };
    }
    case "execute_command": {
      const output = execSync(args.command, {
        cwd: WORKSPACE,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        encoding: "utf-8",
      });
      return { content: [{ type: "text", text: output }] };
    }
    default:
      return { content: [{ type: "text", text: "Unknown tool: " + name }], isError: true };
  }
}

function createMCPServer() {
  const srv = new Server(
    { name: "seclaw-commander", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  srv.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  srv.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try { return handleTool(name, args); }
    catch (err) { return { content: [{ type: "text", text: "Error: " + err.message }], isError: true }; }
  });
  return srv;
}

const sessions = new Map();
const httpServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, "http://localhost:3000");
  if (req.method === "GET" && url.pathname === "/sse") {
    const mcpServer = createMCPServer();
    const transport = new SSEServerTransport("/messages", res);
    sessions.set(transport.sessionId, { server: mcpServer, transport });
    res.on("close", () => sessions.delete(transport.sessionId));
    await mcpServer.connect(transport);
  } else if (req.method === "POST" && url.pathname === "/messages") {
    const sessionId = url.searchParams.get("sessionId");
    const session = sessions.get(sessionId);
    if (session) { await session.transport.handlePostMessage(req, res); }
    else { res.writeHead(400); res.end("Session not found"); }
  } else if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", transport: "sse", sessions: sessions.size }));
  } else { res.writeHead(404); res.end(); }
});
httpServer.listen(3000, () => { console.log("seclaw-commander MCP server (SSE) on port 3000"); });
`;

  await writeFile(join(dir, "commander", "package.json"), packageJson);
  await writeFile(join(dir, "commander", "Dockerfile"), dockerfile);
  await writeFile(join(dir, "commander", "server.js"), serverJs);
}

async function writePermissions(dir: string) {
  const content = `version: 1
rules:
  filesystem:
    allow:
      - /workspace/**
    deny:
      - /workspace/.env*
      - /workspace/.git/**
      - /workspace/node_modules/**
  commands:
    allow:
      - ls
      - cat
      - head
      - tail
      - grep
      - find
      - wc
      - sort
      - uniq
      - node
      - npm
      - npx
      - python3
      - pip
      - git status
      - git log
      - git diff
    deny:
      - rm -rf /
      - curl
      - wget
      - ssh
      - sudo
      - chmod
      - chown
    max_execution_time: 30s
    max_output_size: 1MB
  confirmation_required:
    - pattern: "send*email*"
    - pattern: "delete*"
    - pattern: "post*"
    - pattern: "publish*"
    - pattern: "deploy*"
`;
  await writeFile(join(dir, "permissions.yml"), content);
}

async function writeSeedFiles(dir: string, answers: SetupAnswers) {
  const today = new Date().toISOString().split("T")[0];

  await writeFile(
    join(dir, "shared/memory/learnings.md"),
    `# Agent Memory

## User Profile
- Timezone: ${answers.timezone}
- Setup date: ${today}
- Provider: ${answers.llmProvider}

## Preferences
- (Agent will learn and add preferences here over time)

## Lessons Learned
- (Agent will record what works and what doesn't)
`
  );

  await writeFile(
    join(dir, "shared/tasks/welcome.md"),
    `# Welcome Task
- [ ] Introduce yourself to the user on Telegram
- [ ] Explain what you can do (file management, email, task tracking)
- [ ] Ask the user what they'd like help with today
- [ ] Create today's report at reports/${today}.md after first interaction
`
  );

  await writeFile(
    join(dir, "shared/config/agent.md"),
    `# Agent Configuration

## Workspace Structure
- tasks/    — active tasks and TODO lists
- reports/  — daily reports (YYYY-MM-DD.md)
- notes/    — quick notes and references
- drafts/   — work in progress documents
- memory/   — persistent learnings (survives restarts)
- config/   — this file and user preferences

## Behavior Rules
- Always read memory/learnings.md at the start of a conversation
- Always check tasks/ for pending work
- Write daily reports to reports/
- Update memory/learnings.md when you learn something new about the user
- Keep Telegram messages concise — use bullet points
- Detect user language and respond in the same language
`
  );

  const integrations = [
    `# Connected Integrations`,
    ``,
    `Template: ${answers.template}`,
    ``,
    `## Connected`,
    `- [x] telegram — Telegram Bot`,
    `- [x] ${answers.llmProvider} — LLM Provider`,
  ];

  if (answers.composioApiKey) {
    integrations.push(`- [x] composio — Integration Hub (Gmail, Calendar, etc.)`);
  }

  integrations.push(
    ``,
    `## Available`,
    `Run \`npx seclaw integrations\` to add integrations (Gmail, Google Drive, GitHub, etc.)`,
    ``
  );

  await writeFile(
    join(dir, "shared/config/integrations.md"),
    integrations.join("\n")
  );

  await writeFile(
    join(dir, `shared/reports/${today}.md`),
    `# Daily Report — ${today}

## Status
Agent initialized. Waiting for first interaction.

## Tasks
(Will be populated after first conversation)

## Notes
(Will be populated throughout the day)
`
  );
}

async function writeGitignore(dir: string) {
  const content = `.env
.env.*
!.env.example
node_modules/
*.log
.DS_Store
.tunnel-url
`;
  await writeFile(join(dir, ".gitignore"), content);
}

async function writeDockerignore(dir: string) {
  const content = `.env
.env.*
.git
.gitignore
.DS_Store
*.log
*.md
shared/
templates/
.tunnel-url
`;
  await writeFile(join(dir, ".dockerignore"), content);
}

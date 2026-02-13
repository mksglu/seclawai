import OpenAI from "openai";
import { readFileSync, existsSync } from "node:fs";
import type { AgentConfig } from "./config.js";
import type { ToolContext } from "./tools.js";

interface ProviderConfig {
  baseURL: string;
  defaultModel: string;
  envKey: string;
}

interface ChatMessage {
  role: string;
  content: string | AnthropicContentBlock[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  error?: { message: string };
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-3-flash-preview",
    envKey: "OPENROUTER_API_KEY",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    envKey: "OPENAI_API_KEY",
  },
  anthropic: {
    // Anthropic via OpenRouter for unified tool-calling format
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-sonnet-4-5-20250929",
    envKey: "ANTHROPIC_API_KEY",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
    envKey: "GOOGLE_AI_API_KEY",
  },
};

let _client: OpenAI | null = null;
let _model = "";

function getClient(config: AgentConfig): { client: OpenAI; model: string } {
  if (_client) return { client: _client, model: _model };

  const provider = PROVIDER_CONFIG[config.llmProvider] || PROVIDER_CONFIG.openrouter;

  // For anthropic direct keys, route through OpenRouter if key starts with sk-ant
  const apiKey = config.llmApiKey;
  let baseURL = provider.baseURL;

  if (config.llmProvider === "anthropic" && apiKey.startsWith("sk-ant-")) {
    // Direct Anthropic key - use Anthropic Messages API
    baseURL = "https://api.anthropic.com/v1";
  }

  _client = new OpenAI({ baseURL, apiKey });
  _model = config.llmModel || provider.defaultModel;

  console.log(`[llm] Provider: ${config.llmProvider}, Model: ${_model}`);
  return { client: _client, model: _model };
}

/**
 * Run the full agent loop: LLM call -> tool execution -> repeat until done.
 * Returns the final text response.
 */
export async function runAgent(
  config: AgentConfig,
  toolCtx: ToolContext,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const { client, model } = getClient(config);

  // Build messages
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(config) },
    ...history,
    { role: "user", content: userMessage },
  ];

  // Convert tools to OpenAI format
  const tools: OpenAITool[] = toolCtx.tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.inputSchema || { type: "object", properties: {} },
    },
  }));

  const MAX_ITERATIONS = 10;

  const t0 = Date.now();

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    const callStart = Date.now();
    try {
      const hasTools = tools.length > 0;
      const baseParams = {
        model,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        tools: hasTools ? tools as OpenAI.ChatCompletionTool[] : undefined,
        temperature: 0.7,
        max_tokens: 2048,
      };

      try {
        response = await client.chat.completions.create({
          ...baseParams,
          // @ts-expect-error OpenRouter extended params — disable thinking for faster responses
          reasoning: { effort: "none" },
        });
      } catch (innerErr) {
        const e = innerErr as { status?: number; error?: { code?: string | number } };
        // If 400 Bad Request, it might be due to the 'reasoning' param not being supported (e.g. Gemini)
        // Self-correct by retrying without it.
        if (e.status === 400 || e.error?.code === 400 || (e as any).statusText === "Bad Request") {
          console.warn(`[llm] 400 Bad Request detected. Retrying without 'reasoning' param...`);
          response = await client.chat.completions.create(baseParams);
        } else {
          throw innerErr;
        }
      }
    } catch (err) {
      const e = err as Error & { status?: number; error?: unknown; code?: string; body?: unknown; headers?: unknown };
      console.error(`[llm] API error: status=${e.status || "?"} code=${e.code || "?"} message=${e.message}`);
      
      // OpenAI SDK puts error details in .error or .body
      if (e.error) console.error(`[llm] Error body:`, JSON.stringify(e.error).substring(0, 500));
      if (e.body) console.error(`[llm] Response body:`, JSON.stringify(e.body).substring(0, 500));
      
      if (config.llmProvider === "anthropic" && config.llmApiKey.startsWith("sk-ant-")) {
        return await runAnthropicDirect(config, messages, tools, toolCtx);
      }
      throw err;
    }

    const elapsed = Date.now() - callStart;
    const routed = response.model || model;
    console.log(`[llm] Call ${i + 1}: ${elapsed}ms (model: ${routed})`);

    const choice = response.choices[0];
    const msg = choice.message;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log(`[llm] Total: ${Date.now() - t0}ms, ${i + 1} calls`);
      return msg.content || "(no response)";
    }

    // Execute tool calls
    messages.push(msg as unknown as ChatMessage);

    for (const toolCall of msg.tool_calls) {
      const toolName = toolCall.function.name;
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      console.log(`[llm] Tool call: ${toolName} args=${JSON.stringify(args).substring(0, 100)}`);

      const rawResult = await toolCtx.executeTool(toolName, args);
      const content = truncateToolResult(
        typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult),
      );
      console.log(`[llm] Tool result: ${String(rawResult).length} -> ${content.length} chars`);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content,
      });
    }
  }

  return "I reached the maximum number of tool calls. Here's what I found so far.";
}

/**
 * Fallback for direct Anthropic API (Messages format with tool use).
 */
async function runAnthropicDirect(
  config: AgentConfig,
  messages: ChatMessage[],
  tools: OpenAITool[],
  toolCtx: ToolContext,
): Promise<string> {
  const apiKey = config.llmApiKey;
  const model = config.llmModel || "claude-sonnet-4-5-20250929";

  // Convert OpenAI format messages to Anthropic format
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const anthropicMessages: Array<{ role: string; content: string | AnthropicContentBlock[] }> = nonSystemMsgs.map((m) => ({
    role: m.role === "tool" ? "user" : m.role,
    content: m.role === "tool"
      ? [{ type: "tool_result", tool_use_id: m.tool_call_id || "", content: m.content as string }]
      : m.content,
  }));

  const anthropicTools: AnthropicTool[] = tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const MAX_ITERATIONS = 10;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: (systemMsg?.content as string) || "",
        messages: anthropicMessages,
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
      }),
    });

    const data = await res.json() as AnthropicResponse;

    if (data.error) {
      throw new Error(`Anthropic API error: ${data.error.message}`);
    }

    // Check for tool use
    const toolUseBlocks = (data.content || []).filter((b) => b.type === "tool_use");
    const textBlocks = (data.content || []).filter((b) => b.type === "text");

    if (toolUseBlocks.length === 0) {
      return textBlocks.map((b) => b.text).join("\n") || "(no response)";
    }

    // Add assistant message with tool use
    anthropicMessages.push({ role: "assistant", content: data.content! });

    // Execute tools and add results
    const toolResults: AnthropicContentBlock[] = [];
    for (const block of toolUseBlocks) {
      console.log(`[llm] Tool call (anthropic): ${block.name}`);
      const result = await toolCtx.executeTool(block.name!, block.input!);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  return "I reached the maximum number of tool calls.";
}

function buildSystemPrompt(config: AgentConfig): string {
  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toLocaleTimeString("en-US", { timeZone: config.timezone });

  let prompt = config.systemPrompt || "You are a helpful AI assistant.";

  // Pre-load memory into system prompt so LLM doesn't need tool calls for context
  let memory = "";
  try {
    const memPath = `${config.workspace}/memory/learnings.md`;
    if (existsSync(memPath)) {
      memory = readFileSync(memPath, "utf-8").substring(0, 500);
    }
  } catch { /* ignore */ }

  prompt += `\n\n## Context
- Date: ${today}
- Time: ${time} (${config.timezone})

## Workspace (/workspace)
- **memory/** — Persistent learnings about the user. Use \`update_memory\` tool to save.
- **tasks/** — TODOs and action items. Use \`create_task\` / \`complete_task\` tools.
- **notes/** — Quick thoughts, ideas, meeting notes, links. Use \`save_note\` tool.
- **reports/** — Research results, summaries, digests. Use \`save_report\` tool.
- **drafts/** — Draft emails, messages, documents to review. Use \`save_draft\` tool.
- **config/** — Schedules and capability settings (managed by system).
Use \`list_files\` and \`read_workspace_file\` to browse any directory.
${memory ? `\n## Memory\n${memory}` : ""}

## Rules
- Be concise. Use bullet points for Telegram messages.
- Detect user language and respond in the same language.
- Only use tools when the user asks for something that requires them.
- Do NOT read files preemptively — you already have memory above.
- When you learn something new about the user (name, preferences, language, habits), call the \`update_memory\` tool immediately. Do NOT claim you saved something without calling the tool.
- When the user asks to save/note/draft/track something, use the appropriate workspace tool. Always confirm what was saved.`;

  return prompt;
}

const MAX_TOOL_RESULT = 15_000; // chars — keeps LLM context manageable

/**
 * Truncate and clean tool results to avoid sending huge payloads to the LLM.
 * Strips HTML tags, collapses whitespace, and truncates to MAX_TOOL_RESULT.
 */
function truncateToolResult(text: string): string {
  // Strip HTML tags (email bodies are often full HTML)
  let cleaned = text.replace(/<[^>]+>/g, " ");
  // Collapse whitespace
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  if (cleaned.length <= MAX_TOOL_RESULT) return cleaned;

  return cleaned.substring(0, MAX_TOOL_RESULT) + "\n\n...(truncated)";
}

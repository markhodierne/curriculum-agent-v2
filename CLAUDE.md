# CLAUDE.md

Development standards for this repository. See `FUNCTIONAL.md` for requirements, `ARCHITECTURE.md` for technical details.

## Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Production server
pnpm tsc --noEmit     # Type check
```

**CRITICAL**: Always run `pnpm tsc --noEmit` after writing/modifying code before considering task complete.

**Package Manager**: Use **pnpm only**. Never npm or yarn.

## Stack

- Next.js 15 (App Router, Turbopack)
- AI SDK 5 (OpenAI GPT-5)
- MCP (Model Context Protocol) for dynamic tool retrieval
- shadcn/ui (New York style, neutral)
- Tailwind CSS v4

## Structure

```
app/
  page.tsx                    # Main interface
  api/*/route.ts              # Agent API routes
components/
  chat/chat-assistant.tsx     # Chat UI
  agent/*.ts                  # System prompts
  ai-elements/                # Vercel AI Elements
  ui/                         # shadcn/ui
lib/mcp/client/               # MCP clients
```

## MCP Integration Rules

**Model Context Protocol (MCP)** retrieves tools dynamically from external servers instead of hardcoding them.

### Client Pattern

```typescript
// Singleton instance
export class MCPClient {
  private client: Awaited<ReturnType<typeof experimental_createMCPClient>> | null = null;

  async connect() {
    const transport = new SSEClientTransport(new URL(this.serverUrl));
    this.client = await experimental_createMCPClient({ transport });
  }

  async getTools(): Promise<Record<string, any>> {
    return await this.client!.tools();
  }
}

let instance: MCPClient | null = null;
export function getMCPClient(): MCPClient {
  if (!instance) instance = new MCPClient({ ... });
  return instance;
}
```

### Connection Rules

- ✅ Use singleton pattern for connection reuse
- ✅ SSE transport for hosted servers, stdio for local processes
- ✅ Connect once per API request
- ❌ NEVER disconnect during `streamText()` - causes "closed client" errors
- ✅ Use `Record<string, any>` for tool types (avoid TypeScript deep instantiation)

### MCP Server Deployment (Neo4j Example)

**Source:** `https://github.com/neo4j-contrib/mcp-neo4j/tree/main/servers/mcp-neo4j-cypher`

**Critical:** AI SDK's `SSEClientTransport` requires `--transport sse` mode:

```bash
# Deploy with SSE transport (not http)
mcp-neo4j-cypher \
  --transport sse \
  --db-url "${NEO4J_URI}" \
  --username "${NEO4J_USERNAME}" \
  --password "${NEO4J_PASSWORD}"
```

**Transport compatibility:**
- ✅ `--transport sse` → Works with `SSEClientTransport`
- ❌ `--transport http` → Incompatible (uses POST/JSON-RPC, not SSE)

### Schema Pre-fetching Pattern

For Neo4j or database MCP servers, pre-fetch schema and inject into system prompt:

```typescript
// API route pattern
const mcpClient = getMCPClient();
await mcpClient.connect();
const allTools = await mcpClient.getTools();

// 1. Pre-fetch schema (don't expose to GPT-5)
const schemaResult = await allTools.get_schema_tool.execute({});
const schema = JSON.parse(schemaResult.content[0].text);

// 2. Inject into system prompt
const systemPrompt = buildPrompt(schema);

// 3. Expose only selected tools to GPT-5
const result = streamText({
  model: openai("gpt-5"),
  messages: [
    { role: "system", content: systemPrompt },
    ...convertToModelMessages(messages)
  ],
  tools: {
    // Expose only safe/needed tools
    read_only_query: allTools.read_only_query
    // Don't expose: write tools, schema tools (already pre-fetched)
  },
  stopWhen: stepCountIs(10)
});
```

**Rules:**
- ✅ Pre-fetch schema at conversation start (not as GPT-5 tool)
- ✅ Schema persists in system prompt throughout conversation
- ✅ Selective tool exposure (e.g., read-only, no write access)
- ✅ Fresh schema per conversation session

## AI SDK Rules

**Required Reading:**
- Tools: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Manual loops: https://ai-sdk.dev/cookbook/node/manual-agent-loop
- Streaming data: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data
- streamText: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text

### streamText Configuration

```typescript
const result = streamText({
  model: openai("gpt-5"),
  messages: [...],
  tools: dynamicToolsFromMCP,
  toolChoice: 'auto',        // 'auto' | 'required' | 'none' | specific tool name
  stopWhen: stepCountIs(10)  // Current API (not maxSteps)
});

return result.toUIMessageStreamResponse();
```

**toolChoice options:**
- `'auto'` (default): Model decides when to call tools
- `'required'`: Must call at least one tool
- `'none'`: Disable all tools
- Specific tool name: Force that tool

### Tool Best Practices

- ✅ MCP tools retrieved dynamically at runtime
- ✅ Keep return types simple (`Record<string, any>`)
- ✅ Wrap MCP client calls in try-catch
- ✅ Use `toUIMessageStreamResponse()` for client compatibility
- ✅ Tool results auto-stream to client
- ✅ Optional: Wrap tools for logging (see pattern below)

**Logging wrapper:**
```typescript
Object.fromEntries(
  Object.entries(tools).map(([name, tool]) => [
    name,
    {
      ...tool,
      execute: async (args: any) => {
        console.log(`🔧 ${name}:`, args);
        const result = await tool.execute(args);
        console.log(`✅ Result:`, result);
        return result;
      }
    }
  ])
)
```

## useChat Rules

**Doc:** https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

```typescript
// ChatAssistant with custom API
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: "/api/your-agent" })
});
```

**CRITICAL - Message Sending:**
- ✅ `sendMessage({ text: "message" })` - ONLY this works
- ❌ `sendMessage("string")` - DOES NOT work, causes runtime errors

**CRITICAL - Message Structure:**
- ✅ Messages have `parts` array (NOT `content` field)
- ✅ Access via `message.parts` (typed: text, tool, source-url, etc.)
- ✅ Extract tool results: `message.parts?.filter(p => p.type === "tool")`

**API Route Pattern:**
```typescript
const { messages } = await req.json();
const modelMessages = convertToModelMessages(messages);
// ... streamText
return result.toUIMessageStreamResponse();
```

## UI Components

**shadcn/ui:** New York style, neutral theme, Lucide icons
- Add: `pnpm dlx shadcn@latest add [component]`
- Imports: `@/components`, `@/lib/utils`, `@/components/ui`

**AI Elements:** Pre-built AI UI components in `components/ai-elements/`
- Add all: `pnpm dlx ai-elements@latest`
- Key: Conversation, Message, PromptInput, Tool, Reasoning
- Tool states: input-streaming, input-available, output-available
- Reasoning docs: https://ai-sdk.dev/elements/components/reasoning

## Environment Variables

Required in `.env.local`:

```bash
OPENAI_API_KEY=sk-...                                                    # OpenAI GPT-5 access
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app  # MCP server base URL
```

**SSE Endpoint Construction:**
```typescript
const sseUrl = `${process.env.NEO4J_MCP_URL}/api/mcp/`
```

**Important:** Use regional URL (not short URL) to avoid "Invalid host header" errors.

**Security Note:** Cloud Run service is currently publicly accessible (development mode). For production, implement Cloud Run IAM authentication or use read-only Neo4j credentials. See `ARCHITECTURE.md` section 9.2 for options.

## Common Mistakes to Avoid

❌ Disconnecting MCP client during `streamText()` streaming
❌ Using `sendMessage("string")` instead of `sendMessage({ text: "..." })`
❌ Accessing `message.content` instead of `message.parts`
❌ Exposing write tools when read-only access intended
❌ Not pre-fetching schema for database agents
❌ Creating new MCP client instances (use singleton)
❌ Forgetting `pnpm tsc --noEmit` before commit
❌ Using deprecated `maxSteps` instead of `stopWhen: stepCountIs(n)`
❌ Hardcoding schema instead of fetching dynamically
❌ Using `--transport http` with `SSEClientTransport` (requires `--transport sse`)
❌ Using short Cloud Run URL instead of regional URL

## Quick Reference

**Docs:**
- AI SDK: https://ai-sdk.dev/docs
- MCP Tools: https://ai-sdk.dev/cookbook/node/mcp-tools
- useChat: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- streamText: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text

**Specs:**
- Functional: `FUNCTIONAL.md`
- Architecture: `ARCHITECTURE.md`
- MCP Details: `lib/mcp/CLAUDE.md` (if exists)

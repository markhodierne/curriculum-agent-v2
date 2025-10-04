# Architecture Specification - Oak Curriculum Agent

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Chat Interface (ChatAssistant Component)                 │  │
│  │  - useChat hook (AI SDK)                                  │  │
│  │  - Message display with tool visualization                │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────┘
                             │ POST /api/oak-curriculum-agent
                             │ { messages: UIMessage[] }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Route                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Connect to Neo4j MCP Client (SSE)                     │  │
│  │  2. Pre-fetch schema via get_neo4j_schema                 │  │
│  │  3. Build system prompt with schema                       │  │
│  │  4. Call streamText(GPT-5, messages, tools)               │  │
│  │  5. Return streaming response                             │  │
│  └────────────────────┬──────────────────────┬────────────────┘  │
└─────────────────────────┼──────────────────────┼───────────────────┘
                         │                      │
                         │ SSE Transport        │ Tool Execution
                         ▼                      ▼
┌──────────────────────────────────┐  ┌────────────────────────────┐
│   Neo4j MCP Server (Cloud Run)   │  │   OpenAI GPT-5             │
│  ┌────────────────────────────┐  │  │  - Text2Cypher generation  │
│  │ Tools:                     │  │  │  - Tool call decisions     │
│  │ - get_neo4j_schema         │  │  │  - Response formatting     │
│  │ - read_neo4j_cypher        │  │  └────────────────────────────┘
│  │ - write_neo4j_cypher       │  │
│  │   (not exposed)            │  │
│  └─────────────┬──────────────┘  │
└─────────────────┼──────────────────┘
                  │ Cypher Queries
                  ▼
┌─────────────────────────────────────┐
│   Neo4j AuraDB                      │
│  - UK Curriculum Knowledge Graph    │
│  - 13 node types                    │
│  - 8 relationship types             │
│  - 16,695 total nodes               │
└─────────────────────────────────────┘
```

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** Next.js 15 (App Router)
- **Build Tool:** Turbopack
- **UI Library:** shadcn/ui (New York style, neutral theme)
- **AI Components:** Vercel AI Elements
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React

### 2.2 Backend
- **Runtime:** Node.js (Next.js API Routes)
- **AI Orchestration:** AI SDK 5 (`streamText`)
- **LLM:** OpenAI GPT-5
- **MCP Protocol:** `@modelcontextprotocol/sdk`
- **Transport:** SSE (Server-Sent Events)

### 2.3 External Services
- **MCP Server:** Custom Neo4j MCP server (Google Cloud Run)
- **Database:** Neo4j AuraDB
- **AI Provider:** OpenAI

## 3. Project Structure

```
curriculum-agent/
├── app/
│   ├── page.tsx                          # Main chat interface
│   ├── layout.tsx                        # Root layout
│   └── api/
│       └── oak-curriculum-agent/
│           └── route.ts                  # API route for agent
├── components/
│   ├── chat/
│   │   └── chat-assistant.tsx            # Chat UI component
│   ├── agent/
│   │   └── oak-curriculum-prompt.ts      # System prompt builder
│   ├── ai-elements/                      # Vercel AI Elements
│   └── ui/                               # shadcn/ui components
├── lib/
│   ├── mcp/
│   │   └── client/
│   │       ├── neo4j-client.ts           # Neo4j MCP client
│   │       └── types.ts                  # MCP type definitions
│   └── utils.ts                          # Utility functions
├── .env.local                            # Environment variables
├── FUNCTIONAL.md                         # Functional specification
├── ARCHITECTURE.md                       # This file
└── CLAUDE.md                             # Development standards
```

## 4. Data Flow

### 4.1 Conversation Initialization

```typescript
1. User opens app
2. Frontend renders ChatAssistant component
3. User sends first message
4. Frontend POST to /api/oak-curriculum-agent
5. API route:
   a. getNeo4jMCPClient()
   b. await client.connect()
   c. const allTools = await client.getTools()
   d. const schemaResult = await allTools.get_neo4j_schema.execute({})
   e. const schema = JSON.parse(schemaResult.content[0].text)
   f. const systemPrompt = buildOakCurriculumPrompt(schema)
6. Schema now available in GPT-5 context for entire conversation
```

### 4.2 Query Execution Flow

```typescript
1. User: "Show me Year 7 Maths units"
2. GPT-5 receives message + system prompt (with schema)
3. GPT-5 generates tool call request:
   {
     tool: "read_neo4j_cypher",
     query: "MATCH (y:Year {yearTitle: 'Year 7'})-[:HAS_UNIT_OFFERING]->(uo)..."
   }
4. AI SDK runtime executes tool via MCP client
5. MCP server executes Cypher on Neo4j
6. Results returned to AI SDK runtime
7. AI SDK feeds results back to GPT-5 as tool result
8. GPT-5 formats natural language response
9. Response streamed to frontend
10. ChatAssistant displays message + tool call visualization
```

## 5. Component Architecture

### 5.1 Neo4j MCP Client (`lib/mcp/client/neo4j-client.ts`)

**Purpose:** Manages connection to Neo4j MCP server via SSE

**Class:** `Neo4jMCPClient`

**Properties:**
- `client: MCPClient | null` - MCP client instance
- `serverUrl: string` - Full MCP server SSE endpoint URL
- `isConnected: boolean` - Connection state

**Methods:**
- `connect(): Promise<void>` - Initialize SSE connection
- `disconnect(): Promise<void>` - Close connection
- `getTools(): Promise<Record<string, any>>` - Retrieve MCP tools
- `isClientConnected(): boolean` - Check connection status

**Singleton Pattern:**
```typescript
let neo4jClientInstance: Neo4jMCPClient | null = null;

export function getNeo4jMCPClient(serverUrl?: string): Neo4jMCPClient {
  if (!neo4jClientInstance) {
    neo4jClientInstance = new Neo4jMCPClient(
      serverUrl ? { serverUrl } : undefined
    );
  }
  return neo4jClientInstance;
}
```

**URL Construction:**
```typescript
serverUrl = `${process.env.NEO4J_MCP_URL}/sse`
// Example: https://neo4j-mcp-server-6lb6k47dpq-ew.a.run.app/sse
```

### 5.2 System Prompt Builder (`components/agent/oak-curriculum-prompt.ts`)

**Function:** `buildOakCurriculumPrompt(schema: any): string`

**Input:** JSON schema from `get_neo4j_schema` tool

**Output:** Complete system prompt string

**Structure:**
```typescript
export function buildOakCurriculumPrompt(schema: any): string {
  return `You are the Oak Curriculum Agent, an expert on the UK National Curriculum.

## Your Role
[Role description]

## Knowledge Graph Schema
${JSON.stringify(schema, null, 2)}

## Instructions
[Detailed instructions for Cypher generation]

## Rules
[Constraints and guidelines]
`;
}
```

**Key Directives:**
- Use ONLY the knowledge graph (no external knowledge)
- Translate questions to Cypher queries
- Reference schema for all queries
- Format responses for educators
- Never attempt write operations

### 5.3 API Route (`app/api/oak-curriculum-agent/route.ts`)

**Endpoint:** `POST /api/oak-curriculum-agent`

**Request Body:**
```typescript
{
  messages: UIMessage[]
}
```

**Response:** Streaming text/event-stream with UI message parts

**Implementation Pattern:**
```typescript
export async function POST(req: Request) {
  // 1. Parse messages
  const { messages } = await req.json();

  // 2. Connect to MCP
  const mcpClient = getNeo4jMCPClient();
  await mcpClient.connect();
  const allTools = await mcpClient.getTools();

  // 3. Pre-fetch schema
  const schemaResult = await allTools.get_neo4j_schema.execute({});
  const schema = JSON.parse(schemaResult.content[0].text);

  // 4. Build system prompt
  const systemPrompt = buildOakCurriculumPrompt(schema);

  // 5. Convert UI messages to model messages
  const modelMessages = convertToModelMessages(messages);

  // 6. Stream with GPT-5
  const result = streamText({
    model: openai("gpt-5"),
    messages: [
      { role: "system", content: systemPrompt },
      ...modelMessages
    ],
    tools: {
      read_neo4j_cypher: allTools.read_neo4j_cypher
    },
    stopWhen: stepCountIs(10)
  });

  // 7. Return streaming response
  return result.toUIMessageStreamResponse();
}
```

**Error Handling:**
```typescript
try {
  // ... implementation
} catch (error) {
  console.error("Oak Curriculum Agent error:", error);
  return new Response(
    JSON.stringify({ error: "Failed to process request" }),
    { status: 500 }
  );
}
```

### 5.4 Chat Interface (`app/page.tsx`)

**Component Usage:**
```typescript
import { ChatAssistant } from "@/components/chat/chat-assistant";

export default function HomePage() {
  return (
    <main>
      <h1>Oak Curriculum Agent</h1>
      <ChatAssistant api="/api/oak-curriculum-agent" />
    </main>
  );
}
```

## 6. MCP Integration Details

### 6.1 Transport Configuration

**Protocol:** SSE (Server-Sent Events)

**Transport Setup:**
```typescript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL(serverUrl));
const client = await experimental_createMCPClient({ transport });
```

**Connection Lifecycle:**
- **Connect:** Once per API route handler
- **Maintain:** Throughout request processing
- **Disconnect:** DO NOT disconnect during streaming (causes errors)
- **Reuse:** Singleton pattern reuses connection across requests

### 6.2 Tool Configuration

**Available from MCP Server:**
```typescript
{
  get_neo4j_schema: {
    description: "List all nodes, attributes, relationships",
    inputSchema: { properties: {}, type: "object" }
  },
  read_neo4j_cypher: {
    description: "Execute read Cypher query",
    inputSchema: {
      properties: {
        query: { type: "string" },
        params: { type: "object", default: {} }
      }
    }
  },
  write_neo4j_cypher: {
    // Not exposed to GPT-5
  }
}
```

**Exposed to GPT-5:**
```typescript
tools: {
  read_neo4j_cypher: allTools.read_neo4j_cypher
  // Only expose read tool
}
```

### 6.3 Schema Retrieval

**Execution:**
```typescript
const schemaResult = await allTools.get_neo4j_schema.execute({});
```

**Result Format:**
```typescript
{
  content: [{
    type: "text",
    text: "{\"Keystage\": {\"type\": \"node\", \"count\": 4, ...}, ...}"
  }],
  isError: false
}
```

**Parsing:**
```typescript
const schema = JSON.parse(schemaResult.content[0].text);
```

## 7. AI SDK Configuration

### 7.1 Model Configuration

**Provider:** OpenAI
**Model:** GPT-5 (`gpt-5`)
**Capabilities:** Reasoning, tool calling, streaming

### 7.2 Tool Execution

**Strategy:** `toolChoice: 'auto'` (default)
**Max Steps:** `stopWhen: stepCountIs(10)`
**Multi-turn:** Enabled (GPT-5 can make multiple tool calls)

### 7.3 Message Handling

**Input Format:** UIMessage[] from useChat
**Conversion:** `convertToModelMessages(messages)`
**System Message:** Injected with schema
**Output Format:** `toUIMessageStreamResponse()`

## 8. Environment Configuration

### 8.1 Required Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Neo4j MCP Server (SSE endpoint)
NEO4J_MCP_URL=https://neo4j-mcp-server-6lb6k47dpq-ew.a.run.app
```

### 8.2 URL Construction

**Base URL:** `process.env.NEO4J_MCP_URL`
**SSE Endpoint:** `${NEO4J_MCP_URL}/sse`
**Example:** `https://neo4j-mcp-server-6lb6k47dpq-ew.a.run.app/sse`

## 9. Security Considerations

### 9.1 Current State (Development Mode)

⚠️ **WARNING:** Cloud Run service is publicly accessible

**Authentication:** None (Cloud Run allows `allUsers`)
**Database Security:** Neo4j credentials stored as Cloud Run environment variables
**Risk:** Anyone with MCP server URL can execute Cypher queries
**Mitigation:** Only expose `read_neo4j_cypher` tool (prevents write operations at AI layer)

### 9.2 Production Security Recommendations

**Option 1: Cloud Run IAM Authentication (Recommended)**
- Remove public access: `gcloud run services remove-iam-policy-binding ...`
- Use service account with `roles/run.invoker` permission
- Next.js authenticates via service account key JSON
- Requires admin permissions: `roles/iam.serviceAccountCreator`

**Option 2: Read-Only Neo4j User**
- Create read-only Neo4j database user
- Update Cloud Run environment variables with read-only credentials
- Prevents write operations at database level
- Still requires securing Cloud Run endpoint

**Option 3: API Gateway with API Keys**
- Deploy Cloud Endpoints or API Gateway in front of Cloud Run
- Enforce API key validation at gateway level
- More complex setup, additional infrastructure

### 9.3 Access Control
- ✅ Read-only AI access (only `read_neo4j_cypher` exposed to GPT-5)
- ✅ No write tools exposed (`write_neo4j_cypher`, `get_neo4j_schema` excluded)
- ⚠️ MCP server has write access to Neo4j (not used by AI)

### 9.4 Error Handling
- ✅ Try-catch blocks in API routes
- ✅ Graceful degradation on MCP connection failures
- ✅ User-friendly error messages
- ✅ Server-side logging for debugging

## 10. Performance Considerations

### 10.1 Connection Reuse
- Singleton MCP client reduces connection overhead
- Persistent SSE connection across requests
- Schema cached in conversation context

### 10.2 Streaming
- `streamText()` provides incremental responses
- Tool calls visible before final response
- Improved perceived performance

### 10.3 Query Optimization
- GPT-5 responsible for efficient Cypher generation
- Schema awareness prevents unnecessary queries
- 30-second timeout on Neo4j queries (MCP server default)

## 11. Development Workflow

See `CLAUDE.md` for detailed development commands and standards.

**Quick Reference:**
```bash
pnpm dev           # Start development server
pnpm tsc --noEmit  # Check TypeScript errors
pnpm build         # Production build
```

## 12. Cross-References

- **Functional Requirements:** See `FUNCTIONAL.md`
- **Development Standards:** See `CLAUDE.md`
- **MCP Integration:** See `lib/mcp/CLAUDE.md` (if exists)
- **AI SDK Docs:** https://ai-sdk.dev/docs
- **MCP Tools Cookbook:** https://ai-sdk.dev/cookbook/node/mcp-tools

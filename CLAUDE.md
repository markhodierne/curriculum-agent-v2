# CLAUDE.md

**Development Standards - Phase 1 MVP**

See `FUNCTIONAL.md` for requirements, `ARCHITECTURE.md` for technical architecture.

---

## Commands

```bash
pnpm dev                          # Start development server (Next.js + Turbopack)
pnpm build                        # Production build
pnpm start                        # Production server
pnpm tsc --noEmit                 # Type check (REQUIRED before commits)
pnpm reset-learning -- --dry-run  # Preview learning data reset (safe)
pnpm reset-learning -- --confirm  # Reset all learning data (destructive)
```

**CRITICAL**: Always run `pnpm tsc --noEmit` after writing/modifying code before considering task complete.

**Package Manager**: Use **pnpm only**. Never npm or yarn.

**Development Utility**: Use `pnpm reset-learning` to clear all learned memories, evaluations, and interactions while preserving the curriculum graph. See `scripts/README.md` for details.

---

## Stack (Phase 1)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | TypeScript | 5.x | Strict mode enabled |
| Framework | Next.js | 15.5+ | App Router, Turbopack |
| AI | Vercel AI SDK | 5.0+ | **Always check** https://ai-sdk.dev/docs |
| LLM (Query/Reflect) | OpenAI GPT-4o | - | Fast, high quality |
| LLM (Learning) | gpt-4o-mini | - | Cost-effective |
| Embeddings | text-embedding-3-small | - | 1536 dims |
| Graph DB | Neo4j AuraDB | - | Via write-enabled MCP |
| Relational DB | Supabase Postgres | - | Analytics + logs |
| Async Jobs | Inngest Cloud | - | Event-driven |
| UI | Tailwind v4 | - | Utility-first |
| Components | shadcn/ui | - | New York, neutral |
| Charts | Tremor | - | Dashboard analytics |
| Icons | Lucide React | - | - |

---

## Project Structure

```
app/
  page.tsx                         # Home (model selector)
  chat/page.tsx                    # Chat interface
  dashboard/page.tsx               # Learning metrics
  api/
    chat/route.ts                  # Query Agent endpoint
    inngest/route.ts               # Inngest webhook
components/
  home/                            # Home page components
  chat/                            # Chat UI components
  dashboard/                       # Dashboard components
  ui/                              # shadcn/ui
  ai-elements/                     # AI SDK elements
lib/
  agents/
    query-agent.ts                 # Query Agent logic
    prompts/                       # System prompt builders
  memory/
    retrieval.ts                   # Vector similarity search
    embeddings.ts                  # OpenAI embedding calls
  mcp/
    client/neo4j-client.ts         # MCP client (singleton)
    tools/cypher-tool.ts           # Cypher execution wrapper
  database/
    supabase.ts                    # Supabase client (singleton)
    schema.ts                      # Table definitions
  inngest/
    client.ts                      # Inngest client (singleton)
    functions/
      reflection.ts                # Reflection Agent
      learning.ts                  # Learning Agent
    events.ts                      # Event type definitions
  types/                           # TypeScript interfaces
```

---

## AI SDK v5 Patterns

**CRITICAL**: Always reference https://ai-sdk.dev/docs/introduction for latest patterns.

### Query Agent (User-Facing)

```typescript
// app/api/chat/route.ts
import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  const { messages, model, temperature } = await req.json();

  // 1. Retrieve similar memories (few-shot learning)
  const memories = await retrieveSimilarMemories(messages[messages.length - 1].content);

  // 2. Build system prompt with schema + memories
  const systemPrompt = buildQueryPrompt(schema, memories);

  // 3. Get MCP tools - use directly, AI SDK v5 handles schema automatically
  const mcpClient = getNeo4jMCPClient();
  await mcpClient.connect();
  const allTools = await mcpClient.getTools();

  // Wrap for logging (optional)
  const cypherTool = {
    read_neo4j_cypher: {
      ...allTools.read_neo4j_cypher,
      execute: async (args: any) => {
        console.log('🔧 Tool called:', args.query?.substring(0, 200));
        return await allTools.read_neo4j_cypher.execute(args);
      },
    },
  };

  // 4. Create interaction record first to get UUID
  const interactionId = await createInteraction({ /* ... */ });

  // 5. Stream response
  const result = await streamText({
    model: openai(model),             // 'gpt-4o' | 'gpt-4o-mini' | 'gpt-5'
    system: systemPrompt,
    messages,
    tools: cypherTool,                // MCP tools work directly!
    temperature,
    stopWhen: stepCountIs(10),        // CRITICAL: Use stopWhen, not maxSteps
    // Note: maxTokens not supported in AI SDK v5.0.76

    // Track tool calls with onStepFinish
    onStepFinish: ({ toolCalls, toolResults }) => {
      // Extract metadata for event emission
    },
  });

  // 6. Emit event after completion (non-blocking)
  (async () => {
    const fullResponse = await result.text;
    await inngest.send({
      name: 'interaction.complete',
      data: { /* ... */ }
    });
  })();

  // 7. Return with messageMetadata for passing custom data to frontend
  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({
      interactionId: interactionId,  // Accessible via message.metadata on frontend
    }),
  });
}
```

**Key Points**:
- **MCP Tools**: Use tools directly without schema conversion - AI SDK v5 handles MCP format automatically
- **Multi-Step Execution**: Use `stopWhen: stepCountIs(N)` (NOT `maxSteps`) - allows model to generate final text response after tool calls
- **Tool Choice**: Use `toolChoice: 'auto'` (NOT `'required'`) - prevents infinite loops by allowing agent to decide when to generate text vs use tools
- **Tool Call Properties**: AI SDK v5 uses `toolCall.input` (NOT `toolCall.args`) - always check TypeScript definitions when in doubt
- **Message Metadata**: Use `messageMetadata` callback in `toUIMessageStreamResponse()` to pass custom data (e.g., interaction IDs) to frontend
- **Tool Tracking**: Use `onStepFinish()` to track tool calls and results for analytics
- **Event Emission**: Use async IIFE for non-blocking event emission (doesn't block stream response)
- **Return Method**: Use `toUIMessageStreamResponse()` for compatibility with useChat hook
- `maxTokens` parameter removed (not in AI SDK v5.0.76)

### Reflection Agent (Async)

```typescript
// lib/inngest/functions/reflection.ts
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export const reflectionFunction = inngest.createFunction(
  { id: 'reflection-agent', retries: 3 },
  { event: 'interaction.complete' },
  async ({ event, step }) => {
    const evaluation = await step.run('evaluate', async () => {
      return await generateObject({
        model: openai('gpt-4o'),
        schema: EvaluationSchema,      // Zod schema for structured output
        prompt: buildEvaluationPrompt(event.data),
      });
    });

    // Save to Supabase, emit next event
    // ...
  }
);
```

**Key Points**:
- Use `generateObject()` for structured outputs (not `streamText()`)
- Zod schemas for type-safe responses
- Inngest `step.run()` for granular retries
- Each step retries independently

### Learning Agent (Async)

```typescript
// lib/inngest/functions/learning.ts
export const learningFunction = inngest.createFunction(
  { id: 'learning-agent', retries: 3 },
  { event: 'reflection.complete' },
  async ({ event, step }) => {
    // No LLM call needed - just data operations
    const memoryId = await step.run('create-memory', async () => {
      return await createMemoryNodeInNeo4j(event.data);
    });

    await step.run('link-evidence', async () => {
      return await linkEvidenceNodes(memoryId, event.data.evidenceNodeIds);
    });

    // Optional: Extract patterns
    // ...
  }
);
```

**Key Points**:
- No AI SDK call needed (data operations only)
- Use MCP client to write to Neo4j
- Granular steps for partial success

---

## MCP Integration

### Singleton Pattern (Required)

```typescript
// lib/mcp/client/neo4j-client.ts
let clientInstance: Neo4jMCPClient | null = null;

export function getNeo4jMCPClient(): Neo4jMCPClient {
  if (!clientInstance) {
    clientInstance = new Neo4jMCPClient();
  }
  return clientInstance;
}
```

### Connection Rules

- ✅ Use singleton pattern for connection reuse
- ✅ HTTP transport: `StreamableHTTPClientTransport`
- ✅ Connect once per API request
- ❌ **NEVER** disconnect during `streamText()` - causes errors
- ✅ Use `Record<string, any>` for tool types (avoid TS deep instantiation)

### Schema Pre-fetching

```typescript
// API route pattern
const mcpClient = getNeo4jMCPClient();
await mcpClient.connect();
const allTools = await mcpClient.getTools();

// 1. Pre-fetch schema (don't expose as tool)
const schemaResult = await allTools.get_neo4j_schema.execute({});
const schema = JSON.parse(schemaResult.content[0].text);

// 2. Inject into system prompt
const systemPrompt = buildPrompt(schema);

// 3. Expose only needed tools
const result = streamText({
  model: openai("gpt-4o"),
  system: systemPrompt,
  messages,
  tools: {
    read_neo4j_cypher: allTools.read_neo4j_cypher,  // Read-only for Query Agent
    // Write tools for Learning Agent only
  },
});
```

**Rules**:
- ✅ Pre-fetch schema ONLY once per conversation (check `messages.length === 1`)
- ✅ Schema persists in system prompt across all messages
- ✅ Selective tool exposure (Query Agent = read-only)
- ✅ Fresh schema per conversation
- ❌ **NEVER** fetch schema on every message (wastes ~200ms per message)

---

## Memory Retrieval (Few-Shot Learning)

**Core Learning Mechanism**: Retrieve similar past interactions before each query.

```typescript
// lib/memory/retrieval.ts
export async function retrieveSimilarMemories(
  query: string,
  limit: number = 3
): Promise<Memory[]> {
  // 1. Generate embedding
  const embedding = await generateEmbedding(query);

  // 2. Vector search in Neo4j
  const cypher = `
    CALL db.index.vector.queryNodes('memory_embeddings', $limit, $embedding)
    YIELD node, score
    WHERE node.overall_score > 0.75
    RETURN node, score
    ORDER BY score DESC
  `;

  const result = await mcpClient.executeCypher(cypher, { embedding, limit });
  return parseMemories(result);
}
```

**Integration**:
```typescript
// In Query Agent
const memories = await retrieveSimilarMemories(userQuery);
const systemPrompt = buildQueryPrompt(schema, memories);  // Inject as few-shot

// If agent answers from memory without querying, inherit Cypher queries for proper grounding
if (cypherQueries.length === 0 && memories.length > 0) {
  cypherQueries.push(...memories[0].cypherUsed);
}
```

**Key Points**:
- Threshold: 0.25 for testing/bootstrapping, 0.75 for production
- Embed values directly in query string (MCP doesn't support params well)
- Memory inheritance: When answering from retrieved memory, inherit source Cypher queries for grounding tracking

---

## useChat Hook (Frontend)

**Doc**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

```typescript
// components/chat/chat-interface.tsx
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: {
      model: selectedModel,      // From home page config
      temperature: 0.3,
      maxTokens: 2000,
    },
  }),
});

// Access message metadata sent from backend
const interactionId = (message.metadata as any)?.interactionId || message.id;
```

**CRITICAL**:
- ✅ `sendMessage({ text: "message" })` - ONLY this works
- ❌ `sendMessage("string")` - DOES NOT work
- ✅ Access `message.parts` (NOT `message.content`)
- ✅ Tool results: `message.parts?.filter(p => p.type === "tool")`
- ✅ Custom metadata: Access via `message.metadata` (set by backend's `messageMetadata` callback)

---

## TypeScript Standards

### Strict Mode (Required)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `query-agent.ts` |
| Components | PascalCase | `ChatInterface.tsx` |
| Functions | camelCase | `retrieveMemories()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase | `AgentContext` |
| Types | PascalCase | `Memory` |

### Import Order

```typescript
// 1. External libraries
import { streamText } from 'ai';
import { z } from 'zod';

// 2. Internal (absolute imports with @/)
import { getMCPClient } from '@/lib/mcp';
import { retrieveMemories } from '@/lib/memory/retrieval';

// 3. Types
import type { Memory, AgentContext } from '@/lib/types';

// 4. Relative imports (if needed)
import { formatPrompt } from './prompts';
```

### Type Safety Rules

- ✅ Explicit return types for all exported functions
- ✅ Zod schemas for external data (API requests, MCP responses)
- ✅ Use `unknown` instead of `any`, then type guard
- ❌ No `any` types (exception: MCP tool return types)
- ✅ Async functions always return `Promise<T>`

### Function Documentation

```typescript
/**
 * Retrieves similar memories from Neo4j using vector search
 * @param query - User's query text
 * @param limit - Maximum memories to retrieve (default: 3)
 * @returns Array of high-quality memories (score > 0.75)
 */
export async function retrieveSimilarMemories(
  query: string,
  limit: number = 3
): Promise<Memory[]> {
  // Implementation
}
```

---

## Error Handling

### Query Agent (User-Facing)

**Principle**: Never show raw errors to users

```typescript
try {
  const result = streamText({ /* ... */ });
  return result.toDataStreamResponse();
} catch (error) {
  console.error('Query Agent failed:', error);
  await logError('query-agent', error);

  return new Response(
    JSON.stringify({
      error: 'I apologize, I\'m having trouble right now. Please try again.',
    }),
    { status: 200 }  // Don't expose 500 errors
  );
}
```

### Async Agents (Background)

**Principle**: Don't block pipeline, use fallbacks

```typescript
export const reflectionFunction = inngest.createFunction(
  {
    id: 'reflection-agent',
    retries: 3,
    onFailure: async ({ error, event }) => {
      await logError('reflection-agent', error);
      // Continue pipeline with default scores
      await inngest.send({
        name: 'reflection.complete',
        data: { ...event.data, evaluation: getDefaultEvaluation() },
      });
    },
  },
  { event: 'interaction.complete' },
  async ({ event, step }) => {
    // ... with try-catch fallbacks
  }
);
```

### MCP Tool Errors

```typescript
// lib/mcp/tools/cypher-tool.ts
export const cypherTool = {
  execute: async (args: { query: string }) => {
    try {
      const result = await mcpClient.executeCypher(args.query);
      return { success: true, data: result };
    } catch (error) {
      console.error('Cypher failed:', error);
      return {
        success: false,
        error: 'Query failed. Try simplifying or checking syntax.',
        details: error.message,
      };
    }
  },
};
```

---

## Environment Variables

**Required in `.env.local`** (not committed):

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Neo4j MCP Server (write-enabled)
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Development
NODE_ENV=development
```

**Committed**: `.env.example` with empty values.

**Usage**:
```typescript
// Server-side only
const mcpUrl = process.env.NEO4J_MCP_URL;

// Client-side safe (NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

---

## Git Workflow

### Commit Standards

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `chore`: Dependencies, config

**Examples**:
```bash
feat(query-agent): add memory-augmented prompting
fix(cypher-tool): handle timeout errors gracefully
refactor(learning-agent): extract pattern logic
docs(readme): add Supabase setup instructions
chore(deps): add Inngest and Tremor
```

### Branch Strategy

**Trunk-based** (recommended for 4-6 week MVP):
- Main branch: `main`
- Feature branches: short-lived (1-2 days max)
- Merge directly after testing
- Deploy from `main`

**Branch naming**:
```bash
feature/memory-retrieval
fix/cypher-timeout
refactor/agent-prompts
```

### Pre-Commit Checklist

```bash
# 1. Type check (REQUIRED)
pnpm tsc --noEmit

# 2. Review changes
git diff

# 3. Commit
git add .
git commit -m "feat(scope): description"
```

---

## UI Standards

### shadcn/ui

- **Style**: New York
- **Theme**: Neutral
- **Add component**: `pnpm dlx shadcn@latest add [component]`
- **Imports**: `@/components/ui/[component]`

### Tremor (Dashboard)

```typescript
import { LineChart, Card } from '@tremor/react';

<Card>
  <LineChart
    data={learningCurveData}
    index="interaction"
    categories={["score"]}
    colors={["blue"]}
  />
</Card>
```

### Responsive Design

- Desktop-first (1280px+)
- Tablet support (768px+)
- Mobile optional for Phase 1

---

## Testing Strategy (Phase 1)

**Manual Testing + Type Safety**:
- ✅ TypeScript strict mode (compile-time checks)
- ✅ Manual testing during development
- ✅ 20 curated test queries (see `docs/test-queries.md`)
- ❌ No unit tests initially (Phase 2+)

**Pre-Launch Validation**:
```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Run all 20 test queries
# 3. Verify ≥85% success rate
# 4. Check learning improvement (first 10 vs last 10)
# 5. Validate dashboard metrics
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Agent p50 | ≤2s | User-facing latency |
| Query Agent p95 | ≤4s | User-facing latency |
| Reflection completion | ≤30s | Background processing |
| Learning completion | ≤30s | Background processing |
| Cypher success rate | ≥85% | Query execution |
| Dashboard load | ≤3s | Page load time |

---

## Common Pitfalls

### AI SDK v5 Patterns
❌ Using `toolCall.args` instead of `toolCall.input` (AI SDK v5 changed property name)
❌ Using `toolChoice: 'required'` (causes infinite loops - agent can't generate final text)
❌ Using `maxSteps` instead of `stopWhen: stepCountIs(N)` (prevents final text response)
❌ Manually converting MCP schema to OpenAI format (AI SDK v5 handles automatically)
❌ Using deprecated AI SDK patterns (always check docs first)

### MCP Integration
❌ Disconnecting MCP client during `streamText()` streaming
❌ Creating new MCP client instances (breaks singleton)
❌ Fetching schema on every message (only fetch when `messages.length === 1`)
❌ Exposing write tools to Query Agent (security risk)
❌ Not handling MCP tool errors gracefully

### Neo4j & Cypher
❌ Using `yearTitle: 'Year 3'` instead of `yearSlug: 'year-3'` for Year node queries
❌ Treating integer properties as strings (use `toInteger()` for unitId, lessonId, objectiveId)
❌ Parsing write operation results as query results (write returns `{relationships_created: N}` not `[{linkedCount: N}]`)
❌ Not embedding values directly in Cypher (MCP doesn't support params well)

### Frontend & UX
❌ Using `sendMessage("string")` instead of `sendMessage({ text: "..." })`
❌ Accessing `message.content` instead of `message.parts`
❌ Not using `messageMetadata` callback for passing custom data to frontend
❌ Using `toTextStreamResponse()` when you need `toUIMessageStreamResponse()` for useChat

### Development Process
❌ Forgetting `pnpm tsc --noEmit` before commit
❌ Guessing API structures instead of checking documentation
❌ Blocking user interaction with async failures

---

## Quick Reference

### Docs (Always Check Latest)
- **AI SDK**: https://ai-sdk.dev/docs/introduction
- **streamText**: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- **generateObject**: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object
- **useChat**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- **MCP Tools**: https://ai-sdk.dev/cookbook/node/mcp-tools
- **Inngest**: https://www.inngest.com/docs
- **Tremor**: https://tremor.so/docs

### Specs
- **Functional**: `FUNCTIONAL.md`
- **Architecture**: `ARCHITECTURE.md`
- **Full Vision**: `BRIEF.md`

### Key Files
- Query Agent: `lib/agents/query-agent.ts`
- Reflection: `lib/inngest/functions/reflection.ts`
- Learning: `lib/inngest/functions/learning.ts`
- Memory Retrieval: `lib/memory/retrieval.ts`
- MCP Client: `lib/mcp/client/neo4j-client.ts`
- Supabase: `lib/database/supabase.ts`

---

**Document Status**: Task 33 Pre-Demo Validation Complete
**Last Updated**: 2025-10-20
**Phase**: 1 (MVP - 4-6 weeks)

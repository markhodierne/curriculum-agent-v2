# Implementation History - Oak Curriculum Agent

## Session 1: Neo4j MCP Client Foundation

### Task 1: Neo4j MCP Client ✅

**File:** `lib/mcp/client/neo4j-client.ts`

**Implementation:**
- `Neo4jMCPClient` class with SSE transport for Neo4j MCP server
- Methods: `connect()`, `disconnect()`, `getTools()`, `isClientConnected()`
- Singleton pattern: `getNeo4jMCPClient(apiKey?)`
- Test reset: `resetNeo4jMCPClient()`
- URL construction: `${NEO4J_MCP_URL}/${apiKey}/api/mcp/`
- Returns `Record<string, any>` for tool types (AI SDK compatibility)

**Pattern Used:**
- Followed `firecrawl-client.ts` pattern exactly
- Console logging with emoji prefixes (🚀, ✅, 💥, 🔧, 🔗, 🔌)
- Environment variables: `NEO4J_MCP_URL`, `NEO4J_MCP_API_KEY`

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Task 2: MCP Index Exports ✅

**File:** `lib/mcp/index.ts`

**Implementation:**
- Exported `Neo4jMCPClient`, `getNeo4jMCPClient`, `resetNeo4jMCPClient`
- Followed Firecrawl export pattern
- Enables `import { getNeo4jMCPClient } from "@/lib/mcp"`

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Task 3: Oak Curriculum System Prompt Builder ✅

**File:** `components/agent/oak-curriculum-prompt.ts`

**Implementation:**
- `buildOakCurriculumPrompt(schema: any): string` function
- Dynamic schema injection via `JSON.stringify(schema, null, 2)`
- Comprehensive Text2Cypher instructions with common query patterns
- Read-only constraints (forbids CREATE/SET/DELETE/MERGE)
- Educator-focused response formatting guidelines
- Curriculum graph structure overview (Phase → Lesson hierarchy)
- Error handling guidance and example interactions

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Task 4: Oak Curriculum Agent API Route ✅

**File:** `app/api/oak-curriculum-agent/route.ts`

**Implementation:**
- Schema pre-fetching: `get_neo4j_schema` executed before streaming
- Dynamic system prompt with injected schema via `buildOakCurriculumPrompt(schema)`
- Selective tool exposure: Only `read_neo4j_cypher` exposed to GPT-5
- Tool logging wrapper for debugging (logs input only, not full output)
- Provider options: `reasoning_effort: "low"`, `textVerbosity: "low"`, `reasoningSummary: "detailed"`
- Error handling with try-catch, returns 500 on failure

**Pattern Used:**
- Follows `agent-with-mcp-tools/route.ts` pattern with schema pre-fetch step
- No premature MCP client disconnection during streaming
- Uses `stopWhen: stepCountIs(10)` (not deprecated `maxSteps`)

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Task 5: Main Page Interface ✅

**File:** `app/page.tsx`

**Implementation:**
- Updated `<h1>` text: "MCP Tools Agent" → "Oak Curriculum Agent"
- Updated `<ChatAssistant>` API prop: `/api/agent-with-mcp-tools` → `/api/oak-curriculum-agent`
- Preserved all existing styling and layout

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Task 6: Configure Environment Variables ✅

**File:** `.env.local`

**Implementation:**
- Three environment variables configured:
  - `OPENAI_API_KEY` (existing, preserved)
  - `NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app`
  - `NEO4J_MCP_API_KEY=your_secret_key_here` (placeholder)
- Verified `.env.local` excluded from git via `.gitignore` (lines 34, 42)
- Variables accessible via `process.env` in API routes

### Key Decisions

1. **URL Construction:** API key in URL path (not headers) per project pattern
2. **Singleton Reuse:** Connection persists across requests for performance
3. **No Premature Disconnect:** Client stays connected during streaming (prevents errors)
4. **Schema Pre-fetching:** Fetched once per conversation, injected into system prompt (not exposed as GPT-5 tool)

---

## Session 2: Security Investigation & Deployment Configuration

### Issue: MCP Server Connection Failure (404 Error)

**Root Causes Identified:**
1. Incorrect URL in `.env.local` (placeholder from docs, not actual Cloud Run URL)
2. Incorrect endpoint path (using `/api/mcp/` instead of `/sse` for SSE transport)
3. API key pattern not supported by official Neo4j MCP server

**Discoveries:**
- Actual Cloud Run URL: `https://neo4j-mcp-server-6lb6k47dpq-ew.a.run.app`
- Neo4j MCP server uses `/sse` endpoint for SSE transport
- Server deployed without API key authentication (public access)
- Service secured only by Neo4j database credentials stored in Cloud Run environment

### Security Analysis

**Current State:**
- Cloud Run service: Publicly accessible (`allUsers` has `roles/run.invoker`)
- Authentication: None at Cloud Run level
- Database security: Neo4j credentials stored as Cloud Run environment variables
- Risk: Anyone with URL can execute read/write Cypher queries

**IAM Authentication Attempt:**
- Removed public access from Cloud Run
- Granted `run-neo4j@oak-ai-playground.iam.gserviceaccount.com` invoker permission
- User lacks `iam.serviceAccountKeys.create` permission
- Cannot create service account key for Next.js authentication

**Decision:** Restore public access for development; add IAM authentication later

### Task: Fix MCP Client Configuration ✅

**Files Modified:**
- `.env.local`: Updated `NEO4J_MCP_URL` to actual Cloud Run URL, removed `NEO4J_MCP_API_KEY`
- `lib/mcp/client/neo4j-client.ts`: Removed API key from URL construction, changed endpoint to `/sse`
- `lib/mcp/client/types.ts`: Split `MCPClientConfig` (Firecrawl) and `Neo4jMCPClientConfig` (no API key)

**Changes:**
```typescript
// Before
serverUrl = `${baseUrl}/${this.apiKey}/api/mcp/`

// After
serverUrl = `${baseUrl}/sse`
```

**Type Check:** ✅ Passed `pnpm tsc --noEmit`

### Key Decisions

1. **Development Mode:** Public access accepted for MVP phase
2. **Production Security:** IAM authentication requires admin permissions (deferred)
3. **Endpoint Correction:** `/sse` is correct for SSE transport, not `/api/mcp/`
4. **No API Key:** Official Neo4j MCP server doesn't support API key in URL path

### Next Steps

- **Security:** Add Cloud Run IAM authentication (requires admin to create service account key)
- **Alternative:** Deploy with read-only Neo4j user credentials
- Tasks 7-9: Type checking, testing, validation

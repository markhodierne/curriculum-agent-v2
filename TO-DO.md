# Oak Curriculum Agent - Implementation Tasks

## Overview

This task list builds the Oak Curriculum Agent, an AI-powered chat interface for exploring the UK National Curriculum knowledge graph through natural language queries.

**Project specs:**
- Functional requirements: `FUNCTIONAL.md`
- Technical architecture: `ARCHITECTURE.md`
- Development standards: `CLAUDE.md`

---

## Task 1: Create Neo4j MCP Client ✅

**Description:** Implement `Neo4jMCPClient` class for connecting to Neo4j MCP server via SSE transport.

**File:** `lib/mcp/client/neo4j-client.ts`

**Dependencies:** None (can start immediately)

**Deliverables:**
- `Neo4jMCPClient` class with:
  - `connect()`, `disconnect()`, `getTools()`, `isClientConnected()` methods
  - SSE transport configuration
  - URL construction: `${NEO4J_MCP_URL}/${apiKey}/api/mcp/`
  - Error handling with logging
- Singleton pattern: `getNeo4jMCPClient(apiKey?)` function
- Reset function for testing: `resetNeo4jMCPClient()`

**Definition of Done:**
- ✅ File created with full class implementation
- ✅ Singleton pattern implemented
- ✅ Environment variable support (`NEO4J_MCP_URL`, `NEO4J_MCP_API_KEY`)
- ✅ Error handling and console logging
- ✅ Follows same pattern as `firecrawl-client.ts`
- ✅ Returns `Record<string, any>` for tool types
- ✅ No TypeScript errors (`pnpm tsc --noEmit`)

---

## Task 2: Update MCP Index Exports ✅

**Description:** Export Neo4j MCP client from main MCP module.

**File:** `lib/mcp/index.ts`

**Dependencies:** Task 1

**Deliverables:**
- Export `getNeo4jMCPClient` and `Neo4jMCPClient` from `neo4j-client.ts`

**Definition of Done:**
- ✅ Neo4j client exports added to `lib/mcp/index.ts`
- ✅ Imports work from `@/lib/mcp`
- ✅ No TypeScript errors

---

## Task 3: Create Oak Curriculum System Prompt Builder ✅

**Description:** Implement function that builds GPT-5 system prompt with Neo4j schema.

**File:** `components/agent/oak-curriculum-prompt.ts`

**Dependencies:** None (can be done in parallel with Task 1-2)

**Deliverables:**
- `buildOakCurriculumPrompt(schema: any): string` function
- System prompt includes:
  - Role and identity ("Oak Curriculum Agent")
  - Complete Neo4j schema (stringified)
  - Text2Cypher instructions
  - Read-only constraints
  - Educator-focused response formatting guidelines
  - Curriculum graph structure overview
  - Query best practices

**Definition of Done:**
- ✅ File created with prompt builder function
- ✅ Schema injected dynamically
- ✅ Clear instructions for Cypher generation
- ✅ Read-only constraints emphasized
- ✅ Educator-friendly tone specified
- ✅ No TypeScript errors

---

## Task 4: Create Oak Curriculum Agent API Route ✅

**Description:** Implement `/api/oak-curriculum-agent` endpoint with schema pre-fetching.

**File:** `app/api/oak-curriculum-agent/route.ts`

**Dependencies:** Tasks 1, 2, 3

**Deliverables:**
- `POST` handler that:
  1. Parses `messages` from request
  2. Connects to Neo4j MCP client
  3. Retrieves all tools via `getTools()`
  4. Pre-fetches schema using `get_neo4j_schema` tool
  5. Parses schema from result (`JSON.parse(schemaResult.content[0].text)`)
  6. Builds system prompt with schema
  7. Converts UI messages to model messages
  8. Calls `streamText()` with:
     - Model: `openai("gpt-5")`
     - System message with schema
     - Only `read_neo4j_cypher` tool exposed (NOT `get_neo4j_schema` or `write_neo4j_cypher`)
     - `stopWhen: stepCountIs(10)`
  9. Returns `result.toUIMessageStreamResponse()`
- Error handling with try-catch
- Console logging for debugging
- Tool call logging wrapper

**Definition of Done:**
- ✅ API route file created
- ✅ Neo4j MCP client connected properly
- ✅ Schema pre-fetched before streaming
- ✅ System prompt includes schema
- ✅ Only `read_neo4j_cypher` exposed to GPT-5
- ✅ `streamText()` configured correctly
- ✅ No premature MCP client disconnection
- ✅ Error handling implemented
- ✅ No TypeScript errors

---

## Task 5: Update Main Page Interface ✅

**Description:** Update homepage to use Oak Curriculum Agent.

**File:** `app/page.tsx`

**Dependencies:** Task 4

**Deliverables:**
- Update `<h1>` text to "Oak Curriculum Agent"
- Update `<ChatAssistant>` API prop to `/api/oak-curriculum-agent`
- Maintain existing styling and layout

**Definition of Done:**
- ✅ Page title changed to "Oak Curriculum Agent"
- ✅ ChatAssistant points to correct API route
- ✅ No TypeScript errors
- ✅ UI displays correctly

---

## Task 6: Configure Environment Variables ✅

**Description:** Set up required environment variables for Neo4j MCP server.

**File:** `.env.local`

**Dependencies:** None (can be done in parallel)

**Deliverables:**
- Add to `.env.local`:
  ```bash
  OPENAI_API_KEY=sk-...
  NEO4J_MCP_URL=https://neo4j-mcp-server-6lb6k47dpq-ew.a.run.app
  ```
- Verify `.env.local` is in `.gitignore`

**Definition of Done:**
- ✅ `.env.local` file exists
- ✅ Environment variables set (corrected URL from Cloud Run)
- ✅ File is NOT committed to git
- ✅ Variables accessible via `process.env` in API routes

---

## Task 7: Run Type Check

**Description:** Verify all TypeScript code is error-free.

**Command:** `pnpm tsc --noEmit`

**Dependencies:** Tasks 1-5

**Deliverables:**
- Clean TypeScript compilation
- Fix any type errors found

**Definition of Done:**
- ✅ `pnpm tsc --noEmit` runs without errors
- ✅ No TypeScript warnings or errors in IDE

---

## Task 8: Manual Testing & Validation

**Description:** Test the Oak Curriculum Agent end-to-end.

**Command:** `pnpm dev`

**Dependencies:** Tasks 1-7

**Test Cases:**
1. **Connection Test:**
   - Start dev server
   - Open browser to localhost
   - Verify page loads without errors
   - Check console for MCP connection success

2. **Schema Pre-fetching Test:**
   - Send first message
   - Check server logs for schema retrieval
   - Verify no "schema not found" errors

3. **Query Translation Test:**
   - Ask: "Show me all key stages"
   - Verify tool call displayed in UI
   - Verify Cypher query executed
   - Verify educator-friendly response

4. **Tool Access Control Test:**
   - Ask: "Delete all data" or "Create a new node"
   - Verify agent refuses or explains read-only access
   - Verify no `write_neo4j_cypher` tool calls

5. **Multi-turn Conversation Test:**
   - Ask: "What subjects are in Year 7?"
   - Follow up: "Tell me more about Maths"
   - Verify context maintained
   - Verify schema persists across turns

6. **Streaming Test:**
   - Ask a complex question
   - Verify response streams incrementally
   - Verify tool calls visible before final response

**Deliverables:**
- All test cases pass
- Document any issues found

**Definition of Done:**
- ✅ Dev server runs without errors
- ✅ MCP connection established successfully
- ✅ Schema pre-fetched at conversation start
- ✅ Natural language queries translate to Cypher
- ✅ Cypher queries execute and return results
- ✅ Read-only access enforced
- ✅ Responses are educator-friendly
- ✅ Tool calls visible in UI
- ✅ Streaming works smoothly
- ✅ Multi-turn conversations work

---

## Task 9: Final Type Check Before Completion

**Description:** Final verification that all code is type-safe.

**Command:** `pnpm tsc --noEmit`

**Dependencies:** Task 8

**Deliverables:**
- Clean TypeScript compilation after any fixes from testing

**Definition of Done:**
- ✅ `pnpm tsc --noEmit` runs without errors
- ✅ All files pass type checking
- ✅ Project ready for production build

---

## Task 10: Implement Production Security (Deferred)

**Description:** Add Cloud Run IAM authentication to secure MCP server endpoint.

**Status:** ⏸️ Blocked (requires admin permissions)

**Dependencies:** Admin with `roles/iam.serviceAccountCreator` permission

**Current State:**
- Cloud Run service: Publicly accessible (development mode)
- Service account exists: `run-neo4j@oak-ai-playground.iam.gserviceaccount.com`
- Service account has invoker permission on Cloud Run service
- Missing: Service account key JSON for Next.js authentication

**Implementation Steps:**
1. Admin creates service account key:
   ```bash
   gcloud iam service-accounts keys create neo4j-mcp-sa-key.json \
     --iam-account=run-neo4j@oak-ai-playground.iam.gserviceaccount.com
   ```
2. Add key to `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/neo4j-mcp-sa-key.json
   ```
3. Update `neo4j-client.ts` to use IAM authentication with SSE transport
4. Test authenticated connection
5. Remove public access from Cloud Run

**Alternative Options:**
- Create read-only Neo4j user and redeploy MCP server with those credentials
- Deploy API Gateway with API key validation

**Definition of Done:**
- ⏸️ Service account key obtained from admin
- ⏸️ Next.js authenticates to Cloud Run via service account
- ⏸️ Public access removed from Cloud Run
- ⏸️ MCP connection works with authentication
- ⏸️ TypeScript errors resolved

**Reference:** See `ARCHITECTURE.md` section 9.2 for detailed security options

---

## Implementation Order

Execute tasks in this sequence:

```
Task 6 (Environment Variables)
  ↓
Task 1 (Neo4j MCP Client)
  ↓
Task 2 (Update MCP Exports)
  ↓
Task 3 (System Prompt Builder) [can parallel with Task 1-2]
  ↓
Task 4 (API Route)
  ↓
Task 5 (Update Main Page)
  ↓
Task 7 (Type Check)
  ↓
Task 8 (Manual Testing)
  ↓
Task 9 (Final Type Check)
```

**Parallel opportunities:**
- Tasks 1, 3, 6 can start simultaneously
- Task 2 must wait for Task 1
- Task 4 must wait for Tasks 1, 2, 3
- Task 5 must wait for Task 4

---

## Success Criteria

**Development Phase (Current):**

- ✅ Tasks 1-6 complete
- ✅ Agent successfully connects to Neo4j MCP server
- ✅ Agent pre-fetches schema at conversation start
- ✅ Agent translates natural language to Cypher queries
- ✅ Agent executes queries and returns relevant results
- ✅ Agent formats responses for educators
- ✅ Agent refuses write operations (AI layer only exposes read tool)
- ✅ Streaming responses work smoothly
- ✅ Tool calls visible in chat interface
- ✅ No TypeScript errors
- ✅ All environment variables configured
- ⏸️ Tasks 7-9: Testing, validation (in progress)
- ⏸️ Task 10: Production security (deferred, requires admin)

**Production Readiness:**

- ⏸️ Cloud Run IAM authentication implemented
- ⏸️ Service account key configured
- ⏸️ Public access removed from MCP server
- ⏸️ End-to-end testing with authentication

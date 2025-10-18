# Development History

## Phase 1 MVP - Task Progress

### Task 1: Codebase Cleanup & Audit ✅ (Completed 2025-10-17)

**Objective**: Remove all Firecrawl-related code to align codebase with Phase 1 MVP scope (Neo4j curriculum graph only).

**Actions Taken**:
- **Deleted Files** (3):
  - `lib/mcp/client/firecrawl-client.ts` - MCP client for Firecrawl web scraping
  - `components/agent/web-scraper-prompt.ts` - Web scraper system prompt
  - `app/api/agent-with-mcp-tools/route.ts` - Demo API route using Firecrawl

- **Updated Files** (2):
  - `lib/mcp/index.ts` - Removed all Firecrawl exports, kept only Neo4j exports
  - `lib/mcp/client/types.ts` - Removed 122 lines of Firecrawl type definitions, kept only `Neo4jMCPClientConfig`

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All imports resolve correctly ✓
- No Firecrawl references remain in codebase ✓
- Cleared Next.js build cache (`.next/`) to remove stale references

**Commit**: `f28cb44` - "chore(mcp): remove Firecrawl client and dependencies"

**Deployment**: Successfully deployed to new Vercel project. Initial "no response" issue resolved by setting correct environment variables in Vercel dashboard.

---

## Key Decisions & Patterns

### MCP Integration
- **Single Purpose**: Codebase now uses exclusively Neo4j MCP client
- **Singleton Pattern**: Neo4j client maintained via `getNeo4jMCPClient()` for connection reuse
- **Type Safety**: Only Neo4j-specific types exported from `lib/mcp`

### Deployment Strategy
- **Separate Vercel Project**: Created new Vercel project for Phase 1 MVP deployment
- **Repository Isolation**: This repo (`curriculum-agent-v2`) connected to new Vercel project, keeping original deployment intact
- **Environment Variables Required**:
  - `OPENAI_API_KEY` - For GPT models
  - `NEO4J_MCP_URL` - For Neo4j MCP server (write-enabled)
  - Additional vars for Supabase, Inngest (to be configured in Task 2)

### Standards Compliance
- Followed CLAUDE.md pre-commit checklist (TypeScript check before commit)
- Used conventional commit format: `chore(scope): description`
- Cleared build cache when encountering stale references

### Task 2: Environment Setup & Dependencies ✅ (Completed 2025-10-17)

**Objective**: Install Phase 1 dependencies and create environment variable templates.

**Actions Taken**:
- **Installed Packages** (3):
  - `inngest` v3.44.3 - Event-driven async workflows
  - `@supabase/supabase-js` v2.75.1 - PostgreSQL client
  - `@tremor/react` v3.18.7 - Dashboard charts

- **Updated Packages to Latest**:
  - `ai`: 5.0.44 → 5.0.76 (+32 versions)
  - `@ai-sdk/openai`: 2.0.30 → 2.0.52
  - `@ai-sdk/react`: 2.0.51 → 2.0.76
  - `@modelcontextprotocol/sdk`: 1.18.2 → 1.20.1
  - `next`: 15.5.3 → 15.5.6
  - `react`: 19.1.0 → 19.2.0
  - `zod`: 4.1.11 → 4.1.12
  - `typescript`: 5.9.2 → 5.9.3
  - Tailwind, type definitions, and other dependencies

- **Created Files** (2):
  - `.env.example` - Template with all required environment variables
  - `docs/` - Directory for test queries

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- `.gitignore` already contains `.env*` and `.env.local` ✓
- All packages appear in `package.json` ✓

### Task 3: TypeScript Type Definitions ✅ (Completed 2025-10-17)

**Objective**: Create core TypeScript interfaces and types for agents, memory, and evaluation.

**Actions Taken**:
- **Created Files** (4):
  - `lib/types/agent.ts` - `AgentContext`, `QueryAgentResult`, `Citation` interfaces
  - `lib/types/memory.ts` - `Memory`, `QueryPattern` interfaces
  - `lib/types/evaluation.ts` - Zod `EvaluationSchema` + `Evaluation` type
  - `lib/types/index.ts` - Central export file

**Key Features**:
- All interfaces match ARCHITECTURE.md section 4.3 specifications exactly
- Zod schema for Reflection Agent structured output (5-dimension rubric)
- JSDoc comments on all interfaces and properties
- Type-safe with TypeScript strict mode

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All types exportable from `lib/types/index` ✓
- Zero TypeScript errors ✓

### Task 4: Database Setup - Supabase Client ✅ (Completed 2025-10-17)

**Objective**: Create Supabase client singleton and define table schemas.

**Actions Taken**:
- **Created Files** (3):
  - `lib/database/supabase.ts` - Singleton client with type-safe database schema interface
  - `lib/database/schema.ts` - SQL table definitions with indexes and comments
  - `lib/database/queries.ts` - 15 type-safe query functions

**Key Features**:
- **Singleton Pattern**: Reusable Supabase client instance
- **Four Tables**: interactions, feedback, evaluation_metrics, memory_stats
- **Comprehensive Indexes**: created_at, foreign keys, score-based queries
- **Query Functions**: Create/read operations for all tables, dashboard data retrieval
- **Type Safety**: Full TypeScript interfaces matching ARCHITECTURE.md section 4.2

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All functions have JSDoc comments ✓
- Follows singleton pattern (CLAUDE.md standards) ✓

### Task 5: OpenAI Embeddings Service ✅ (Completed 2025-10-17)

**Objective**: Create embedding generation service for memory retrieval using OpenAI's text-embedding-3-small model.

**Actions Taken**:
- **Created File**: `lib/memory/embeddings.ts`
- **Implemented Function**: `generateEmbedding(text: string): Promise<number[]>`
  - Uses AI SDK `embed()` function with `openai.embedding('text-embedding-3-small')`
  - Returns 1536-dimensional float array
  - Validates input text is non-empty
  - Validates OPENAI_API_KEY environment variable is set
  - Validates output dimensions match expected 1536
- **Error Handling**: Comprehensive try-catch with:
  - Input validation
  - API key validation
  - Dimension validation
  - Detailed error logging with context (text length, preview)
  - User-friendly error messages
- **JSDoc Comments**: Complete documentation including:
  - Module-level description
  - Function description with usage example
  - Parameter and return type documentation
  - References to ARCHITECTURE.md and CLAUDE.md

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All error paths handled gracefully ✓
- Follows AI SDK v5 patterns ✓
- Complies with CLAUDE.md standards (naming, documentation, error handling) ✓

**Key Features**:
- Uses latest AI SDK `embed()` API (not deprecated patterns)
- Robust input validation prevents empty text embeddings
- Environment variable check provides clear setup guidance
- Dimension validation ensures data integrity
- Detailed logging aids debugging without exposing sensitive data

**Integration Points**:
- **Task 6** (Memory Retrieval): Will use this to generate query embeddings for vector search
- **Task 11** (Learning Agent): Will use this to create memory embeddings for storage

### Task 6: Memory Retrieval Service ✅ (Completed 2025-10-17)

**Objective**: Implement vector similarity search for retrieving relevant past interactions from Neo4j.

**Actions Taken**:
- **Created File**: `lib/memory/retrieval.ts`
- **Implemented Function**: `retrieveSimilarMemories(query: string, limit?: number): Promise<Memory[]>`
  - Generates query embedding using `generateEmbedding()` from Task 5
  - Uses Neo4j MCP client to execute vector similarity Cypher query
  - Leverages Neo4j's `db.index.vector.queryNodes()` for cosine similarity search on 1536-dim embeddings
  - Filters results to only high-quality memories (overall_score > 0.75)
  - Returns top 3 memories by default (configurable via `limit` parameter)
- **Cypher Query Pattern**:
  ```cypher
  CALL db.index.vector.queryNodes('memory_embeddings', $limit, $embedding)
  YIELD node, score
  WHERE node.overall_score > 0.75
  RETURN node, score
  ORDER BY score DESC
  ```
- **Error Handling**: Graceful fallback approach:
  - Returns empty array on any error (Query Agent can continue without memories)
  - Logs errors with context for debugging
  - Never throws exceptions that would crash the Query Agent
- **Data Transformation**:
  - Implemented `parseMemories()` helper function
  - Converts Neo4j snake_case properties to TypeScript camelCase
  - Validates required fields before parsing
  - Skips invalid nodes rather than failing entire operation
- **JSDoc Comments**: Complete documentation including:
  - Module-level description
  - Function description with usage example
  - Explanation of few-shot learning purpose
  - References to ARCHITECTURE.md and CLAUDE.md

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All error paths return empty array (graceful fallback) ✓
- Follows singleton MCP client pattern (CLAUDE.md) ✓
- Complies with CLAUDE.md error handling standards ✓

**Key Features**:
- **Vector Similarity Search**: Uses Neo4j native vector index with cosine similarity
- **Quality Filtering**: Only retrieves high-performing memories (score > 0.75)
- **Few-Shot Learning**: Enables Query Agent to learn from past successful interactions
- **Graceful Degradation**: System continues functioning even when memory retrieval fails
- **Type Safety**: Full TypeScript Memory interface with proper field mapping

**Integration Points**:
- **Task 7** (Query Prompt Builder): Will inject these memories as few-shot examples
- **Task 13** (Query Agent API): Will call this function before each user query
- **Requires Neo4j Setup** (Task 26): Vector index 'memory_embeddings' must exist

**How It Works**:
1. User asks: "What fractions do Year 3 students learn?"
2. Query Agent calls `retrieveSimilarMemories(query)`
3. Function generates embedding for the query
4. Executes vector search in Neo4j to find similar past queries
5. Returns 3 highest-quality similar memories
6. Query Agent uses these as few-shot examples in system prompt
7. This guides the agent to use similar Cypher patterns that worked before
8. **Result**: Better answers based on learned experience

**Dependencies Met**:
- ✓ Task 3: Uses Memory type interface
- ✓ Task 5: Uses generateEmbedding() function
- ✓ Existing MCP client: Uses Neo4j singleton for Cypher execution

### Task 7: Query Agent System Prompt Builder ✅ (Completed 2025-10-17)

**Objective**: Create function to build Query Agent system prompt with schema and few-shot examples.

**Actions Taken**:
- **Created File**: `lib/agents/prompts/query-prompt.ts`
- **Implemented Function**: `buildQueryPrompt(schema: Record<string, any>, memories: Memory[]): string`
  - Uses `Record<string, any>` for schema type to avoid deep instantiation issues (CLAUDE.md pattern)
  - Comprehensive system prompt with 6-step process for query handling
  - Multi-turn tool calling instructions (agent can call `read_neo4j_cypher` multiple times)
  - Detailed confidence scoring guidelines with 5 tiers (0.0-1.0):
    - 0.90-1.00: Direct graph match (★★★★★)
    - 0.75-0.89: Inferred from relationship (★★★★☆)
    - 0.60-0.74: Synthesized from multiple nodes (★★★☆☆)
    - 0.40-0.59: Weak support (★★☆☆☆)
    - 0.00-0.39: No clear support (★☆☆☆☆) - avoid
  - Citation format instructions using `[Node-ID]`
  - Cypher query generation best practices
  - Quality standards and example response format
- **Helper Functions**:
  - `formatSchema()`: Converts Neo4j schema JSON to human-readable text
    - Handles node labels and relationship types
    - Graceful fallback for various schema formats
  - `formatFewShotExamples()`: Transforms memories into few-shot learning examples
    - Shows user query, Cypher used, answer snippet, and evaluator feedback
    - Displays quality scores (overall, confidence, grounding, accuracy)
    - Truncates answers to 200 chars for brevity
    - Returns helpful message if no memories available
- **JSDoc Comments**: Complete documentation including:
  - Module-level description
  - Function description with usage example
  - Explanation of schema pre-fetching pattern
  - References to ARCHITECTURE.md and CLAUDE.md

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All functions have explicit return types ✓
- Follows CLAUDE.md naming conventions (camelCase for functions) ✓
- Proper import order (external, internal, types) ✓

**Key Features**:
- **Schema Pre-fetching**: Schema fetched once per conversation via MCP, stays in prompt
- **Few-Shot Learning**: Injects 3 high-quality past interactions as examples
- **Multi-Turn Strategy**: Explicitly instructs agent it can call tools multiple times
- **Confidence Scoring**: Clear 5-tier scoring system with star ratings
- **Citation Format**: Exact format specification `[Node-ID]`
- **Cypher Best Practices**: Parameterization, relationship usage, limiting results
- **Quality Standards**: Prioritizes accuracy, evidence, clarity, honesty
- **Error Handling**: Graceful fallbacks for empty schema/memories

**Prompt Structure**:
1. **Capabilities**: What the agent can do
2. **Graph Schema**: Pre-fetched schema (stays in context)
3. **Few-Shot Examples**: Similar past successful interactions
4. **6-Step Process**: Analyze → Generate Cypher → Execute (multi-turn) → Synthesize → Score → Cite
5. **Confidence Guidelines**: Detailed scoring rubric
6. **Citation Format**: Exact formatting rules
7. **Quality Standards**: What to prioritize and avoid
8. **Example Response**: Template for structuring answers

**Integration Points**:
- **Task 13** (Query Agent API): Will call this to build system prompts
- **Task 6** (Memory Retrieval): Provides memories parameter
- **MCP Schema Tool**: Schema comes from pre-fetched `get_neo4j_schema` result

**How It Works**:
1. API route pre-fetches Neo4j schema once at conversation start
2. For each user query, retrieves 3 similar high-quality memories
3. Calls `buildQueryPrompt(schema, memories)` to build system prompt
4. Prompt includes schema + few-shot examples in context
5. Agent uses schema to write Cypher, learns from examples
6. Schema stays in context (not re-fetched), memories refresh per query

**Dependencies Met**:
- ✓ Task 3: Uses Memory type interface
- ✓ CLAUDE.md standards: Naming, documentation, type safety

### Task 8: Reflection Agent System Prompt Builder ✅ (Completed 2025-10-17)

**Objective**: Create evaluation rubric prompt for Reflection Agent to assess interaction quality.

**Actions Taken**:
- **Created File**: `lib/agents/prompts/reflection-prompt.ts`
- **Implemented Function**: `buildEvaluationPrompt(query, answer, cypherQueries, graphResults): string`
  - Comprehensive 5-dimension evaluation rubric with detailed scoring criteria
  - Each dimension scored 0.0-1.0 with 11-point scale and specific guidelines
  - Evidence-based evaluation comparing answer to actual graph results
  - Requests structured JSON output matching `EvaluationSchema`

**5-Dimension Rubric** (matching ARCHITECTURE.md section 6.2):
1. **Grounding (30% weight)**: Claims supported by graph evidence
   - 11-point scale from 1.0 (perfect citations) to 0.0 (fully hallucinated)
2. **Accuracy (30% weight)**: Information correct per curriculum
   - 11-point scale from 1.0 (no errors) to 0.0 (completely wrong)
3. **Completeness (20% weight)**: Fully answers the question
   - 11-point scale from 1.0 (comprehensive) to 0.0 (doesn't answer)
4. **Pedagogy (10% weight)**: Appropriate curriculum context
   - 11-point scale from 1.0 (excellent framing) to 0.0 (inappropriate)
5. **Clarity (10% weight)**: Well-structured and clear
   - 11-point scale from 1.0 (crystal clear) to 0.0 (incomprehensible)

**Overall Score Calculation**:
```
Overall = (Grounding × 0.30) + (Accuracy × 0.30) + (Completeness × 0.20) + (Pedagogy × 0.10) + (Clarity × 0.10)
```

**Qualitative Feedback**:
- 3 specific strengths
- 3 specific weaknesses
- 3 actionable suggestions for improvement

**Helper Functions**:
- `formatCypherQueries()`: Formats queries with syntax highlighting markers
- `formatGraphResults()`: Converts Neo4j results to JSON, truncates if >8000 chars

**Verification**:
- TypeScript compilation successful: `pnpm tsc --noEmit` ✓
- All functions have explicit return types ✓
- Comprehensive JSDoc comments with usage examples ✓
- Follows CLAUDE.md standards (naming, documentation, type safety) ✓

**Key Features**:
- Evidence-based evaluation (not abstract standards)
- Granular scoring with specific criteria at each level
- Actionable feedback for learning improvement
- Pedagogical focus for curriculum education
- Graceful handling of edge cases (no queries, large results)

**Integration Points**:
- **Task 10** (Reflection Function): Will call this to generate evaluation prompts
- Uses `EvaluationSchema` from Task 3 for structured output

**Dependencies Met**:
- ✓ Task 3: References EvaluationSchema for output format
- ✓ CLAUDE.md standards: JSDoc, TypeScript, naming conventions

### Task 9: Inngest Client Setup ✅ (Completed 2025-10-17)

**Created Files**: `lib/inngest/client.ts`, `lib/inngest/events.ts`

**Features**: Singleton pattern with environment validation; event types for `interaction.complete` and `reflection.complete`; type guards for event checking

**Verification**: TypeScript compilation ✓

### Task 10: Reflection Agent Function ✅ (Completed 2025-10-17)

**Created File**: `lib/inngest/functions/reflection.ts`

**Implementation**:
- Inngest function listening for `interaction.complete` events
- Uses AI SDK `generateObject()` with GPT-4o and `EvaluationSchema`
- 4 steps: evaluate-interaction, calculate-overall-score, save-evaluation, trigger-learning
- Weighted overall score: `(G×0.30) + (A×0.30) + (C×0.20) + (P×0.10) + (Cl×0.10)`
- Saves to Supabase `evaluation_metrics` table
- Emits `reflection.complete` event for Learning Agent

**Error Handling**:
- 3 retries with exponential backoff
- `onFailure` handler emits event with default scores (0.5) to avoid blocking pipeline
- Graceful fallback if Supabase save fails (evaluation still succeeds)
- Detailed console logging for debugging

**Verification**: TypeScript compilation ✓

---

### Task 11: Learning Agent Function ✅ (Completed 2025-10-17)

**Created File**: `lib/inngest/functions/learning.ts` (409 lines)

**Implementation**:
- Inngest function listening for `reflection.complete` events
- No LLM call (data operations only)
- 6 granular steps with independent retry:
  1. **generate-embedding**: Create 1536-dim vector for query (critical)
  2. **create-memory-node**: Write `:Memory` node with all properties (critical)
  3. **link-evidence**: Connect via `:USED_EVIDENCE` relationships (critical)
  4. **extract-pattern**: Create `:QueryPattern` if score > 0.8 (non-critical)
  5. **link-similar-memories**: Vector search for `:SIMILAR_TO` links (non-critical)
  6. **update-stats**: Refresh `memory_stats` cache in Supabase (non-critical)

**Memory Node Properties**:
- Query/answer text, Cypher queries, embedding vector
- All 5 evaluation scores + overall score (grounding, accuracy, completeness, pedagogy, clarity)
- Evaluator notes (strengths/weaknesses/suggestions as JSON)
- Metadata: id, type, memories_used, timestamps

**Helper Function**: `hashCypherPattern()` - Extracts MATCH patterns from Cypher for pattern tracking

**Error Handling**:
- Critical steps (1-3): Throw errors to trigger Inngest retry
- Non-critical steps (4-6): Catch/log errors, return gracefully (don't block pipeline)

**Pattern Extraction**:
- Triggered only if overall score > 0.8
- Uses `MERGE` to upsert `:QueryPattern` nodes
- Increments success_count on match
- Links pattern to memory via `:APPLIED_PATTERN`

**Stats Update**:
- Queries Neo4j for current memory/pattern counts and averages
- Updates single-row `memory_stats` table in Supabase
- Enables fast dashboard queries (pre-aggregated data)

**Verification**: TypeScript compilation ✓

### Task 12: Inngest Webhook API Route ✅ (Completed 2025-10-18)

**Created File**: `app/api/inngest/route.ts`

**Implementation**:
- Uses `serve()` from `inngest/next` to export GET, POST, PUT handlers
- Registers `reflectionFunction` and `learningFunction`
- Provides webhook endpoint for Inngest Cloud: `/api/inngest`

**Verification**: TypeScript compilation ✓

---

### Task 13: Query Agent API Route (Chat Endpoint) ✅ (Completed 2025-10-18)

**Created File**: `app/api/chat/route.ts` (258 lines)

**Implementation**:
- **POST handler** with message parsing, model/temperature config
- **Memory retrieval**: Calls `retrieveSimilarMemories()` for 3 high-quality memories (few-shot learning)
- **Schema pre-fetching**: Uses MCP `get_neo4j_schema` once per conversation
- **System prompt**: Calls `buildQueryPrompt(schema, memories)` with injected context
- **Tool exposure**: Read-only `read_neo4j_cypher` for Query Agent
- **AI SDK v5**: `streamText()` with `onStepFinish()` callback tracking
- **Event emission**: Non-blocking async function emits `interaction.complete` after streaming
- **Metadata tracking**: Cypher queries, graph results, step count, citations, latency
- **Supabase logging**: Creates interaction record with all metrics
- **Error handling**: Graceful fallbacks, never exposes raw errors (status 200)

**Key Decisions**:
- Used `toTextStreamResponse()` (not `toDataStreamResponse()` - corrected from CLAUDE.md)
- Removed `maxTokens` parameter (not supported in AI SDK v5.0.76)
- Event emission wrapped in async IIFE (doesn't block stream response)
- Type assertions for tool call args/results (MCP tools use `any` per CLAUDE.md)
- Citation extraction via regex `\[([^\]]+)\]` matching Node-ID format

**Verification**: TypeScript compilation ✓

**Testing Readiness**:
- ✅ Backend complete and ready for testing
- ⚠️ Requires Inngest env vars (Task 28) for full functionality
- ⚠️ Frontend updated to use `/api/chat` endpoint
- 📖 Testing deferred to Task 29 (after env setup in Task 28)
- 📖 See `TESTING-GUIDE.md` for comprehensive testing instructions
- 📖 See `QUICKSTART-TESTING.md` for 5-minute learning verification

---

### Task 14: Home Page - UI Components ✅ (Completed 2025-10-18)

**Objective**: Create home page components for model selection and configuration.

**Created Files** (3):
- `components/home/app-description.tsx` - Application title and learning mechanism explanation
- `components/home/model-selector.tsx` - Model dropdown (GPT-4o/gpt-4o-mini/GPT-5)
- `components/home/model-params.tsx` - Collapsible advanced settings (temperature, max tokens)

**Implementation Details**:
- **AppDescription**: Card component explaining agent capabilities and learning loop
- **ModelSelector**: Dropdown using shadcn/ui Select with model metadata (label, description)
- **ModelParams**: Collapsible panel with Temperature slider (0-1, step 0.1) and Max tokens input (500-4000)

**shadcn/ui Components Used**:
- Added `Slider` component via `pnpm dlx shadcn@latest add slider`
- Existing: `Card`, `Select`, `Collapsible`, `Input`, `Button`

**State Management**:
- All components accept `value` and `onChange` props for React state
- Parent component (Task 15) will manage state and sessionStorage persistence

**Verification**: TypeScript compilation ✓

---

### Task 15: Home Page - Main Page ✅ (Completed 2025-10-18)

**Created File**: `app/page.tsx` (139 lines) - replaced chat interface with model configuration landing page

**Implementation**:
- State management for model (default: 'gpt-4o'), temperature (0.3), maxTokens (2000)
- Renders AppDescription, ModelSelector, ModelParams components from Task 14
- `handleStartChat()` saves config to sessionStorage as JSON
- Navigation to `/chat` using Next.js `useRouter`
- Responsive layout with Oak logo, centered button, footer note

**Key Features**:
- **ChatConfig Interface**: Type-safe config object (model, temperature, maxTokens)
- **SessionStorage**: Config persisted under `'chatConfig'` key for chat page to read
- **Client Component**: Uses `'use client'` directive with React hooks
- **Default Values**: Match FUNCTIONAL.md specs exactly

**Verification**: TypeScript compilation ✓

---

## Current State

**Progress**: Tasks 1-15 complete (Backend + Home page ready)
**Next Task**: Task 16 - Evidence Panel Component

**Three-Agent Learning Loop Status**:
- ✅ Query Agent API route (Task 13)
- ✅ Query Agent prompt builder (Task 7)
- ✅ Reflection Agent (Task 10)
- ✅ Learning Agent (Task 11)
- ✅ Inngest webhook (Task 12)

**Frontend Status**:
- ✅ Home UI components (Task 14)
- ✅ Home page integration (Task 15)
- ⏳ Chat UI components (Tasks 16-18)
- ⏳ Chat page updates (Tasks 19-20)

---

## Key Patterns Established

**Architecture**:
- **Singleton Pattern**: All clients (Supabase, Inngest, MCP)
- **Error Handling**: Async agents never block pipeline, graceful fallbacks, status 200 for user errors
- **Type Safety**: Zod schemas for LLM outputs, strict TypeScript, type assertions for MCP tools (`any`)

**AI SDK v5**:
- `streamText()` with `toTextStreamResponse()`, `onStepFinish()` tracking
- `generateObject()` for structured outputs
- `embed()` for vector embeddings

**Event-Driven**:
- Async IIFE pattern for non-blocking Inngest events
- Granular `step.run()` for independent retries

**MCP Integration**:
- Pre-fetch schema once, singleton client, read-only tools for Query Agent

**UI Components**:
- shadcn/ui (New York, neutral theme)
- Props pattern for state management (lift to parent)
- JSDoc documentation on all components

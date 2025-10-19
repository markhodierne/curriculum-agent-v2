# TODO.md

**Oak Curriculum Agent - Phase 1 MVP Development Tasks**

This document contains atomic, sequential tasks for building the Phase 1 MVP (4-6 week timeline).

**Priority**: Tasks are numbered sequentially and must be completed in order due to dependencies.

---

## ✅ **Task 1: Codebase Cleanup & Audit** (Completed 2025-10-17)

Removed Firecrawl code, verified TypeScript compilation. See HISTORY.md.

---

## ✅ **Task 2: Environment Setup & Dependencies** (Completed 2025-10-17)

Installed Inngest, Supabase, Tremor. Created `.env.example`. See HISTORY.md.

---

## ✅ **Task 3: TypeScript Type Definitions** (Completed 2025-10-17)

Created `lib/types/` with agent, memory, evaluation types. See HISTORY.md.

---

## ✅ **Task 4: Database Setup - Supabase Client** (Completed 2025-10-17)

Created `lib/database/supabase.ts` (singleton), `schema.ts` (4 tables), `queries.ts` (15 functions). See HISTORY.md.

---

## ✅ **Task 5: OpenAI Embeddings Service** (Completed 2025-10-17)

Created `lib/memory/embeddings.ts` with embedding generation using text-embedding-3-small model. See HISTORY.md.

---

## ✅ **Task 6: Memory Retrieval Service** (Completed 2025-10-17)

Created `lib/memory/retrieval.ts` with vector similarity search for few-shot learning. See HISTORY.md.

---

## ✅ **Task 7: Query Agent System Prompt Builder** (Completed 2025-10-17)

Created `lib/agents/prompts/query-prompt.ts` with system prompt builder for Query Agent. See HISTORY.md.

---

## ✅ **Task 8: Reflection Agent System Prompt Builder** (Completed 2025-10-17)

Created `lib/agents/prompts/reflection-prompt.ts` with 5-dimension evaluation rubric (11-point scale per dimension). See HISTORY.md.

---

## ✅ **Task 9: Inngest Client Setup** (Completed 2025-10-17)

Created `lib/inngest/client.ts` (singleton) and `lib/inngest/events.ts` (event types for `interaction.complete` and `reflection.complete`). See HISTORY.md.

---

## ✅ **Task 10: Reflection Agent Function** (Completed 2025-10-17)

Created `lib/inngest/functions/reflection.ts` with Inngest function using `generateObject()`, weighted scoring, Supabase save, event emission, retry logic, and error handling. See HISTORY.md.

---

## ✅ **Task 11: Learning Agent Function** (Completed 2025-10-17)

Created `lib/inngest/functions/learning.ts` with 6-step memory creation: embedding generation, memory node creation, evidence linking, pattern extraction (score > 0.8), similar memory linking, stats cache update. See HISTORY.md.

---

## ✅ **Task 12: Inngest Webhook API Route** (Completed 2025-10-18)

Created `app/api/inngest/route.ts` with `serve()` exports, registered both async agent functions. See HISTORY.md.

---

## ✅ **Task 13: Query Agent API Route (Chat Endpoint)** (Completed 2025-10-18)

**Description**: Implement main chat API route with Query Agent logic.

**Deliverables**:
- [x] Create `app/api/chat/route.ts` (old oak-curriculum-agent route superseded)
- [x] Implement POST handler with:
  - Message parsing
  - Model/temperature config from request body
  - Similar memory retrieval (Task 6 function)
  - Schema pre-fetching via MCP
  - System prompt building (Task 7 function)
  - `streamText()` with Neo4j tools
  - Non-blocking async event emission to `interaction.complete`
- [x] Add error handling (fail-safe, graceful fallbacks)
- [x] Add JSDoc comments
- [x] Run `pnpm tsc --noEmit` ✓

**Definition of Done**: ✓ All criteria met

---

## ✅ **Task 14: Home Page - UI Components** (Completed 2025-10-18)

**Description**: Create home page components for model selection and configuration.

**Deliverables**:
- [x] Create `components/home/app-description.tsx` - displays what agent does, how it learns
- [x] Create `components/home/model-selector.tsx` - dropdown for GPT-4o/gpt-4o-mini/GPT-5
- [x] Create `components/home/model-params.tsx` - collapsible advanced settings (temperature, max tokens)
- [x] Use shadcn/ui components (Select, Slider, Collapsible)
- [x] Store selections in React state (via props)
- [x] Add JSDoc comments
- [x] Run `pnpm tsc --noEmit` ✓

**Definition of Done**: ✓ All criteria met

---

## ✅ **Task 15: Home Page - Main Page** (Completed 2025-10-18)

Updated `app/page.tsx` (139 lines) with model configuration, sessionStorage persistence, and navigation to `/chat`. See HISTORY.md.

---

## ✅ **Task 16: Chat Page - Evidence Panel Component** (Completed 2025-10-18)

Created `components/chat/evidence-panel.tsx` (190 lines) with collapsible UI, star ratings (5-tier system), overall confidence calculation. See HISTORY.md.

---

## ✅ **Task 17: Chat Page - Agent Trace Panel Component** (Completed 2025-10-18)

Created `components/chat/agent-trace-panel.tsx` (122 lines) with collapsible UI, numbered steps, blue theme. See HISTORY.md.

---

## ✅ **Task 18: Chat Page - Feedback Controls Component** (Completed 2025-10-18)

**Description**: Create feedback controls (👍/👎, grounded checkbox, optional note).

**Deliverables**:
- [x] Create `components/chat/feedback-controls.tsx` (243 lines)
- [x] Accept `messageId: string` prop
- [x] Implement:
  - Thumbs up/down buttons (mutually exclusive)
  - "Well grounded?" checkbox
  - "Add note" button → reveals textarea (max 500 chars)
- [x] Save feedback to Supabase `feedback` table on change
- [x] Use shadcn/ui Button, Checkbox, Textarea (added Checkbox component)
- [x] Add JSDoc comments
- [x] Run `pnpm tsc --noEmit` ✓

**Definition of Done**: ✓ All criteria met

---

## ✅ **Task 19: Chat Page - Update ChatAssistant** (Completed 2025-10-18)

**Description**: Update existing ChatAssistant to integrate new Phase 1 components and useChat with config.

**Deliverables**:
- [x] Update `components/chat/chat-assistant.tsx`:
  - Read model config from sessionStorage
  - Pass config to useChat `body` parameter
  - Update API endpoint to `/api/chat`
  - Add Evidence Panel below assistant messages
  - Add Agent Trace Panel below assistant messages
  - Add Feedback Controls below assistant messages
  - Update tool display names for Neo4j tools (e.g., "Querying curriculum graph")
- [x] Maintain existing performance optimizations (debouncing, memoization)
- [x] Add JSDoc comments for new sections
- [x] Run `pnpm tsc --noEmit` ✓

**Definition of Done**: ✓ All criteria met

---

## ✅ **Task 20: Chat Page - Create Chat Route** (Completed 2025-10-18)

Created `app/chat/page.tsx` (88 lines) with full-height chat interface, header with Oak logo/title/back button, ChatAssistant integration. See HISTORY.md.

---

## ✅ **Task 21: Dashboard - Learning Curve Chart Component** (Completed 2025-10-18)

Created `components/dashboard/learning-curve.tsx` with Tremor LineChart showing learning improvement. See HISTORY.md.

---

## ✅ **Task 22: Dashboard - Stats Cards Component** (Completed 2025-10-19)

Created `components/dashboard/stats-cards.tsx` (212 lines) with three Tremor Cards displaying Total Interactions, Average Confidence, and Memories Created. See HISTORY.md.

---

## ✅ **Task 23: Dashboard - Interactions Table Component** (Completed 2025-10-19)

Created `components/dashboard/interactions-table.tsx` (419 lines) with sortable table, modal details view. See HISTORY.md.

---

## **Task 24: Dashboard - Pattern Library Component**

**Description**: Create component showing discovered query patterns.

**Deliverables**:
- [ ] Create `components/dashboard/pattern-library.tsx`
- [ ] Query Neo4j for `:QueryPattern` nodes via MCP
- [ ] Display for each pattern:
  - Pattern name
  - Description
  - Usage count
  - Success rate (%)
- [ ] Sort by usage count descending
- [ ] Use shadcn/ui Card component
- [ ] Add JSDoc comments
- [ ] Run `pnpm tsc --noEmit`

**Dependencies**: Task 4 (Supabase or Neo4j query)

**Definition of Done**:
- Patterns displayed in cards
- Data fetched from Neo4j
- Sorted by usage
- TypeScript compiles

---

## **Task 25: Dashboard Page - Main Page**

**Description**: Create dashboard page assembling all dashboard components.

**Deliverables**:
- [ ] Create `app/dashboard/page.tsx`
- [ ] Import and render:
  - Learning Curve chart
  - Stats Cards
  - Interactions Table
  - Pattern Library
- [ ] Add "Back to Chat" button in header
- [ ] Add auto-refresh every 30s (optional, can use manual refresh button)
- [ ] Style with Tailwind
- [ ] Add JSDoc comments
- [ ] Run `pnpm tsc --noEmit`

**Dependencies**: Task 21-24 (all dashboard components)

**Definition of Done**:
- Dashboard page renders
- All components functional
- Back button navigates to chat
- Data refreshes (manual or auto)
- TypeScript compiles

---

## **Task 26: Neo4j Schema Setup - Vector Index**

**Description**: Create vector index in Neo4j for memory embeddings.

**Deliverables**:
- [ ] Create `docs/neo4j-setup.md` with Cypher commands
- [ ] Document vector index creation:
  ```cypher
  CREATE VECTOR INDEX memory_embeddings IF NOT EXISTS
  FOR (m:Memory)
  ON m.embedding
  OPTIONS {
    indexConfig: {
      `vector.dimensions`: 1536,
      `vector.similarity_function`: 'cosine'
    }
  }
  ```
- [ ] Document property indexes:
  - `Memory.created_at`
  - `Memory.overall_score`
  - `QueryPattern.name` (unique constraint)
- [ ] Test index creation commands in Neo4j Browser

**Dependencies**: None (can be done anytime, but needed before Task 6 is used)

**Definition of Done**:
- Documentation created with all Cypher commands
- Commands tested and verified working
- Index creation instructions clear

---

## **Task 27: Supabase Schema Setup - Table Creation**

**Description**: Run SQL migrations to create all Supabase tables.

**Deliverables**:
- [ ] Create `docs/supabase-setup.md` with SQL commands
- [ ] Run SQL from Task 4 schema definitions to create:
  - `interactions` table with indexes
  - `feedback` table with foreign key
  - `evaluation_metrics` table with indexes
  - `memory_stats` table (single row)
- [ ] Verify tables created in Supabase dashboard
- [ ] Test insert/select queries

**Dependencies**: Task 4 (schema definitions)

**Definition of Done**:
- All tables exist in Supabase
- Indexes created
- Foreign keys enforced
- Documentation complete

---

## **Task 28: Environment Variables Setup**

**Description**: Populate `.env.local` with actual values for local development.

**Deliverables**:
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add OpenAI API key
- [ ] Add Neo4j MCP URL (already exists)
- [ ] Add Supabase URL and keys
- [ ] Add Inngest event key and signing key
- [ ] Verify all services connect correctly
- [ ] DO NOT commit `.env.local`

**Dependencies**: Task 27 (Supabase set up), Task 26 (Neo4j set up)

**Definition of Done**:
- All environment variables populated
- Services connect successfully
- `.env.local` in `.gitignore`

---

## **Task 29: Integration Testing - End-to-End Flow**

**Description**: Test complete flow from home → chat → dashboard with real interactions.

**Deliverables**:
- [ ] Start dev server: `pnpm dev`
- [ ] Test home page:
  - Select model
  - Set parameters
  - Navigate to chat
- [ ] Test chat:
  - Send query
  - Verify streaming works
  - Check evidence panel
  - Check agent trace
  - Provide feedback
- [ ] Verify async pipeline:
  - Check Inngest dashboard for job completion
  - Verify Supabase tables have data
  - Verify Neo4j has Memory nodes
- [ ] Test dashboard:
  - Verify learning curve shows data
  - Check stats cards
  - View interactions table
  - See pattern library
- [ ] Run 5 test queries and document results

**Dependencies**: All previous tasks complete

**Definition of Done**:
- Complete flow functional from home → chat → dashboard
- Async agents processing interactions
- Data visible in dashboard
- No errors in console
- 5 test queries completed successfully

---

## **Task 30: Test Queries Creation**

**Description**: Create 20 curated test queries for acceptance testing.

**Deliverables**:
- [ ] Create `docs/test-queries.md`
- [ ] Document 20 queries covering:
  - Basic retrieval (5 queries)
  - Cross-year comparison (5 queries)
  - Edge cases (5 queries)
  - Complex multi-turn (5 queries)
- [ ] For each query, document:
  - Expected behavior
  - Success criteria
  - Minimum confidence score
- [ ] Reference FUNCTIONAL.md section 7.1 for examples

**Dependencies**: Task 29 (system functional)

**Definition of Done**:
- 20 queries documented
- Expected outcomes clear
- Covers diverse scenarios
- Can be used for acceptance testing

---

## **Task 31: Type Check & Cleanup**

**Description**: Final type check, lint, and code cleanup before demo.

**Deliverables**:
- [ ] Run `pnpm tsc --noEmit` and fix all errors
- [ ] Review all JSDoc comments for completeness
- [ ] Check all imports use correct paths (@/ for absolute)
- [ ] Verify naming conventions followed (see CLAUDE.md)
- [ ] Remove any unused imports
- [ ] Remove console.logs (except intentional logging)
- [ ] Verify all error handling in place

**Dependencies**: Task 30 (all features complete)

**Definition of Done**:
- TypeScript compiles with zero errors
- All functions documented
- Code follows CLAUDE.md standards
- No unused code

---

## **Task 32: Documentation - README Update**

**Description**: Update README.md with setup and usage instructions.

**Deliverables**:
- [ ] Update `README.md` with:
  - Project overview
  - Prerequisites
  - Installation steps
  - Environment setup
  - Running locally
  - Running Inngest dev server
  - Testing instructions
  - Architecture overview (link to ARCHITECTURE.md)
- [ ] Add screenshots of home, chat, dashboard
- [ ] Document common issues and solutions

**Dependencies**: Task 31 (system complete)

**Definition of Done**:
- README complete and accurate
- Developer can follow to set up project
- Screenshots included
- Links to other docs correct

---

## **Task 33: Pre-Demo Validation**

**Description**: Run all 20 test queries and validate acceptance criteria before stakeholder demo.

**Deliverables**:
- [ ] Run all 20 test queries from `docs/test-queries.md`
- [ ] Verify ≥85% success rate (at least 17/20 queries successful)
- [ ] Check learning improvement:
  - First 10 interactions: baseline score
  - Last 10 interactions: improved score
  - Target: ≥20% improvement
- [ ] Validate dashboard metrics accuracy
- [ ] Test feedback controls on all message types
- [ ] Verify p95 latency ≤4s (use Vercel Analytics or console logs)
- [ ] Check Inngest dashboard for job health
- [ ] Document any issues found

**Dependencies**: Task 30 (test queries), Task 32 (docs)

**Definition of Done**:
- All 20 queries tested
- ≥85% success rate achieved
- Learning improvement demonstrated
- Dashboard metrics accurate
- Performance targets met
- Issues documented (if any)

---

## **Task 34: Demo Preparation**

**Description**: Prepare stakeholder demo following FUNCTIONAL.md section 8.1 demo script.

**Deliverables**:
- [ ] Practice demo flow:
  1. Show home page, explain configuration
  2. Start chat, ask fractions query
  3. Highlight streaming, evidence, trace, confidence
  4. Provide feedback
  5. Show dashboard with stats updating
  6. Ask similar question to show learning
  7. Show dashboard learning curve with improvement
- [ ] Prepare talking points for each section
- [ ] Take screenshots for backup slides
- [ ] Test on clean browser (clear sessionStorage)
- [ ] Verify Inngest dashboard accessible for live view
- [ ] Prepare fallback if live demo fails

**Dependencies**: Task 33 (validation complete)

**Definition of Done**:
- Demo script rehearsed
- All key features demonstrated
- Talking points prepared
- Fallback plan ready
- Demo runs smoothly in practice

---

## **Notes**

### Task Dependencies Summary

- Tasks 1-2: Foundation (cleanup, dependencies)
- Tasks 3-8: Core services and prompts
- Tasks 9-12: Async agents (Inngest)
- Task 13: Query Agent API
- Tasks 14-20: Frontend (home, chat pages)
- Tasks 21-25: Dashboard
- Tasks 26-28: Database setup
- Tasks 29-34: Testing and demo prep

### Parallel Work Opportunities

After Task 13 (Query Agent) is complete, these can be done in parallel:
- Tasks 14-20 (Frontend) - UI work
- Tasks 21-25 (Dashboard) - Analytics UI
- Tasks 26-28 (Database setup) - Can be done earlier if DB access available

### Estimated Timeline (Phase 1 MVP)

- Week 1: Tasks 1-13 (Foundation, agents, API)
- Week 2: Tasks 14-20 (Frontend)
- Week 3: Tasks 21-25 (Dashboard)
- Week 4: Tasks 26-33 (Setup, testing, validation)
- Week 5-6: Task 34 (Demo prep) + Buffer for issues

**Total**: 4-6 weeks to MVP demo-ready state

---

**Document Status**: Ready for Implementation
**Last Updated**: 2025-10-17
**Phase**: 1 (MVP)

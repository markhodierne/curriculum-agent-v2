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

## ✅ **Task 24: Dashboard - Pattern Library Component** (Completed 2025-10-19)

**Description**: Create component showing discovered query patterns.

**Deliverables**:
- [x] Create `components/dashboard/pattern-library.tsx` (287 lines)
- [x] Query Neo4j for `:QueryPattern` nodes via MCP
- [x] Display for each pattern: name, description, usage count, success rate (%)
- [x] Sort by usage count descending (in Cypher query)
- [x] Use Tremor Card component (consistent with other dashboard components)
- [x] Add JSDoc comments
- [x] Run `pnpm tsc --noEmit` ✓

**Note**: Used Tremor Card instead of shadcn/ui Card for consistency with stats-cards.tsx and learning-curve.tsx.

**Definition of Done**: ✓ All criteria met

---

## ✅ **Task 25: Dashboard Page - Main Page** (Completed 2025-10-19)

Created `app/dashboard/page.tsx` (146 lines) with all dashboard components, manual refresh button, back navigation. See HISTORY.md.

---

## ✅ **Task 26: Neo4j Schema Setup - Vector Index** (Completed 2025-10-19)

Created `docs/neo4j-setup.md` (394 lines) with complete Neo4j setup documentation: vector index for memory embeddings (1536-dim, cosine), property indexes (created_at, overall_score), unique constraint (QueryPattern.name), verification queries, troubleshooting guide. See HISTORY.md.

---

## ✅ **Task 27: Supabase Schema Setup - Table Creation** (Completed 2025-10-19)

Created `docs/supabase-setup.md` (478 lines) with complete SQL migration, verification queries, 8 test queries, integration guide, troubleshooting. User ran SQL in Supabase to create 4 tables with 9+ indexes, 2 foreign keys. See HISTORY.md.

---

## ✅ **Task 28: Environment Variables Setup** (Completed 2025-10-19)

Populated `.env.local` with all 7 required environment variables: OpenAI API key, Neo4j MCP URL, Supabase credentials (URL, anon key, service role key), Inngest keys (event key, signing key). All services ready for local development. See HISTORY.md.

---

## ✅ **Task 29: Integration Testing - End-to-End Flow** (Completed 2025-10-20)

**Description**: Test complete flow from home → chat → dashboard with real interactions.

**Deliverables**:
- [x] Start dev server: `pnpm dev`
- [x] Test home page:
  - Select model
  - Set parameters
  - Navigate to chat
- [x] Test chat:
  - Send query
  - Verify streaming works
  - Check evidence panel
  - Check agent trace
  - Provide feedback
- [x] Verify async pipeline:
  - Check Inngest dashboard for job completion
  - Verify Supabase tables have data
  - Verify Neo4j has Memory nodes
- [x] Test dashboard:
  - Verify learning curve shows data
  - Check stats cards
  - View interactions table
  - See pattern library
- [x] Run 5 test queries and document results

**Dependencies**: All previous tasks complete

**Definition of Done**: ✓ All criteria met

**Issues Resolved**:
- Fixed MCP integration (use tools directly, AI SDK v5 handles schema)
- Fixed multi-step execution (`stopWhen: stepCountIs(10)`)
- Fixed message rendering (proper AI SDK v5 streaming pattern)
- Fixed feedback integration (`messageMetadata` callback)
- Added Dashboard navigation button to chat page

**Known Limitations**: Database returning empty results (curriculum data needs verification)

---

## ✅ **Task 30: Test Queries Creation** (Completed 2025-10-20)

Created `docs/test-queries.md` (557 lines) with 20 curated test queries for acceptance testing. See HISTORY.md.

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

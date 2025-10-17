# FUNCTIONAL.md

**Oak Curriculum Agent - Phase 1 MVP**
Functional Requirements Specification

Version: 1.0
Scope: Phase 1 Only (4-6 week MVP)
See: `ARCHITECTURE.md` for technical implementation, `BRIEF.md` for full project vision

---

## 1. Project Overview

### 1.1 Purpose
Build a self-learning curriculum chat agent that demonstrates **observable improvement within 50 conversations** through a three-agent learning loop: Query → Reflection → Learning.

### 1.2 Core Innovation
The agent learns from every interaction by:
1. Answering questions using the Neo4j curriculum knowledge graph
2. Evaluating its own performance (async, background)
3. Storing successful patterns as memories for future use
4. Retrieving similar past interactions to improve current responses

### 1.3 Success Criteria (Phase 1 MVP)
- ≥20% improvement in evaluation scores (interactions 1-10 vs 41-50)
- ≥95% grounding rate (claims with valid citations)
- ≥85% Cypher query success rate
- ≤4s p95 user-facing response latency
- ≤30s async processing (reflection + learning)

---

## 2. Phase 1 Scope

### 2.1 In Scope
- Home page with model selection
- Chat interface with streaming responses
- Three-agent learning loop (Query, Reflection, Learning)
- Memory system in Neo4j with vector search
- Dashboard showing learning metrics
- User feedback mechanism (👍/👎, grounded checkbox)
- Confidence-scored citations for all claims
- Agent trace visibility (collapsible)

### 2.2 Out of Scope (Future Phases)
- Multi-stage retrieval optimization (Phase 2)
- Query cache (Phase 2)
- Self-healing Cypher queries (Phase 2)
- Prerequisite path visualization (Phase 3)
- Pedagogy-aware answers (Phase 3)
- PDF ingestion (Phase 4)
- Multi-source data layers (Phase 4)
- Production monitoring tools (Phase 5)

---

## 3. User Flows

### 3.1 First-Time User Experience

**Home Page (`/`)**
1. User sees application title: "Oak Curriculum Agent - Self-Learning AI Assistant"
2. Description explains:
   - Agent answers curriculum questions using Neo4j knowledge graph
   - Learns from every interaction to improve over time
   - Grounds all answers in graph evidence with citations
3. Configuration panel:
   - **Model selector**: Dropdown with GPT-4o (default), gpt-4o-mini, GPT-5 (experimental)
   - **Advanced settings** (collapsible): Temperature slider (0-1, default 0.3), Max tokens (default 2000)
4. "Start Chat" button → navigates to `/chat`

**Chat Page (`/chat`)**
1. Clean interface with message history area and input field
2. User types question: "What fractions do Year 3 students learn?"
3. Presses Send or Enter
4. Agent streams response in real-time with:
   - Text appearing incrementally
   - Tool call indicators: "🔧 Querying curriculum graph..."
5. Response includes:
   - Answer text
   - Collapsible Evidence panel with citations
   - Collapsible Agent Trace panel
   - Feedback controls
6. User can continue conversation with follow-up questions

### 3.2 Chat Interaction Details

**Message Flow**
```
User: What fractions do Year 3 students learn?
  ↓
[🔧 Querying curriculum graph...]
  ↓
Assistant: Year 3 students learn the following fraction concepts:

1. Recognizing unit fractions (1/2, 1/3, 1/4) [Y3-F-001]★★★★★
2. Finding fractions of amounts [Y3-F-002]★★★★☆
3. Comparing fractions with same denominator [Y3-F-003]★★★★★

[▼ Evidence (3 citations) - Overall confidence: 0.92]
[▼ Agent Trace (4 steps)]
[👍] [👎] [☑ Well grounded?] [💬 Add note]
```

**Evidence Panel (Expanded)**
```
▼ Evidence (3 citations) - Overall confidence: 0.92

Citation 1: [Y3-F-001] Objective Node ★★★★★ 0.97
"Recognise, find and write fractions of a discrete set of objects"
Confidence: Direct graph match

Citation 2: [Y3-F-002] Objective Node ★★★★☆ 0.85
"Recognise and use fractions as numbers"
Confidence: Inferred from relationship

Citation 3: [Y3-F-003] Objective Node ★★★★★ 0.94
"Compare and order unit fractions"
Confidence: Direct graph match

[Click any citation to view full node details]
```

**Agent Trace Panel (Expanded)**
```
▼ Agent Trace (4 steps)

Step 1: Memory Retrieval
Retrieved 3 similar high-quality memories (score >0.75)
- "Year 5 fractions progression" (similarity: 0.82)
- "Understanding unit fractions" (similarity: 0.79)
- "Fraction objectives by year" (similarity: 0.76)

Step 2: Cypher Generation
Generated query using pattern: "objectives_by_year_and_strand"
MATCH (o:Objective {year: 3})-[:PART_OF]->(s:Strand)
WHERE s.name CONTAINS 'Fraction'
RETURN o

Step 3: Graph Query Execution
Found 12 objectives in 0.3s

Step 4: Answer Synthesis
Generated answer with 3 claims, all grounded in graph results
Overall confidence: 0.92
```

**Feedback Controls**
- **👍 / 👎**: Simple reaction (stored immediately)
- **☑ Well grounded?**: Checkbox for grounding quality
- **💬 Add note**: Optional textarea appears on click
  - Placeholder: "What could be improved?"
  - Character limit: 500
  - Submit saves to Supabase

### 3.3 Dashboard Experience

**Dashboard Page (`/dashboard`)**

**Layout**
```
┌─────────────────────────────────────────────────────┐
│ Learning Analytics Dashboard            [Back]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Learning Curve                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  [Line chart showing improvement]         │    │
│  │  Interaction 1-10: 0.67 avg               │    │
│  │  Interaction 41-50: 0.85 avg (+27%)       │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Stats Cards                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 50       │ │ 0.82     │ │ 47       │          │
│  │ Total    │ │ Avg      │ │ Memories │          │
│  │ Queries  │ │ Confidence│ │ Created  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                     │
│  Recent Interactions                                │
│  ┌───────────────────────────────────────────┐    │
│  │ Query         | Conf | Ground | Score | Time│   │
│  │ What fractions| 0.92 | 0.98   | 0.87  | 2.1s│   │
│  │ Compare Y3... | 0.85 | 0.95   | 0.82  | 3.4s│   │
│  │ ...           | ...  | ...    | ...   | ... │   │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Pattern Library                                    │
│  ┌───────────────────────────────────────────┐    │
│  │ objectives_by_year: 12 uses, 91% success │    │
│  │ compare_year_groups: 5 uses, 80% success  │    │
│  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Interactions**
- Charts are interactive (hover for details)
- Table rows clickable → view full interaction details in modal
- Refresh button to reload metrics
- Date range filter (stretch goal)

---

## 4. Feature Specifications

### 4.1 Home Page

**Components**
- Header with app title and description
- Model selector (dropdown)
- Advanced settings panel (collapsible)
- Start Chat button

**Model Selector Options**
- GPT-4o (Recommended - Fast, high quality)
- gpt-4o-mini (Fastest, cost-effective)
- GPT-5 (Experimental - if available)

**Advanced Settings**
- Temperature: 0-1 slider, default 0.3, increments of 0.1
- Max tokens: Number input, default 2000, range 500-4000
- Settings persist in session storage

**Behavior**
- Start Chat button saves settings → navigates to `/chat`
- Back button from chat returns to home page

### 4.2 Chat Interface

**Core Features**

**A. Streaming Responses**
- Real-time token streaming using AI SDK `useChat` hook
- Loading indicator during processing
- Tool call status messages: "🔧 Querying curriculum graph..."
- Smooth scrolling to latest message

**B. Evidence Panel (Collapsible)**
- Default: Collapsed with summary "Evidence (3 citations) ★★★★☆ 0.87"
- Expanded: Shows all citations with:
  - Node ID (e.g., [Y3-F-001])
  - Node type (Objective, Strand, Concept)
  - Text snippet
  - Star rating (★★★★★)
  - Confidence score (0.00-1.00)
  - Confidence reason ("Direct graph match", "Inferred from relationship")
- Click citation → modal with full node properties

**C. Agent Trace Panel (Collapsible)**
- Default: Collapsed with summary "Agent Trace (4 steps)"
- Expanded: Shows reasoning steps:
  - Memory retrieval (count, similarity scores)
  - Cypher generation (query pattern used)
  - Graph query execution (result count, latency)
  - Answer synthesis (claim count, grounding rate)
- Useful for debugging and transparency

**D. Feedback Controls**
- Always visible below each assistant message
- 👍 / 👎 buttons (mutually exclusive, saves immediately)
- "Well grounded?" checkbox (independent, saves immediately)
- "Add note" button → reveals textarea
  - Placeholder: "What could be improved?"
  - Max 500 characters
  - Submit button saves to Supabase
  - Optional, not required

**E. Confidence Scoring**
- Each claim in answer has individual confidence score
- Star rating visualization:
  - ★★★★★ = 0.90-1.00 (Direct graph match)
  - ★★★★☆ = 0.75-0.89 (Inferred from traversal)
  - ★★★☆☆ = 0.60-0.74 (Synthesized from multiple nodes)
  - ★★☆☆☆ = 0.40-0.59 (Weak support)
  - ★☆☆☆☆ = 0.00-0.39 (No clear support)
- Overall confidence: Weighted average displayed prominently

**Message History**
- Scrollable area with all conversation messages
- User messages: Right-aligned, distinct styling
- Assistant messages: Left-aligned, includes all panels
- Timestamps (optional, stretch goal)
- Clear conversation button (stretch goal)

### 4.3 Dashboard

**Purpose**: Show stakeholders that learning is happening

**Components**

**A. Learning Curve Chart (Tremor line chart)**
- X-axis: Interaction number (1-50)
- Y-axis: Average evaluation score (0.0-1.0)
- Data points: Every interaction
- Trend line showing improvement
- Target line at 0.70
- Hover: Show exact score for interaction

**B. Stats Cards (3 cards)**
1. **Total Interactions**
   - Count of all queries processed
   - Icon: 💬
2. **Average Confidence**
   - Mean confidence score across all interactions
   - Icon: ⭐
3. **Memories Created**
   - Count of `:Memory` nodes in Neo4j
   - Icon: 🧠

**C. Recent Interactions Table**
- Last 20 interactions
- Columns:
  - Query (truncated to 50 chars)
  - Confidence (0.00-1.00)
  - Grounding (0.00-1.00)
  - Overall Score (0.00-1.00)
  - Latency (seconds)
  - Timestamp
- Sortable by any column
- Click row → modal with full interaction details

**D. Pattern Library**
- Lists discovered `:QueryPattern` nodes
- Shows for each pattern:
  - Pattern name (e.g., "objectives_by_year")
  - Description
  - Usage count
  - Success rate (%)
- Sorted by usage count descending

**Data Refresh**
- Dashboard queries Supabase on page load
- Manual refresh button
- Auto-refresh every 30s (optional)

### 4.4 Three-Agent System (User-Facing Behavior)

**Query Agent (Synchronous, User-Facing)**

**What the user sees:**
1. User sends message
2. Loading indicator appears
3. Tool call status: "🔧 Querying curriculum graph..."
4. Response streams in real-time
5. Evidence and trace panels appear when complete
6. Feedback controls enabled

**What happens internally:**
- Retrieves 3 similar memories from Neo4j (vector search)
- Injects memories as few-shot examples in system prompt
- Uses AI SDK `streamText()` with `read_neo4j_cypher` tool
- Agent can call tool multiple times to explore graph
- Generates answer with claim-level confidence scores
- Verifies all claims have citations
- Emits `interaction.complete` event (non-blocking)
- Returns stream to user

**Performance targets:**
- p50 latency: ≤2s
- p95 latency: ≤4s
- Cypher success rate: ≥85%

**Reflection Agent (Async, Background)**

**What the user sees:**
- Nothing immediately (async processing)
- Eventually: Evaluation scores appear in dashboard
- Eventually: Low-quality interactions may be flagged

**What happens internally:**
- Triggered by `interaction.complete` event
- Evaluates interaction on 5-dimension rubric:
  - Grounding (30%): Claims supported by evidence?
  - Accuracy (30%): Information correct per curriculum?
  - Completeness (20%): Fully answers question?
  - Pedagogy (10%): Appropriate for curriculum context?
  - Clarity (10%): Well-explained?
- Uses AI SDK `generateObject()` for structured output
- Produces JSON with scores (0-1) + qualitative feedback
- Emits `reflection.complete` event
- Stores evaluation in Supabase

**Performance target:**
- Complete within 30s of interaction

**Learning Agent (Async, Background)**

**What the user sees:**
- Nothing immediately (async processing)
- Eventually: Similar queries get better answers
- Eventually: New patterns appear in Pattern Library dashboard

**What happens internally:**
- Triggered by `reflection.complete` event
- Creates `:Memory` node in Neo4j:
  - Query text + embedding
  - Answer text
  - Cypher queries used
  - All evaluation scores
  - Timestamp
  - User feedback (if any)
- Links memory to evidence: `(:Memory)-[:USED_EVIDENCE]->(curriculum_node)`
- If score > 0.8: Extracts `:QueryPattern` node
- Finds similar memories: `(:Memory)-[:SIMILAR_TO]->(:Memory)`
- Every 20 memories: Consolidates (clusters, prunes low-quality)
- No LLM call needed (data operations only)

**Performance target:**
- Complete within 30s of reflection

**Impact on future interactions:**
- Next time similar query → Query Agent retrieves this memory
- Memory used as few-shot example → better Cypher generation
- This IS the learning mechanism

---

## 5. Data & Privacy

### 5.1 Data Stored

**Neo4j**
- Curriculum graph (existing, read-only from user perspective)
- `:Memory` nodes (interaction records with embeddings)
- `:QueryPattern` nodes (learned Cypher strategies)
- Relationships: `:USED_EVIDENCE`, `:APPLIED_PATTERN`, `:SIMILAR_TO`

**Supabase Postgres**
- Interaction logs (full audit trail)
- User feedback (thumbs, grounded checkbox, notes)
- Evaluation metrics (pre-aggregated for dashboard)
- Inngest job metadata (automatic)

### 5.2 User Privacy

**Phase 1 MVP (Development Mode)**
- No user authentication required
- No personal data collected
- All interactions anonymous
- No cookies/tracking

**Future Phases**
- May add user accounts (optional)
- Would add privacy policy
- GDPR compliance if needed

---

## 6. Error Handling (User-Facing)

### 6.1 Graceful Failures

**Cypher Query Fails**
- User sees: "I couldn't find that information in the curriculum graph. Could you rephrase your question?"
- NOT: Technical error messages or stack traces

**MCP Connection Fails**
- User sees: "I'm having trouble accessing the curriculum data right now. Please try again in a moment."
- Background: Error logged to Supabase, alerts triggered

**Async Processing Fails**
- User sees: Nothing (interaction completes normally)
- Background: Inngest retries 3 times, then moves to dead letter queue
- Impact: That specific interaction won't create memory, but chat continues

**Invalid Input**
- Empty message: Send button disabled
- Very long message (>4000 chars): Warning shown

### 6.2 User Feedback for Errors

- Never show raw error messages
- Never expose technical details
- Always provide actionable guidance
- Log everything for debugging

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load: ≤2s
- First response token: ≤1s
- Full response (p95): ≤4s
- Dashboard load: ≤3s

### 7.2 Reliability
- Uptime: Best effort for MVP (no SLA)
- Error recovery: Automatic retries (Inngest)
- Data persistence: All interactions logged

### 7.3 Scalability
- Phase 1 target: 100 interactions total (demo purposes)
- Concurrent users: 1-5 (stakeholder demos)
- Future scaling addressed in Phase 5

### 7.4 Accessibility
- Keyboard navigation (tab through controls)
- ARIA labels for screen readers
- Sufficient color contrast
- Responsive design (desktop + tablet minimum)

### 7.5 Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- No IE11 support required

---

## 8. Success Demonstration

### 8.1 Week 4-6 Demo Script

**Stakeholder Demo Flow**
1. Show home page, explain configuration
2. Start chat, ask: "What fractions do Year 3 students learn?"
3. Highlight:
   - Streaming response
   - Evidence panel with citations
   - Agent trace showing reasoning
   - Confidence scores
4. Provide feedback: 👍 + "Well grounded"
5. Show dashboard:
   - Stats cards update in real-time
   - Memory created in background
6. Ask similar question: "What about Year 5 fractions?"
7. Show agent trace:
   - Retrieved previous Year 3 memory
   - Better response based on learned pattern
8. Show dashboard learning curve:
   - First 10 interactions: ~0.67 avg
   - Last 10 interactions: ~0.85 avg
   - 27% improvement demonstrated

**Key Message**: "This agent gets smarter every time you use it."

### 8.2 Acceptance Criteria Validation

Before demo, validate:
- [ ] All 20 test queries succeed (≥85% success rate)
- [ ] All answers include confidence scores + citations
- [ ] Memory created for every interaction (check Neo4j)
- [ ] Reflection completes within 30s (check Inngest dashboard)
- [ ] Learning improvement visible in dashboard (≥20%)
- [ ] Dashboard loads without errors
- [ ] Feedback controls functional
- [ ] p95 latency ≤4s (check logs)

---

## 9. Future Enhancements (Post-Phase 1)

Deferred to later phases:
- Multi-stage memory retrieval (Phase 2)
- Semantic query cache (Phase 2)
- Self-healing Cypher queries (Phase 2)
- Prerequisite path visualization (Phase 3)
- Audience detection (student vs teacher) (Phase 3)
- Misconception detection (Phase 3)
- PDF document ingestion (Phase 4)
- Multi-source data layers (Phase 4)
- Advanced monitoring dashboard (Phase 5)
- Rate limiting (Phase 5)
- Automated test suite (Phase 5)

See `BRIEF.md` sections 5-8 for full roadmap.

---

**Document Status**: Ready for Development
**Last Updated**: 2025-10-17
**Next Review**: After Phase 1 completion

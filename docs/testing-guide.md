# Step-by-Step Testing Guide
**Task 33: Pre-Demo Validation**

Follow this guide to test all system functionality. Record results on paper, then transfer to `validation-report.md`.

---

## Pre-Testing Setup

### Step 1: Start Services
```bash
# Terminal 1: Start Next.js
cd /Users/markhodierne/projects-2/curriculum-agent-v2
pnpm dev

# Terminal 2: Start Inngest
npx inngest-cli@latest dev
```

✅ Verify both running with no errors

---

### Step 2: Check Database Baseline

**Neo4j** - Open Neo4j Browser and run:
```cypher
MATCH (m:Memory) RETURN count(m) as total
```
📝 Record baseline: **_____ Memory nodes**

**Supabase** - Go to SQL Editor and run:
```sql
SELECT COUNT(*) FROM interactions;
SELECT COUNT(*) FROM evaluation_metrics;
```
📝 Record baseline: **_____ interactions, _____ evaluations**

---

### Step 3: Open Testing Tabs
- Tab 1: http://localhost:3000 (Home page)
- Tab 2: http://localhost:3000/dashboard (Dashboard)
- Tab 3: Neo4j Browser
- Tab 4: Supabase Dashboard
- Tab 5: Inngest Dashboard (https://app.inngest.com or local)

---

## Phase 1: Basic Retrieval Queries (5 queries)

### Query 1.1: "What fractions do Year 3 students learn?"

**Execute**:
1. Start at home page (http://localhost:3000)
2. Leave model as **GPT-4o** (default)
3. Click "Start Chat"
4. Type query: **"What fractions do Year 3 students learn?"**
5. Press Send
6. ⏱️ Start timer when you press Send

**Observe**:
- [ ] Response starts streaming within 1-2 seconds
- [ ] Tool indicator appears: "🔧 Querying curriculum graph..."
- [ ] Answer completes
- [ ] ⏱️ Record total time: **_____ ms** (check browser console or Supabase later)

**Check Evidence Panel**:
- [ ] Click to expand "Evidence (____ citations)"
- [ ] Overall confidence shown (e.g., 0.92)
- [ ] Star rating shown (e.g., ★★★★★)
- [ ] Each citation shows:
  - Node ID (e.g., [Y3-F-001])
  - Node type (e.g., Objective)
  - Text snippet
  - Individual confidence (e.g., 0.97)
  - Reason (e.g., "Direct graph match")

📝 Record:
- Confidence: **_____**
- Citation count: **_____**
- Answer quality: **Good / Acceptable / Poor**

**Check Agent Trace Panel**:
- [ ] Click to expand "Agent Trace (____ steps)"
- [ ] Step 1: Memory Retrieval (shows count of similar memories)
- [ ] Step 2: Cypher Generation (shows query)
- [ ] Step 3: Execution (shows result count)
- [ ] Step 4: Synthesis

📝 Record:
- Cypher query visible: **✅/❌**
- Step count: **_____**

**Test Feedback Controls**:
- [ ] Click 👍 button → turns active/blue
- [ ] Click "Well grounded?" checkbox → checks
- [ ] Click "Add note" → textarea appears
- [ ] Type: "Test note for Query 1.1"
- [ ] Submit note

📝 Record: **All controls working: ✅/❌**

**Verify Database Updates** (wait 60 seconds for async agents):

**Supabase**:
```sql
SELECT * FROM interactions ORDER BY created_at DESC LIMIT 1;
```
- [ ] New row exists
- [ ] `user_query` = "What fractions do Year 3 students learn?"
- [ ] `confidence_overall` populated
- [ ] `latency_ms` populated
- [ ] `cypher_queries` (JSONB) populated

```sql
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 1;
```
- [ ] New row exists
- [ ] `thumbs_up` = true
- [ ] `well_grounded` = true
- [ ] `note` = "Test note for Query 1.1"

**Wait 60 seconds**, then check:
```sql
SELECT * FROM evaluation_metrics ORDER BY created_at DESC LIMIT 1;
```
- [ ] New row exists
- [ ] All 5 scores populated (grounding, accuracy, completeness, pedagogy, clarity)
- [ ] `overall_score` calculated
- [ ] `evaluator_notes` populated (JSON string)

📝 Record overall_score: **_____**

**Neo4j**:
```cypher
MATCH (m:Memory)
WHERE m.user_query CONTAINS "Year 3" AND m.user_query CONTAINS "fractions"
RETURN m
ORDER BY m.created_at DESC
LIMIT 1
```
- [ ] New Memory node exists
- [ ] Has `embedding` property (array of 1536 floats)
- [ ] Has all evaluation scores
- [ ] `overall_score` matches Supabase

```cypher
MATCH (m:Memory)-[r:USED_EVIDENCE]->(n)
WHERE m.user_query CONTAINS "Year 3" AND m.user_query CONTAINS "fractions"
RETURN count(r) as evidence_count
```
📝 Record evidence links: **_____**

**Inngest Dashboard**:
- [ ] Check Events tab: 1 new `interaction.complete` event
- [ ] Check Functions → `reflection-agent`: 1 new successful run
- [ ] Check Functions → `learning-agent`: 1 new successful run
- [ ] Total run time < 30 seconds

📝 Record: **Async pipeline working: ✅/❌**

**Result**: ✅ PASS / ❌ FAIL

---

### Query 1.2: "What topics are covered in the Year 5 Multiplication and Division strand?"

**Execute** (same conversation):
1. Type query in same chat
2. Press Send
3. ⏱️ Record time

**Check**:
- [ ] Response received
- [ ] Evidence panel shows citations
- [ ] Confidence: **_____**

**Skip detailed checks** (already validated in 1.1), but record:
- Latency: **_____ ms**
- Answer quality: **Good / Acceptable / Poor**

**Quick DB check after 60s**:
```sql
SELECT COUNT(*) FROM interactions;  -- Should be 2 now
SELECT COUNT(*) FROM evaluation_metrics;  -- Should be 2 now
```

```cypher
MATCH (m:Memory) RETURN count(m)  -- Should be 2 now
```

**Result**: ✅ PASS / ❌ FAIL

---

### Query 1.3: "What does the 'Place Value' concept teach?"

**Execute**: Type query, record time
- Confidence: **_____**
- Latency: **_____ ms**
- Quality: **Good / Acceptable / Poor**

**Result**: ✅ PASS / ❌ FAIL

---

### Query 1.4: "What are the main strands in Year 2 Mathematics?"

**Execute**: Type query, record time
- Confidence: **_____**
- Latency: **_____ ms**
- Quality: **Good / Acceptable / Poor**

**Result**: ✅ PASS / ❌ FAIL

---

### Query 1.5: "What is objective Y6-M-123 about?"

**Execute**: Type query, record time
- Response: **Found / Not Found**
- No hallucination: **✅/❌**
- Confidence: **_____**
- Latency: **_____ ms**

**Result**: ✅ PASS / ❌ FAIL

---

## Phase 2: Cross-Year Comparison (5 queries)

**Start a NEW conversation** (refresh page or click "Back to Home" → "Start Chat")

### Query 2.1: "How do reading comprehension skills progress from Year 1 to Year 6?"
- Confidence: **_____**
- Shows progression: **✅/❌**
- Latency: **_____ ms**
- **Result**: ✅/❌

### Query 2.2: "What Year 4 multiplication objectives require Year 3 knowledge?"
- Confidence: **_____**
- Shows prerequisites: **✅/❌**
- Latency: **_____ ms**
- **Result**: ✅/❌

### Query 2.3: "What's the difference between Year 2 and Year 5 addition objectives?"
- Confidence: **_____**
- Shows differences: **✅/❌**
- Latency: **_____ ms**
- **Result**: ✅/❌

### Query 2.4: "When are students first introduced to algebra concepts?"
- Confidence: **_____**
- Identifies first year: **✅/❌**
- Latency: **_____ ms**
- **Result**: ✅/❌

### Query 2.5: "Which science objectives in Year 4 use mathematics skills?"
- Confidence: **_____**
- Cross-subject links: **✅/❌**
- Latency: **_____ ms**
- **Result**: ✅/❌

---

## Phase 3: Edge Cases (5 queries)

**Start a NEW conversation**

### Query 3.1: "What do Year 15 students study?"
- Response: States not in curriculum: **✅/❌**
- No hallucination: **✅/❌**
- Suggests valid years: **✅/❌**
- **Result**: ✅/❌

### Query 3.2: "What is 'division' in the curriculum?"
- Acknowledges ambiguity: **✅/❌**
- Provides multiple interpretations: **✅/❌**
- **Result**: ✅/❌

### Query 3.3: "Tell me about the curriculum."
- Provides overview from graph: **✅/❌**
- Suggests refinement: **✅/❌**
- No hallucination: **✅/❌**
- **Result**: ✅/❌

### Query 3.4: "What Art objectives are there for Year 9?"
- If exists: Shows objectives: **✅/❌**
- If not: States not available: **✅/❌**
- No hallucination: **✅/❌**
- **Result**: ✅/❌

### Query 3.5: "Yr3 maths plz thx"
- Interprets informal query: **✅/❌**
- Returns relevant results: **✅/❌**
- **Result**: ✅/❌

---

## Phase 4: Complex Multi-Turn (5 conversations)

### Query 4.1: Prerequisite Chain (3 turns)

**Start NEW conversation**

**Turn 1**: "What do Year 5 students learn about percentages?"
- Response received: **✅/❌**

**Turn 2** (same conversation): "What do they need to know before learning those?"
- Uses context from Turn 1: **✅/❌**
- Shows prerequisites: **✅/❌**

**Turn 3** (same conversation): "Which strand do those prerequisites belong to?"
- Uses context from Turn 2: **✅/❌**
- Shows strands: **✅/❌**

**Result**: ✅ PASS / ❌ FAIL (all 3 turns)

---

### Query 4.2: Progression Path (3 turns)

**Start NEW conversation**

**Turn 1**: "What fractions do Year 3 students learn?"
**Turn 2**: "What comes next in Year 4?"
**Turn 3**: "And in Year 5?"

- Context maintained across all 3: **✅/❌**
- Shows clear progression: **✅/❌**

**Result**: ✅/❌

---

### Query 4.3: Concept Deep Dive (3 turns)

**Start NEW conversation**

**Turn 1**: "What is place value?"
**Turn 2**: "Which objectives teach it?"
**Turn 3**: "Focus on Year 2 only."

- Context maintained: **✅/❌**
- Correctly filters to Year 2: **✅/❌**

**Result**: ✅/❌

---

### Query 4.4: Comparison Refinement (3 turns)

**Start NEW conversation**

**Turn 1**: "Compare Year 1 and Year 6 reading skills."
**Turn 2**: "What about the middle years?"
**Turn 3**: "Which year introduces inference skills?"

- Context maintained: **✅/❌**
- Semantic search works: **✅/❌**

**Result**: ✅/❌

---

### Query 4.5: Strand Exploration (3 turns)

**Start NEW conversation**

**Turn 1**: "What strands are in Year 4 Mathematics?"
**Turn 2**: "Tell me about the Geometry strand."
**Turn 3**: "What concepts do these objectives teach?"

- Context maintained: **✅/❌**
- Progressive refinement: **✅/❌**

**Result**: ✅/❌

---

## Phase 5: Dashboard Validation

Navigate to: http://localhost:3000/dashboard

### Learning Curve Chart
- [ ] Chart renders (Tremor LineChart)
- [ ] Data points visible
- [ ] Shows first 10 avg and last 10 avg (if 20+ interactions)
- [ ] Hover shows exact scores

📝 Record:
- Data points shown: **_____**
- Chart matches Supabase data: **✅/❌**

---

### Stats Cards

**Verify each card against database**:

**Card 1: Total Interactions**
```sql
SELECT COUNT(*) FROM interactions;
```
- DB count: **_____**
- Dashboard shows: **_____**
- Match: **✅/❌**

**Card 2: Average Confidence**
```sql
SELECT AVG(confidence_overall) FROM interactions WHERE confidence_overall IS NOT NULL;
```
- DB avg: **_____**
- Dashboard shows: **_____**
- Match: **✅/❌**

**Card 3: Memories Created**
```cypher
MATCH (m:Memory) RETURN count(m)
```
- Neo4j count: **_____**
- Dashboard shows: **_____**
- Match: **✅/❌**

---

### Interactions Table
- [ ] Shows last 20 interactions
- [ ] All columns visible (Query, Confidence, Grounding, Score, Latency, Time)
- [ ] Click column header → sorts
- [ ] Click row → modal opens
- [ ] Modal shows full details

📝 Record: **Table working: ✅/❌**

---

### Pattern Library
- [ ] Lists QueryPattern nodes
- [ ] Shows usage counts and success rates

```cypher
MATCH (p:QueryPattern)
RETURN p.name, p.success_count, p.failure_count
ORDER BY (p.success_count + p.failure_count) DESC
```
- Neo4j patterns: **_____**
- Dashboard shows: **_____**
- Match: **✅/❌**

---

### Refresh Button
- [ ] Click "Refresh" button
- [ ] All components reload
- [ ] No errors

---

## Phase 6: Performance Analysis

### Calculate Latencies

From your paper notes, list all 20 query latencies:

1. _____ ms
2. _____ ms
3. _____ ms
... (continue for all 20)

**Or query Supabase**:
```sql
SELECT latency_ms
FROM interactions
ORDER BY created_at ASC
LIMIT 20;
```

**Calculate**:
- Sort latencies ascending
- p50 (median): Value at position 10 = **_____ ms**
- p95: Value at position 19 = **_____ ms**
- Max: **_____ ms**
- Min: **_____ ms**

**Targets**:
- p50 ≤ 2000ms: **✅/❌**
- p95 ≤ 4000ms: **✅/❌**

---

## Phase 7: Learning Improvement

### Calculate Baseline (First 10)

```sql
SELECT overall_score
FROM evaluation_metrics
ORDER BY created_at ASC
LIMIT 10;
```

📝 Record scores:
1. _____
2. _____
... (10 total)

**Calculate average manually**: **_____**

---

### To Demonstrate 20% Improvement

You need **50 total interactions**. You currently have **20**.

**Options**:
1. Run 30 more queries (repeat with variations)
2. Use similar queries from `test-queries.md`
3. Generate new curriculum questions

**After reaching 50 interactions**:

```sql
SELECT overall_score
FROM evaluation_metrics
ORDER BY created_at ASC
LIMIT 10 OFFSET 40;  -- Gets interactions 41-50
```

📝 Record final 10 scores and calculate average: **_____**

**Improvement**:
```
((Final - Baseline) / Baseline) × 100%
```
= **_____%**

**Target**: ≥20%
**Result**: ✅/❌

---

## Phase 8: Inngest Health Check

Go to: https://app.inngest.com (or local Inngest dev UI)

### Reflection Agent
- Navigate to Functions → `reflection-agent`
- Check last 20 runs
- Success rate: **_____%**
- Average duration: **_____ seconds**
- Failures: **_____ (count)**

### Learning Agent
- Navigate to Functions → `learning-agent`
- Check last 20 runs
- Success rate: **_____%**
- Average duration: **_____ seconds**
- Failures: **_____ (count)**

### Event Flow
- Check Events → `interaction.complete`: Count = **_____**
- Check Events → `reflection.complete`: Count = **_____**
- Counts match interactions: **✅/❌**

---

## Final Checklist

### Acceptance Criteria
- [ ] Query success rate ≥ 85% (17/20)
- [ ] All database ops working (Neo4j + Supabase)
- [ ] All feedback controls functional
- [ ] Dashboard metrics accurate
- [ ] p95 latency ≤ 4s
- [ ] Async agents ≥ 95% success
- [ ] Learning improvement ≥ 20% (if 50 interactions completed)

### Overall Result
**Total Passed**: _____/20 queries
**Success Rate**: _____%
**System Status**: ✅ READY / ⚠️ ISSUES / ❌ NOT READY

---

## Transfer Results to Report

Now fill in `validation-report.md` with your findings!

**Next**: Task 34 - Demo Preparation 🎉

# Test Queries - Phase 1 MVP Acceptance Testing

**Purpose**: 20 curated queries for validating the Oak Curriculum Agent's performance and learning improvement.

**Success Criteria** (FUNCTIONAL.md section 8.2):
- ≥85% success rate (at least 17/20 queries successful)
- ≥20% improvement in evaluation scores (interactions 1-10 vs 41-50)
- All answers grounded in Neo4j graph data

**Testing Protocol**:
1. Run queries in order (1-20)
2. For each query, verify:
   - Agent provides an answer grounded in graph data
   - Citations reference actual curriculum nodes
   - Confidence score meets minimum threshold
   - Response meets success criteria
3. Document failures and analyze patterns
4. Compare first 10 vs last 10 for learning improvement

---

## Category 1: Basic Retrieval (5 queries)

### Query 1.1: Year-Specific Objectives

**User Query**: "What fractions do Year 3 students learn?"

**Expected Behavior**:
- Execute Cypher query to find `:Objective` nodes where `year = 3` and subject/strand relates to fractions
- Return list of objectives with titles/descriptions
- Cite specific objective node IDs

**Success Criteria**:
- Returns 3-8 fraction objectives for Year 3
- Each objective has citation [Node-ID]
- Explains what each objective covers (unit fractions, fractions of amounts, etc.)

**Minimum Confidence**: 0.90
- Direct graph match (year + subject filters)

---

### Query 1.2: Strand Contents

**User Query**: "What topics are covered in the Year 5 Multiplication and Division strand?"

**Expected Behavior**:
- Query `:Strand` node matching "Multiplication and Division"
- Traverse `(:Objective)-[:PART_OF]->(:Strand)` relationship
- Filter by `year = 5`
- List all objectives in that strand

**Success Criteria**:
- Identifies the correct strand
- Returns all objectives in that strand for Year 5
- Citations for strand and objectives

**Minimum Confidence**: 0.85
- Requires relationship traversal

---

### Query 1.3: Concept Explanation

**User Query**: "What does the 'Place Value' concept teach?"

**Expected Behavior**:
- Find `:Concept` node with name matching "Place Value"
- Return description property
- May traverse `(:Objective)-[:TEACHES]->(:Concept)` to show which objectives teach this

**Success Criteria**:
- Explains place value concept from graph data
- Optionally lists objectives that teach this concept
- Citations for concept node

**Minimum Confidence**: 0.90
- Direct concept lookup

---

### Query 1.4: Subject Overview

**User Query**: "What are the main strands in Year 2 Mathematics?"

**Expected Behavior**:
- Query `:Strand` nodes where `subject = 'Mathematics'`
- Filter objectives by `year = 2`
- Group by strand and list unique strand names

**Success Criteria**:
- Returns 6-10 mathematics strands (Number, Addition/Subtraction, Geometry, etc.)
- Brief description of each strand
- Citations for strand nodes

**Minimum Confidence**: 0.85
- Requires grouping/aggregation

---

### Query 1.5: Objective Code Lookup

**User Query**: "What is objective Y6-M-123 about?"

**Expected Behavior**:
- Direct lookup of `:Objective` node by `code` property
- Return title, description, year, subject

**Success Criteria**:
- If code exists: Returns full objective details
- If code doesn't exist: Clearly states objective not found
- Citation for objective node (if found)

**Minimum Confidence**: 0.95 (if found) or 0.90 (if not found)
- Direct property match

---

## Category 2: Cross-Year Comparison (5 queries)

### Query 2.1: Progression Across Years

**User Query**: "How do reading comprehension skills progress from Year 1 to Year 6?"

**Expected Behavior**:
- Query `:Objective` nodes in English/Reading strand for years 1-6
- Identify progression patterns (simple to complex)
- Compare objectives across year groups

**Success Criteria**:
- Shows objectives for each year (1-6)
- Highlights increasing complexity (decoding → inference → analysis)
- Citations for objectives across multiple years

**Minimum Confidence**: 0.75
- Complex multi-year traversal

---

### Query 2.2: Prerequisite Chains

**User Query**: "What Year 4 multiplication objectives require Year 3 knowledge?"

**Expected Behavior**:
- Find Year 4 multiplication objectives
- Traverse `(:Objective)-[:REQUIRES]->(:Objective)` relationships
- Filter prerequisites by `year = 3`

**Success Criteria**:
- Lists Year 4 objectives with Year 3 prerequisites
- Explains prerequisite relationships
- Citations for both Year 3 and Year 4 objectives

**Minimum Confidence**: 0.80
- Relationship traversal with filtering

---

### Query 2.3: Topic Depth Comparison

**User Query**: "What's the difference between Year 2 and Year 5 addition objectives?"

**Expected Behavior**:
- Query addition objectives for Year 2 and Year 5
- Compare scope (e.g., Year 2: two-digit, Year 5: decimals, fractions)
- Highlight progression

**Success Criteria**:
- Lists objectives for both years
- Explains key differences (number range, complexity)
- Shows clear progression path

**Minimum Confidence**: 0.75
- Multi-year comparison with analysis

---

### Query 2.4: Concept Introduction

**User Query**: "When are students first introduced to algebra concepts?"

**Expected Behavior**:
- Find `:Concept` nodes related to algebra
- Traverse to `:Objective` nodes via `:TEACHES` relationship
- Identify earliest year where algebra appears

**Success Criteria**:
- Identifies first year algebra is taught (typically Year 6 or Key Stage 3)
- Lists initial algebra objectives
- Explains what students learn first

**Minimum Confidence**: 0.80
- Concept-based query with year aggregation

---

### Query 2.5: Cross-Subject Connections

**User Query**: "Which science objectives in Year 4 use mathematics skills?"

**Expected Behavior**:
- Query Year 4 science objectives
- Identify mathematical concepts/skills mentioned in descriptions
- May use semantic matching or explicit relationships

**Success Criteria**:
- Lists science objectives requiring maths (measurement, data, graphs)
- Explains mathematical skills needed
- Citations for science objectives

**Minimum Confidence**: 0.70
- Cross-domain query, may require semantic matching

---

## Category 3: Edge Cases (5 queries)

### Query 3.1: Non-Existent Year

**User Query**: "What do Year 15 students study?"

**Expected Behavior**:
- Query for `year = 15` objectives
- Return empty result set
- Clearly state Year 15 is not in curriculum scope (UK primary/secondary ends at Year 11)

**Success Criteria**:
- Does NOT hallucinate content
- Clearly explains curriculum scope (Years 1-11 or similar)
- Suggests valid year range

**Minimum Confidence**: 0.90
- High confidence in "not found" result

---

### Query 3.2: Ambiguous Term

**User Query**: "What is 'division' in the curriculum?"

**Expected Behavior**:
- Recognize ambiguity (strand name? concept? operation?)
- Query multiple interpretations:
  - `:Strand` named "Division"
  - `:Concept` related to division
  - `:Objective` mentioning division
- Present all relevant results

**Success Criteria**:
- Acknowledges term appears in multiple contexts
- Provides results from strands, concepts, and objectives
- Asks clarifying question if appropriate

**Minimum Confidence**: 0.75
- Multiple query paths, needs disambiguation

---

### Query 3.3: Very Broad Query

**User Query**: "Tell me about the curriculum."

**Expected Behavior**:
- Recognize overly broad query
- Provide high-level overview (year range, subjects, structure)
- Suggest more specific queries

**Success Criteria**:
- Summarizes curriculum structure from graph (not hallucination)
- Lists subjects available
- Encourages refinement ("What subject or year are you interested in?")

**Minimum Confidence**: 0.70
- Broad aggregation query

---

### Query 3.4: Missing Data

**User Query**: "What Art objectives are there for Year 9?"

**Expected Behavior**:
- Query for Year 9 Art objectives
- If not present in graph: Clearly state data not available
- Do NOT make up content

**Success Criteria**:
- If data exists: Returns objectives with citations
- If data missing: Clearly states "Art objectives for Year 9 not found in graph"
- No hallucinated content

**Minimum Confidence**: 0.85
- Clear about data availability

---

### Query 3.5: Malformed Query

**User Query**: "Yr3 maths plz thx"

**Expected Behavior**:
- Parse informal query to understand intent (Year 3 Mathematics)
- Execute appropriate Cypher query
- Provide helpful response

**Success Criteria**:
- Successfully interprets "Yr3" → Year 3, "maths" → Mathematics
- Returns relevant objectives
- Maintains professional tone in response

**Minimum Confidence**: 0.80
- Requires query normalization

---

## Category 4: Complex Multi-Turn (5 queries)

### Query 4.1: Prerequisite Chain Exploration

**Turn 1**: "What do Year 5 students learn about percentages?"

**Expected Behavior (Turn 1)**:
- Query Year 5 percentage objectives
- List 2-4 objectives with descriptions

**Turn 2**: "What do they need to know before learning those?"

**Expected Behavior (Turn 2)**:
- Use context from Turn 1 (percentage objectives)
- Traverse `:REQUIRES` relationships to find prerequisites
- List prerequisite objectives (likely Year 4 fractions, decimals)

**Turn 3**: "Which strand do those prerequisites belong to?"

**Expected Behavior (Turn 3)**:
- Use context from Turn 2 (prerequisite objectives)
- Traverse `:PART_OF` relationships to find strands
- Return strand names

**Success Criteria**:
- Maintains conversation context across all 3 turns
- Correctly resolves pronouns ("those" → prerequisite objectives)
- All answers grounded in graph traversals

**Minimum Confidence**: 0.80 per turn
- Multi-hop traversal with context

---

### Query 4.2: Progression Path

**Turn 1**: "What fractions do Year 3 students learn?"

**Expected Behavior (Turn 1)**:
- Query Year 3 fraction objectives
- List unit fractions, fractions of amounts, etc.

**Turn 2**: "What comes next in Year 4?"

**Expected Behavior (Turn 2)**:
- Infer context: "next" → Year 4 fractions
- Query Year 4 fraction objectives
- Compare/show progression from Year 3

**Turn 3**: "And in Year 5?"

**Expected Behavior (Turn 3)**:
- Continue progression pattern
- Query Year 5 fraction objectives
- Show increasing complexity

**Success Criteria**:
- Maintains topic context (fractions) across turns
- Shows clear progression without re-explaining basics
- Citations for each year's objectives

**Minimum Confidence**: 0.85 per turn
- Sequential year traversal

---

### Query 4.3: Concept Deep Dive

**Turn 1**: "What is place value?"

**Expected Behavior (Turn 1)**:
- Find `:Concept` node for place value
- Return description

**Turn 2**: "Which objectives teach it?"

**Expected Behavior (Turn 2)**:
- Traverse `(:Objective)-[:TEACHES]->(:Concept)` for place value concept
- List objectives across all years

**Turn 3**: "Focus on Year 2 only."

**Expected Behavior (Turn 3)**:
- Filter previous results by `year = 2`
- Return Year 2 place value objectives

**Success Criteria**:
- Turn 1: Concept explanation
- Turn 2: Comprehensive objective list
- Turn 3: Correctly applies filter to refine results

**Minimum Confidence**: 0.85 per turn
- Concept → objectives traversal with filtering

---

### Query 4.4: Comparison Refinement

**Turn 1**: "Compare Year 1 and Year 6 reading skills."

**Expected Behavior (Turn 1)**:
- Query reading objectives for both years
- Highlight major differences (basic decoding vs. critical analysis)

**Turn 2**: "What about the middle years?"

**Expected Behavior (Turn 2)**:
- Infer context: Years 2-5 reading
- Query reading objectives for Years 2, 3, 4, 5
- Show progression

**Turn 3**: "Which year introduces inference skills?"

**Expected Behavior (Turn 3)**:
- Search reading objectives for "inference" or related concepts
- Identify first year it appears

**Success Criteria**:
- Maintains reading comprehension context
- Expands scope naturally in Turn 2
- Semantic search in Turn 3

**Minimum Confidence**: 0.75 per turn
- Complex comparison with semantic search

---

### Query 4.5: Strand Exploration

**Turn 1**: "What strands are in Year 4 Mathematics?"

**Expected Behavior (Turn 1)**:
- Query `:Strand` nodes for Year 4 Mathematics
- List strand names

**Turn 2**: "Tell me about the Geometry strand."

**Expected Behavior (Turn 2)**:
- Focus on Geometry strand from Turn 1
- Query objectives in Year 4 Geometry strand
- List objectives with descriptions

**Turn 3**: "What concepts do these objectives teach?"

**Expected Behavior (Turn 3)**:
- Use objectives from Turn 2
- Traverse `:TEACHES` relationships to `:Concept` nodes
- List concepts

**Success Criteria**:
- Turn 1: High-level strand list
- Turn 2: Drill down to specific strand
- Turn 3: Drill down to concepts

**Minimum Confidence**: 0.85 per turn
- Progressive refinement with relationship traversal

---

## Testing Workflow

### Pre-Testing Setup
1. Ensure Neo4j vector index exists (Task 26)
2. Ensure Supabase tables created (Task 27)
3. Ensure Inngest dev server running for async agents
4. Clear any existing test data (or mark test run start)

### During Testing
1. Run queries 1-20 in order
2. For each query, record:
   - ✅ Success or ❌ Failure
   - Confidence score (actual vs. expected)
   - Grounding rate (claims with citations)
   - Response latency
   - Notes on answer quality
3. For multi-turn queries (4.1-4.5), complete entire conversation before moving to next query

### Post-Testing Analysis
1. Calculate success rate: `(successful queries / 20) × 100%`
2. Verify ≥85% threshold (at least 17/20)
3. Analyze failure patterns:
   - Cypher query errors?
   - Missing citations?
   - Hallucinated content?
   - Context loss in multi-turn?
4. Review dashboard metrics:
   - Average confidence score
   - Grounding rate
   - Memory creation (20 new memories after 20 queries)

### Learning Improvement Validation
1. Run queries 1-10 first → calculate baseline average evaluation score
2. Continue with queries 11-20
3. Run 30 more queries (repeat or variations)
4. Compare evaluation scores:
   - Interactions 1-10: Baseline
   - Interactions 41-50: Final
   - Target: ≥20% improvement

**Formula**: `Improvement = ((Final - Baseline) / Baseline) × 100%`

**Example**:
- Baseline (1-10): 0.67 average
- Final (41-50): 0.85 average
- Improvement: `((0.85 - 0.67) / 0.67) × 100% = 26.9%` ✅

---

## Expected Outcomes

### Query Success Rates by Category
- **Basic Retrieval**: 100% (5/5) - Straightforward graph queries
- **Cross-Year Comparison**: 80-100% (4-5/5) - More complex traversals
- **Edge Cases**: 80% (4/5) - Tests system boundaries, 1-2 acceptable failures
- **Complex Multi-Turn**: 80-100% (4-5/5) - Context handling challenges

**Overall Target**: ≥85% (17/20 successful)

### Confidence Score Distribution
- **High (0.85-1.00)**: 60% of successful queries (direct matches)
- **Medium (0.70-0.84)**: 30% of successful queries (complex traversals)
- **Low (0.60-0.69)**: 10% of successful queries (edge cases)

### Common Failure Modes to Watch For
1. **Hallucination**: Agent makes up objectives not in graph
2. **Context Loss**: Multi-turn queries lose previous context
3. **Cypher Errors**: Invalid queries crash tool execution
4. **Missing Citations**: Claims without [Node-ID] references
5. **Over-Generalization**: Broad queries return incomplete results

---

## Document Status
**Version**: 1.0
**Created**: 2025-10-20
**Phase**: 1 (MVP)
**Dependencies**: Tasks 1-29 complete
**Next**: Task 31 (Type Check & Cleanup)

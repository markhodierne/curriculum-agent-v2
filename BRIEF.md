The repo contains a 'starter' codebase to build a chat agent application that utilizes an MCP server.
I have developed the MCP server and hosted it on Google Cloud Run at:
https://neo4j-mcp-server-6336353060.europe-west1.run.app

The application is the "Oak Curriculum Agent". The MCP provides access to a knowledge graph hosted on Neo4j AuraDB. The knowledge graph maps out a structure and resources that help schools to deliver the UK National Curriculum as specified by the Department for Education.

Currently, the application does a very poor job as an agent. The implementation is very basic.

Here is the Project Brief for a Version 2.0 of the application:


Oak Curriculum Agent — Project Brief v2.0
A Self-Learning, Graph-Native AI for Curriculum Exploration
Built on a Three-Agent Learning Loop from Day 1

Executive Summary
Build a production-ready curriculum chat agent that learns from every interaction using your existing Neo4j curriculum knowledge graph. This agent demonstrates measurable improvement within 50 conversations through a simple, elegant three-agent architecture: Query, Reflection, and Learning.
Core Innovation: The learning loop IS the architecture. Three specialized agents working asynchronously create a self-improving system that gets smarter with use—no complex orchestration, no unnecessary abstraction.
Speed to Value: Using Vercel AI SDK v5 to maximum effect, the MVP can be built in 4-6 weeks with minimal code. The SDK handles orchestration, streaming, tool calling, and error handling—we focus solely on the learning loop.
MVP Success: Demonstrate to stakeholders that the agent's evaluation scores improve by ≥20% over 50 interactions, with full observability into how it learns.

Table of Contents
Vision & Success Criteria
Three-Agent Architecture
Development Phases
Phase 1: MVP - Learning Loop Foundation
Phase 2: Enhanced Retrieval
Phase 3: Curriculum Intelligence
Phase 4: Multi-Source GraphRAG
Phase 5: Production Polish
Data Model
Evaluation Framework
Technology Stack
Risks & Mitigations
Deliverables & Acceptance

1. Vision & Success Criteria
1.1 Core Vision
Create an agent that learns like a teacher learns—through practice, reflection, and building mental models. The three-agent system makes this natural:
Query Agent: Answers questions (learns by retrieving past successes)
Reflection Agent: Evaluates quality (learns what "good" looks like)
Learning Agent: Updates memory (learns patterns and strategies)
Every conversation becomes training data. Every mistake becomes a learning opportunity.
1.2 Primary Outcomes
Observable Learning: Measurable performance improvement from interaction history
Graph-Native Reasoning: Uses graph structure for reasoning, not just retrieval
Curriculum Intelligence: Understands relationships, prerequisites, progressions
Trustworthy Answers: Every claim has confidence scores and citations
Minimal Code: SDK v5 does heavy lifting; we write only business logic
1.3 Success Metrics (MVP)
Metric
Target
Measurement
Learning Improvement
≥20% accuracy gain after 50 interactions
Compare eval scores: interactions 1-10 vs 41-50
Grounding Rate
≥95% of claims have valid citations
Automated citation verification
Confidence Calibration
Confidence scores correlate with accuracy (r>0.7)
Predicted vs actual correctness
Query Success Rate
≥85% of Cypher queries execute without error
Execution success rate
Response Latency (p95)
≤4s simple queries, ≤8s complex
User-facing response time
Async Processing
Reflection complete within 30s
Background job latency
Memory Quality
≥75% of retrieved memories rated relevant
Human eval of few-shot examples

1.4 MVP Demonstration (Week 4-6)
Live stakeholder demo showing:
Agent answers curriculum query with confidence-scored citations
Educator provides feedback (👍/👎, grounded/not)
Agent trace shows: Reflection Agent evaluating, Learning Agent creating memory
Similar question asked later → Query Agent retrieves learned pattern, better answer
Dashboard shows: Evaluation scores improving over the session
Stakeholder message: "This agent gets smarter every time you use it."

2. Three-Agent Architecture
2.1 The Learning Loop
                         USER
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │     🗣️ QUERY AGENT                  │
        │      (Synchronous)                   │
        │                                      │
        │  1. Retrieve relevant memories       │
        │  2. Generate Cypher with few-shots   │
        │  3. Execute against Neo4j            │
        │  4. Answer with confidence+citations │
        │  5. Stream to user                   │
        │  6. Emit event → async pipeline     │
        └─────────────────────────────────────┘
                          │
                          │ (non-blocking event)
                          ▼
              ┌─────────────────────┐
              │    EVENT QUEUE      │
              │  (Inngest/Vercel)   │
              └─────────────────────┘
                    │         │
        ┌───────────┘         └───────────┐
        ▼                                 ▼
┌──────────────────────┐      ┌──────────────────────┐
│  🪞 REFLECTION AGENT  │      │  🧠 LEARNING AGENT   │
│    (Async Worker)    │      │    (Async Worker)    │
│                      │      │                      │
│  1. LLM-as-judge     │      │  1. Create :Memory   │
│     evaluation       │      │  2. Link evidence    │
│  2. Score on rubric: │──────▶  3. Extract patterns  │
│     - Grounding      │      │  4. Update embeddings│
│     - Accuracy       │      │  5. Consolidate      │
│     - Completeness   │      │                      │
│     - Pedagogy       │      │  Query Agent reads   │
│     - Clarity        │      │  from here ────┐     │
│  3. Write scores     │      │                │     │
└──────────────────────┘      └────────────────┼─────┘
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │   NEO4J AURADB     │
                                    │  ┌──────────────┐  │
                                    │  │ Curriculum   │  │
                                    │  │   Graph      │  │
                                    │  └──────────────┘  │
                                    │  ┌──────────────┐  │
                                    │  │  :Memory     │  │
                                    │  │  :Pattern    │  │
                                    │  └──────────────┘  │
                                    └────────────────────┘
2.2 Why This Works
Separation of Concerns:
Query Agent: User-facing, optimized for speed and clarity
Reflection Agent: Quality evaluation without blocking responses
Learning Agent: Memory management and pattern extraction
Async-First:
User never waits for reflection or learning
Background processing can take 30s+ without affecting UX
Failures in learning pipeline don't break chat
Dynamic Learning:
Query Agent retrieves memories before each query → learns implicitly
Learning Agent updates memory continuously → learning accumulates
No manual retraining or model updates needed
2.3 Leveraging Vercel AI SDK v5
The SDK provides:
Agent orchestration: createAgent() with lifecycle hooks
Tool calling: Native function calling with validation
Streaming: Built-in streaming responses
Context management: Automatic conversation history
Error handling: Retry logic and fallbacks
Observability: Integration with tracing tools
We focus on: Business logic, memory retrieval, evaluation rubrics, and domain expertise—not plumbing.

3. Development Phases
Phase
Duration
Focus
Key Deliverable
Phase 1 (MVP)
4-6 weeks
Three-agent learning loop
Observable self-improvement
Phase 2
3-4 weeks
Retrieval optimization
Multi-stage memory retrieval
Phase 3
3-4 weeks
Curriculum features
Prerequisite paths, pedagogy
Phase 4
4-5 weeks
Multi-source data
DfE PDF integration
Phase 5
3-4 weeks
Production polish
Admin tools, monitoring

Total Timeline: 17-23 weeks to production
 MVP Demo: Week 4-6

4. Phase 1: MVP - Learning Loop Foundation
Duration: 4-6 weeks
 Goal: Demonstrate observable learning with minimal code
4.1 System Components
4.1.1 Frontend (Minimal)
Home Page:
Single "Start Chat" button
Chat Interface:
Message input/output with streaming
Agent trace panel (collapsible): Shows reasoning steps
Evidence panel: Displays citations with confidence scores
Feedback controls: 👍/👎 + "Well grounded?" checkbox + optional note
Dashboard:
Learning curve chart: Eval scores over time
Recent interactions table: Query, confidence, scores
Memory stats: Total count, avg score, retrieval frequency
Pattern library: Discovered query patterns with success rates
Tech: Next.js 14 + Vercel AI SDK useChat() hook + shadcn/ui
4.1.2 Query Agent (Synchronous)
Role: Answer user questions using Neo4j graph
Lifecycle:
Before query: Retrieve 3 similar high-quality memories from Neo4j (vector search)
Context building: Format memories as few-shot examples, include relevant schema
Tool execution:
neo4jQuery: Generate and execute Cypher with reasoning
schemaInspect: Get graph structure for query planning
Answer generation: Create response with claim-level confidence scores
Citation verification: Ensure every claim has graph support
After query: Emit event to async pipeline (non-blocking)
Tools:
Neo4jQueryTool: Execute Cypher queries with validation, timeout protection, and result formatting
SchemaInspectTool: Return relevant schema context based on query focus
Key Features:
Dynamic few-shot learning from memory
Schema-aware Cypher generation
Confidence scoring (0-1) per claim
Citation verification before response
Non-blocking event emission
4.1.3 Reflection Agent (Async Worker)
Role: Evaluate interaction quality using LLM-as-judge
Process:
Receive interaction complete event
Analyze query, answer, Cypher, and graph results
Evaluate on 5-dimension rubric (see Evaluation Framework)
Generate structured evaluation with scores, strengths, weaknesses, suggestions
Emit to Learning Agent with evaluation data
Evaluation Dimensions:
Grounding (30% weight): Claims supported by evidence?
Accuracy (30% weight): Information correct per curriculum?
Completeness (20% weight): Fully answers question?
Pedagogy (10% weight): Appropriate for curriculum context?
Clarity (10% weight): Well-explained?
Output: Structured JSON with scores, qualitative feedback, and improvement suggestions
Model: o1-mini (good reasoning for evaluation tasks)
4.1.4 Learning Agent (Async Worker)
Role: Update memory system and extract patterns
Process:
Receive reflection complete event
Create Memory Node in Neo4j with:
Query, answer, Cypher, confidence
All evaluation scores
Embedding of query
IDs of memories used
Link to Evidence: Create edges to graph nodes cited in answer
Extract Pattern (if overall score > 0.8):
Analyze Cypher structure
Identify reusable query pattern
Upsert :QueryPattern node
Link memory to pattern
Find Similar Memories: Vector search and create similarity edges
Consolidate (every 20 memories):
Cluster similar episodic memories
Extract common patterns into semantic memories
Prune low-quality old memories (score < 0.5, age > 30 days)
Model: GPT-4o-mini (fast, cheap for data operations)
4.2 Memory Retrieval (How Query Agent Learns)
Process:
Embed incoming user query
Vector search in Neo4j :Memory nodes (similarity > threshold)
Filter for high quality (overall_score > 0.75)
Retrieve with:
Memory details (query, answer, Cypher)
Associated query patterns
Evidence nodes used
Evaluation scores and notes
Format as few-shot examples for Query Agent context
Include pattern success rates and lessons learned
This is the core learning mechanism: Past successes guide current behavior.
4.3 Confidence Scoring
Claim-Level Confidence:
0.90-1.00: Direct graph match (claim from node property)
0.75-0.89: Inferred from relationship traversal
0.60-0.74: Synthesized from multiple nodes
0.40-0.59: Weak support or indirect evidence
0.00-0.39: No clear graph support (potential hallucination)
Overall Confidence: Weighted average of all claim confidences
UI Display: Star ratings (★★★★★) and percentage alongside each claim
4.4 Citation Verification
Post-Answer Verification:
Extract atomic claims from answer
Get graph results from tool calls
For each claim, search for supporting evidence in graph results
Calculate confidence based on evidence strength
Flag claims without support as potential hallucinations
Calculate grounding rate (% claims with citations)
Warn if grounding rate < 80%
Result: Every claim tagged with confidence, citations, and verification status
4.5 Event-Driven Coordination
Technology: Inngest for async job orchestration
Event Flow:
Query Agent emits interaction.complete (fire-and-forget, doesn't block user)
Reflection Agent listens, processes, emits reflection.complete
Learning Agent listens, creates memory, extracts patterns
Error Handling:
Query Agent: Log but don't fail if event emission fails
Workers: Automatic retry with exponential backoff (3 attempts)
Dead letter queue for permanently failed jobs
Monitoring alerts for queue health
4.6 MVP Data Model
Add to existing Oak graph (no changes to curriculum nodes):
Memory Nodes:
:Memory - Episodic interaction records with embeddings
:QueryPattern - Learned Cypher strategies
:SemanticMemory - Consolidated patterns from clusters
Relationships:
(:Memory)-[:USED_EVIDENCE]->(:Objective|Strand|Concept) - Evidence links
(:Memory)-[:APPLIED_PATTERN]->(:QueryPattern) - Pattern usage
(:Memory)-[:SIMILAR_TO]->(:Memory) - Similarity links
Vector Index: memory_embeddings on Memory.embedding (1536 dimensions, cosine similarity)
Properties Added: All memory nodes have: query, answer, confidence, evaluation scores, embedding, timestamps
4.7 Dashboard (Minimal)
Three cards:
Learning Curve: Line chart of average evaluation score over time (by interaction number)
Recent Interactions: Table showing last 20 interactions with query, confidence, grounding rate, overall score
Pattern Library: List of discovered :QueryPattern nodes with name, description, success rate, usage count
Purpose: Show stakeholders that learning is happening
4.8 MVP Deliverables
Week 4-6 Demo Package:
✅ Chat interface with streaming, traces, citations
✅ Three agents (Query, Reflection, Learning) working asynchronously
✅ Memory system creating nodes in Neo4j after every interaction
✅ Reflection evaluating every interaction within 30s
✅ Learning curve dashboard showing improvement
✅ 10 curated demo queries demonstrating learning
✅ Documentation: architecture diagram, data model, setup guide
Expected Code Volume:
Query Agent: ~100 lines (excluding tool definitions)
Reflection Agent: ~80 lines
Learning Agent: ~120 lines
Memory retrieval: ~50 lines
Frontend: ~200 lines
Total core: ~550 lines
Acceptance Criteria:
[ ] Agent answers 20 curated curriculum queries with ≥85% success rate
[ ] All answers include confidence scores and citations
[ ] Memory created for every interaction within 30s
[ ] Reflection evaluates within 30s
[ ] Dashboard shows improvement (20%+ over 50 interactions)
[ ] p95 latency ≤4s (user-facing)
[ ] Demo runs live without errors

5. Phase 2: Enhanced Retrieval
Duration: 3-4 weeks
 Goal: Optimize memory retrieval and query execution
5.1 Capabilities Added
5.1.1 Multi-Stage Memory Retrieval
Replace single vector search with sophisticated pipeline:
Stage 1: Sparse Retrieval (BM25)
Index memory text in PostgreSQL with full-text search
Fast keyword matching for exact phrases
Stage 2: Dense Retrieval (Vector)
Current Neo4j vector search
Semantic similarity matching
Stage 3: Graph-Aware Reranking
Boost memories that used evidence similar to current query's topic
Calculate evidence overlap between candidate memories and query entities
Stage 4: LLM Reranking
Cross-encoder model scores memory relevance
Considers query context and conversation history
Stage 5: Diversity Injection (MMR)
Maximal Marginal Relevance to avoid redundant memories
Ensure variety in retrieved patterns
Result: Higher quality, more diverse few-shot examples
5.1.2 Semantic Query Cache
Purpose: Avoid re-computing similar queries
Implementation:
Create :QueryCache nodes with embeddings
Before Query Agent executes, check cache (similarity > 0.95)
Return cached result if found and recent (< 7 days) and high quality (score > 0.8)
Cache successful results after execution
Benefits:
40%+ expected cache hit rate
Reduced latency and API costs
Consistent answers for similar questions
5.1.3 Query Repair (Self-Healing)
Purpose: Automatically fix failed Cypher queries
Process:
Execute Cypher with timeout
If fails, analyze error message
Use LLM to generate repair strategy
Apply repair and retry (max 3 attempts)
If still fails, broaden query scope or simplify
Common Repairs:
Fix syntax errors
Correct node labels based on schema
Add missing LIMIT clauses
Adjust relationship directions
Simplify complex traversals
Result: 90%+ query success rate
5.1.4 Parallel Tool Execution
Purpose: Execute independent queries simultaneously
Implementation:
Query Agent decomposes complex queries into sub-queries
Build dependency DAG (directed acyclic graph)
Execute independent sub-queries in parallel
Wait for dependencies before dependent queries
Combine results in synthesis step
Example: "Compare Year 3 and Year 5 fractions"
Level 1 (parallel): Get Y3 objectives, Get Y5 objectives
Level 2 (sequential): Compare results, find prerequisites
Result: 30%+ latency reduction for complex queries
5.1.5 Schema-Enhanced Prompting
Add to Query Agent context:
Node/relationship counts (e.g., "1247 Objectives, 892 REQUIRES edges")
Most common query patterns with success rates
Schema constraints and indexes
Data quality notes
Result: Better Cypher generation through richer context
5.2 Phase 2 Deliverables
✅ Multi-stage retrieval pipeline implemented
✅ Query cache with ≥40% hit rate
✅ Self-healing Cypher execution
✅ Parallel tool execution for complex queries
✅ Enhanced schema context
✅ Performance: 30% latency reduction from Phase 1
✅ Metrics dashboard updated with cache stats

6. Phase 3: Curriculum Intelligence
Duration: 3-4 weeks
 Goal: Add domain-specific reasoning and pedagogical features
6.1 Capabilities Added
6.1.1 Prerequisite Path Engine
New Tool: PrerequisitePathTool
Functionality:
Traverse REQUIRES relationships backward from objective
Compute full prerequisite chain (up to 5 levels deep)
Return ordered learning sequence
Include year groups and difficulty progression
Query Agent can now answer:
"What do students need to learn before X?"
"Show me the learning sequence for fractions"
"What's the path from basic arithmetic to algebra?"
UI Enhancement: Visualize prerequisite tree with Cytoscape.js or D3
6.1.2 Misconception Detection
Data Model Extension:
Add :Misconception nodes (manually curated or extracted)
Link to objectives: (:Objective)-[:ADDRESSES_MISCONCEPTION]->(:Misconception)
Query Agent Enhancement:
Retrieve common misconceptions for topics
Include in answers when relevant
Warn educators about known pitfalls
Example: "Students often think all fractions are less than 1 (confusion about improper fractions)"
6.1.3 Pedagogy-Aware Answer Generation
Audience Detection:
Analyze query for indicators (keywords like "student", "teach", "child")
Classify as: student, teacher, curriculum_planner, default
Answer Adaptation:
Student: Simple language, concrete examples, friendly tone, visual suggestions
Teacher: Technical terms, pedagogical notes, misconceptions, teaching tips
Curriculum Planner: Detailed connections, assessment notes, progression tracking
Default: Clear professional explanation
Implementation: Adjust system prompt and response formatting based on audience
6.1.4 Cross-Curricular Linking
If graph includes multiple subjects:
Add (:Objective)-[:CONNECTS_TO]->(:Objective) for cross-subject connections
Include connection_type (e.g., "applies_concept", "prerequisite_for")
Single-subject alternative:
Use concept nodes: (:Concept)-[:APPEARS_IN]->(:Strand)
Track where concepts reappear
Query Agent can answer: "Where else do students encounter fractions?" (e.g., in science measurements)
6.1.5 Curriculum Health Dashboard (Admin)
Real-time quality metrics:
Coverage Analysis:
Total nodes vs. nodes ever queried
Coverage rate by strand/year group
Isolated nodes (never retrieved)
Connectedness Metrics:
Isolated graph components
Average prerequisite depth
Missing prerequisite edges (flagged)
Quality Indicators:
Average memory score by topic
High-confidence query rate
Hallucination incidents by node
Low-scoring interactions flagged
User Engagement:
Most/least queried topics
Query frequency heatmap by curriculum area
Purpose: Help curriculum designers identify gaps and improve graph quality
6.1.6 Difficulty Calibration
Heuristic Scoring:
Prerequisite count (more prerequisites = harder)
Concept count (more concepts = harder)
Year group (higher = harder)
Combined formula: (prereq_count × 0.4 + concept_count × 0.3 + year × 0.3)
Storage: Computed property on :Objective nodes
UI: Display difficulty indicators (⭐⭐⭐☆☆) in results
Use Case: Help educators understand cognitive load and sequencing
6.2 Phase 3 Deliverables
✅ Prerequisite path tool + visualization
✅ Misconception database (if data available)
✅ Pedagogy-aware answer generation
✅ Cross-curricular linking (if multi-subject)
✅ Admin curriculum health dashboard
✅ Difficulty calibration scores
✅ Updated Query Agent with new tools

7. Phase 4: Multi-Source GraphRAG
Duration: 4-5 weeks
 Goal: Integrate DfE PDFs with hybrid retrieval
7.1 Capabilities Added
7.1.1 DfE PDF Ingestion Pipeline
Ingestion Process:
Fetch canonical PDF from versioned URL
Parse with structure preservation (headings, tables, page numbers)
Extract sections based on document structure
Apply semantic chunking (not fixed-size):
Split into sentences
Embed each sentence
Detect topic boundaries (similarity drops)
Create chunks at boundaries with overlap
Embed chunks (text-embedding-3-small)
Create graph structure: :Document → :Section → :Chunk
Store in Neo4j with layers property
Data Model:
:Document {title, url, checksum, version, layers: ['dfe_curriculum_data']}
:Section {title, page_start, page_end, layers: ['dfe_curriculum_data']}
:Chunk {text, embedding, page, chunk_index, layers: ['dfe_curriculum_data']}
Relationships: (:Document)-[:HAS_SECTION]->(:Section)-[:HAS_CHUNK]->(:Chunk)
Vector Index: chunk_embeddings on Chunk.embedding
7.1.2 Automated Chunk Linking
Link chunks to curriculum graph:
Extract entities from chunk text (year groups, topics, concepts)
Find matching graph nodes (fuzzy matching on names, codes)
Calculate link confidence based on context
Create (:Chunk)-[:ABOUT {confidence}]->(:Objective|Concept) edges (if confidence > 0.6)
Methods:
Entity extraction with LLM
Fuzzy string matching
Semantic similarity of chunk to node descriptions
Manual curation for high-value alignments
7.1.3 Layer System Implementation
Layer Nodes:
(:Layer {name: 'oak_curriculum_data', version: '1.0', active: true})
(:Layer {name: 'dfe_curriculum_data', version: '2024.1', active: true})
Layer Tagging:
All existing Oak nodes: n.layers = ['oak_curriculum_data']
All DfE nodes: n.layers = ['dfe_curriculum_data']
Some nodes may have both: n.layers = ['oak_curriculum_data', 'dfe_curriculum_data']
Layer-Aware Querying:
Every Cypher query filters by active layers
Pattern: WHERE any(layer IN $active_layers WHERE layer IN n.layers)
UI Controls:
Home page: Layer toggles (Oak default on, DfE default off)
User can enable/disable layers per session
7.1.4 Hybrid Retrieval (Graph + Vector)
New Tool: GraphChunkSearchTool
Hybrid Retrieval Process:
Vector search: Find top-N chunks by semantic similarity (filtered by active layers)
Graph expansion: For each chunk, traverse to connected graph nodes via :ABOUT edges
Graph traversal: From connected nodes, explore 1-2 hops to related curriculum nodes (filtered by layers)
Hybrid scoring: Combine vector similarity + graph centrality (50/50 weight)
Re-ranking: Sort by hybrid score
Return: Top-K results with both chunks and graph context
Graph Score Calculation:
Number of connections to graph nodes
Centrality of connected nodes (highly connected = more important)
Proximity (fewer hops = better)
Link confidence
Result: Richer context combining PDF content and graph relationships
7.1.5 Cross-Layer Alignment
Alignment Edges:
(:Objective)-[:ALIGNS_WITH {confidence, method}]->(:Chunk)
Confidence: 0-1 (how certain is the alignment?)
Method: 'semantic_similarity', 'manual_curated', 'entity_match'
Optional Mapping Nodes (for complex alignments):
(:Mapping {confidence, method, provenance})
(:Mapping)-[:MAPS]->(:Objective) and (:Mapping)-[:TO]->(:Chunk)
Allows many-to-many with metadata
Purpose: Track curriculum consistency across sources, identify conflicts
7.1.6 Multi-Source Citations
Answer Format:
Synthesize evidence from both sources:
"According to Oak National Academy: [claim] [Oak: Y3-F-001]★★★★★"
"According to DfE National Curriculum: [claim] [DfE: NC-KS2 p.23]★★★★★"
"Note: Both sources emphasize [common theme]"
Handle conflicts: "Oak recommends X, while DfE emphasizes Y"
Citation Display:
Separate sections for Oak vs DfE citations
Clear source labels
Conflict highlighting if disagreement exists
7.2 Phase 4 Deliverables
✅ PDF ingestion pipeline with semantic chunking
✅ :Document/:Section/:Chunk nodes in Neo4j
✅ Vector index for chunks
✅ Hybrid retrieval tool (vector + graph expansion)
✅ Layer system with Oak/DfE toggles in UI
✅ Cross-layer alignment edges (manual curation tool for admins)
✅ Multi-source citations in answers
✅ Query Agent updated to handle multiple sources

8. Phase 5: Production Polish
Duration: 3-4 weeks
 Goal: Production-ready system with monitoring and admin tools
8.1 Capabilities Added
8.1.1 Advanced Trace Viewer
Interactive visualization:
Timeline of agent steps with durations
Expandable sections for each agent (Query, Reflection, Learning)
Tool calls with arguments and results
Reasoning traces (why decisions were made)
Memory retrieval details (which memories used, why)
Export trace as JSON for debugging
Purpose: Full observability into agent behavior for debugging and explanation
8.1.2 Enhanced Production Dashboard
Real-Time Operations:
Queries per minute, error rate, average latency
Queue health (job backlog, processing rate, failures)
Cache hit rate and performance impact
Learning Metrics:
Learning curve with trend line and projection
Memory growth over time
Pattern library with usage frequency
Top queries by frequency and quality
Quality Monitoring:
Recent low-scoring interactions (flagged for review)
Hallucination incidents by topic
Confidence calibration tracking
User feedback summary (thumbs up/down distribution)
Alerts:
Latency spike detection
Error rate threshold breach
Queue backlog growth
Drop in evaluation scores
8.1.3 Conversational Graph Exploration
Interactive feature:
User: "Show me Year 5 fractions"
Agent generates Cypher, returns subgraph
UI renders interactive graph (Cytoscape.js)
User clicks node → Agent explains node context
User: "What comes before this?" → Agent traverses prerequisites
Continuous conversation around graph structure
Purpose: Exploratory learning and curriculum navigation
8.1.4 Memory Visualization (Admin)
Memory Map:
UMAP projection of all memory embeddings into 2D space
Color-coded by topic (auto-clustered)
Click cluster → show memories in that cluster
Identify densely-learned areas vs gaps
Purpose: Understand what agent has learned, identify consolidation opportunities
8.1.5 Exportable Traces
Full interaction export for:
Research analysis
Compliance auditing
Debugging issues
Training data creation
Format: JSON with complete interaction history, agent reasoning, evaluation results, memory created
8.1.6 Rate Limiting & Quotas
Per-user limits:
100 queries per hour
Escalating backoff for abuse
Admin exemptions
Purpose: Prevent abuse, control costs
8.1.7 Comprehensive Evaluation Suite
Automated test suite (100+ tests):
Categories:
Factual Accuracy: "How many Year 3 objectives?" (expected: exact count)
Pedagogical Coherence: "Explain fractions to a teacher" (rubric: age-appropriate, pedagogically sound)
Adversarial: "Year 27 fractions?" (expected: graceful error handling)
Regression: Past queries that should still work
Run Schedule: Nightly or on-demand
Purpose: Continuous quality assurance, catch regressions early
8.2 Phase 5 Deliverables
✅ Enhanced trace viewer with export
✅ Production monitoring dashboard
✅ Conversational graph exploration UI
✅ Memory visualization (admin)
✅ Trace export API
✅ Rate limiting and quotas
✅ Comprehensive eval suite (100+ tests)
✅ Full documentation + operational runbooks
✅ Production launch 🚀

9. Data Model
9.1 Complete Schema Overview
Existing Oak Curriculum Graph (unchanged):
(:Objective), (:Strand), (:Concept)
(:Objective)-[:PART_OF]->(:Strand)
(:Objective)-[:REQUIRES]->(:Objective)
(:Objective)-[:TEACHES]->(:Concept)
Phase 1: Learning System:
(:Memory) - Episodic interaction records
(:QueryPattern) - Learned Cypher strategies
(:SemanticMemory) - Consolidated patterns
Relationships: :USED_EVIDENCE, :APPLIED_PATTERN, :SIMILAR_TO
Vector index: memory_embeddings
Phase 2: Query Cache:
(:QueryCache) - Cached query results with embeddings
Vector index: cache_embeddings
Phase 3: Curriculum Intelligence:
(:Misconception) - Common student errors
(:Objective)-[:ADDRESSES_MISCONCEPTION]->(:Misconception)
Computed properties: difficulty_score
Phase 4: Multi-Source:
(:Layer) - Data source versioning
(:Document), (:Section), (:Chunk) - PDF content
All nodes get layers property (array of strings)
Relationships: :HAS_SECTION, :HAS_CHUNK, :ABOUT, :ALIGNS_WITH
Vector index: chunk_embeddings
Phase 5: Conversation Threads:
(:ConversationThread) - User session tracking
(:ConversationThread)-[:CONTAINS]->(:Memory)
9.2 Key Properties
Memory Node:
id, type, user_query, final_answer
confidence_overall, cypher_used
grounding_score, accuracy_score, completeness_score, pedagogy_score, clarity_score, overall_score
evaluator_notes, embedding, memories_used, created_at
QueryPattern Node:
id, name, description, cypher_template
success_count, failure_count, created_at
Chunk Node:
id, text, page_start, page_end, chunk_index
embedding, layers
Layer Property: All nodes have layers: [string] array for multi-source filtering
9.3 Vector Indexes
memory_embeddings: On Memory.embedding (1536 dims, cosine)
chunk_embeddings: On Chunk.embedding (1536 dims, cosine)
cache_embeddings: On QueryCache.embedding (1536 dims, cosine)
9.4 Regular Indexes
memory_created on Memory.created_at
memory_score on Memory.overall_score
node_layers on generic n.layers
pattern_name unique constraint on QueryPattern.name
layer_name_version unique constraint on (Layer.name, Layer.version)

10. Evaluation Framework
10.1 Automated Metrics (Tracked Continuously)
Metric
Target
Measurement Method
Learning Improvement
≥20% in 50 interactions
Compare avg eval scores: first 10 vs last 10
Grounding Rate
≥95%
% of claims with valid citations (automated check)
Confidence Calibration
r > 0.7
Pearson correlation(predicted confidence, actual correctness)
Query Success Rate
≥85%
% Cypher executions without error
Response Latency p50
≤2s
Median user-facing response time
Response Latency p95
≤4s
95th percentile user-facing response time
Async Processing
≤30s
Time from interaction to reflection complete
Cache Hit Rate
≥40%
% queries served from cache
Memory Quality
≥75% relevant
Human eval of retrieved memory samples
Pattern Success Rate
≥80%
Avg success rate of :QueryPattern nodes

10.2 LLM-as-Judge Rubric
Five Dimensions (scored 0-1):
Grounding (30% weight):


1.0: Every claim has clear graph support
0.7: Most claims supported, minor unsupported details
0.4: Significant unsupported claims (partial hallucination)
0.0: Mostly hallucinated content
Accuracy (30% weight):


1.0: Completely accurate per curriculum
0.7: Minor inaccuracies that don't affect core message
0.4: Significant factual errors
0.0: Fundamentally incorrect information
Completeness (20% weight):


1.0: Comprehensive, addresses all aspects of query
0.7: Answers main question, some gaps
0.4: Partial answer, significant missing elements
0.0: Doesn't answer the question asked
Pedagogy (10% weight):


1.0: Excellent pedagogical framing, curriculum-aware
0.7: Good, appropriate for educators
0.4: Lacks curriculum context or insight
0.0: Inappropriate, misleading, or non-pedagogical
Clarity (10% weight):


1.0: Crystal clear, well-structured
0.7: Clear with minor ambiguities
0.4: Somewhat confusing or poorly organized
0.0: Unclear, contradictory, or incoherent
Overall Score: Weighted average using percentages above
Output: JSON with scores + qualitative feedback (strengths, weaknesses, improvement suggestions)
10.3 Human Evaluation (Periodic)
Every 2 weeks: Sample 20 interactions for human review
Simple Rubric:
Is this answer correct? (Yes / Mostly / Partially / No)
Is it well-supported by evidence? (Yes / Mostly / Partially / No)
Would this help a teacher? (Very / Somewhat / Not really / Not at all)
Any issues? (Free text)
Purpose: Calibrate LLM-as-judge, catch edge cases
10.4 Learning Curve Tracking
Dashboard Chart: Average evaluation score over time (X-axis: interaction number, Y-axis: score)
Expected Pattern:
Interactions 1-10: 0.65 (baseline)
Interactions 11-20: 0.71 (+9%)
Interactions 21-30: 0.76 (+7%)
Interactions 31-40: 0.80 (+5%)
Interactions 41-50: 0.83 (+4%)
Total: 28% improvement
Success: Clear upward trend demonstrating learning

11. Technology Stack
11.1 Core Stack
Component
Technology
Justification
Frontend
Next.js 14 (App Router)
React framework, excellent streaming support, Vercel deployment


Vercel AI SDK v5 (ai package)
Built-in streaming, minimal code for chat UI


Tailwind CSS + shadcn/ui
Modern, accessible component library


Recharts / D3.js
Dashboard visualizations


Cytoscape.js
Graph visualization
Backend
Node.js + TypeScript
Type-safe, same language as frontend


Vercel AI SDK v5
Agent orchestration, tool calling, streaming


Inngest
Event-driven async job orchestration
LLM
OpenAI o1-mini
Best reasoning for Cypher generation, evaluation


OpenAI GPT-4o-mini
Fast, cheap for Learning Agent data ops
Embeddings
text-embedding-3-small
1536 dims, good quality/cost balance
Data
Neo4j AuraDB
Existing graph + vector indexes


PostgreSQL / Supabase
Telemetry, logs, feedback, conversations
Observability
Langfuse
LLM tracing and evaluation tracking


Vercel Analytics
Performance monitoring


Sentry
Error tracking and alerting
Deployment
Vercel
Seamless Next.js deployment, edge functions


Cloud Run
Existing MCP server (keep as-is)

11.2 Model Selection Strategy
o1-mini for reasoning tasks:
Query Agent: Cypher generation, query decomposition, reasoning traces
Reflection Agent: Evaluation with structured rubric
Cost: $3/M input tokens
Speed: Medium
Context: 64k tokens (sufficient for MVP)
GPT-4o-mini for data operations:
Learning Agent: Memory creation, pattern extraction, consolidation
Cost: $0.15/M input tokens (20× cheaper)
Speed: Fast
Use case: High-volume, straightforward tasks
Future (Phase 5): Add GPT-4o as optional model for:
Faster responses (streaming)
Better natural language quality
Longer context (128k)
11.3 Why This Stack Maximizes Simplicity
Vercel AI SDK v5 provides:
Agent lifecycle management (before, after hooks)
Tool calling with automatic validation
Streaming responses (no manual chunking)
Conversation history (automatic context management)
Error handling and retries
Observability integration
We write only:
Business logic (memory retrieval, evaluation, pattern extraction)
Tool definitions (Neo4j queries, schema inspection)
Domain expertise (curriculum-specific prompts, rubrics)
Result: Minimal code, maximum functionality

12. Risks & Mitigations
12.1 Technical Risks
Risk
Likelihood
Impact
Mitigation
Cypher generation errors
High
High
• Query repair with auto-retry<br>• Schema-enhanced prompts<br>• Validation layer<br>• Pattern library guidance<br>• Extensive test suite
Latency exceeds targets
Medium
Medium
• Query cache (40%+ hit rate)<br>• Parallel tool execution<br>• Connection pooling to Neo4j<br>• Optimize queries with EXPLAIN<br>• Cache schema context
Memory growth unbounded
Medium
Medium
• Automatic pruning (30 days, score < 0.5)<br>• Consolidation reduces episodic count<br>• Storage quotas per user<br>• Monitor growth rate
Learning doesn't improve
Low
High
• Curate initial training set (seed patterns)<br>• Manual high-quality examples<br>• Monitor learning curve closely<br>• Adjust rubric weights if needed<br>• Debug memory retrieval quality
Async pipeline failures
Low
Medium
• Retry with exponential backoff (3 attempts)<br>• Dead letter queue for failed jobs<br>• Don't block user interaction on failures<br>• Alert on queue backlog<br>• Monitor job completion rates

12.2 Product Risks
Risk
Likelihood
Impact
Mitigation
Stakeholders don't see learning
Medium
High
• Clear demo script with before/after<br>• Visualize learning curve prominently<br>• Show specific improvement examples<br>• Explain memory system in simple terms<br>• Live demo with real-time learning
UI too complex
Low
Medium
• Start minimal (MVP focus)<br>• User testing before polish<br>• Progressive disclosure of features<br>• Prioritize chat over admin features
Curriculum coverage gaps
Medium
Medium
• Health dashboard identifies gaps<br>• Graceful "I don't know" responses<br>• Document known limitations<br>• Provide feedback mechanism for gaps
Multi-source confusion
Low
Medium
• Clear visual distinction (Oak vs DfE)<br>• Separate citation sections<br>• Explain source differences in answers<br>• Layer toggles with explanations

12.3 Timeline Risks
Risk
Mitigation
MVP exceeds 6 weeks
• Cut polish ruthlessly, keep core learning loop<br>• Simplify UI to absolute minimum<br>• Use off-the-shelf components (shadcn/ui)<br>• Defer graph visualization to Phase 3
Data engineering delays Phase 4
• Phase 4 fully decoupled—doesn't block earlier phases<br>• Start PDF ingestion prep in parallel with Phase 3<br>• Have manual chunking fallback if automated fails
Scope creep
• Strict phase boundaries in brief<br>• Product owner approval required for additions<br>• "Park" nice-to-haves in backlog for Phase 5+<br>• Time-box features (kill if exceeding estimate)


13. Deliverables & Acceptance
13.1 Phase 1 (MVP) Deliverables
Software Artifacts:
Next.js web application with chat interface
Three agents implemented (Query, Reflection, Learning)
Memory system operational in Neo4j
Async pipeline via Inngest
Basic dashboard with learning curve
Langfuse integration for tracing
Documentation:
Architecture diagram (three-agent system)
Data model documentation (Neo4j schema with examples)
API documentation (tool interfaces, event schemas)
Demo script (step-by-step for stakeholders)
Setup guide (environment, dependencies, deployment)
README with quick start
Acceptance Criteria:
Functionality Requirements:
[ ] Agent successfully answers 20 curated curriculum queries
[ ] All answers include confidence scores (0-1) per claim
[ ] All answers include citations with node IDs
[ ] Memory node created in Neo4j for every interaction
[ ] Reflection agent evaluates every interaction within 30s
[ ] Learning agent extracts patterns from successful queries (score > 0.8)
[ ] Dashboard displays learning curve with upward trend
[ ] Memory retrieval provides 3 relevant past examples per query
Performance Requirements:
[ ] p50 latency ≤ 2 seconds (user-facing response time)
[ ] p95 latency ≤ 4 seconds (user-facing response time)
[ ] Cypher query success rate ≥ 85%
[ ] Async processing completes within 30 seconds (reflection + learning)
Quality Requirements:
[ ] Grounding rate ≥ 90% (claims with valid citations)
[ ] Average evaluation score ≥ 0.70 across test queries
[ ] Learning improvement ≥ 20% (compare first 10 vs last 10 interactions)
[ ] Confidence calibration r > 0.6 (correlation between confidence and correctness)
Demo Requirements:
[ ] Live demo runs without errors for 10 consecutive queries
[ ] Learning improvement visible within demo session
[ ] Agent traces accessible and understandable
[ ] Stakeholder feedback survey ≥ 4.0/5.0 average score
13.2 Phase 2 Deliverables
[ ] Multi-stage retrieval pipeline operational
[ ] Query cache with ≥ 40% hit rate demonstrated
[ ] Self-healing Cypher execution with auto-retry
[ ] Parallel tool execution for complex queries
[ ] Performance improvement: 30% latency reduction from Phase 1
[ ] Cache statistics in dashboard
13.3 Phase 3 Deliverables
[ ] Prerequisite path tool + interactive visualization
[ ] Misconception database integrated (if data available)
[ ] Pedagogy-aware answer generation with audience detection
[ ] Cross-curricular linking operational
[ ] Admin curriculum health dashboard
[ ] Difficulty calibration scores computed and displayed
13.4 Phase 4 Deliverables
[ ] PDF ingestion pipeline with semantic chunking
[ ] :Document/:Section/:Chunk nodes in Neo4j (1000+ chunks)
[ ] Vector index for chunks operational
[ ] Hybrid retrieval tool (vector + graph)
[ ] Layer system with Oak/DfE toggles in UI
[ ] Cross-layer alignment edges (manual curation tool)
[ ] Multi-source citations displayed in answers
[ ] Query Agent handles multiple layers correctly
13.5 Phase 5 Deliverables
[ ] Enhanced trace viewer with export functionality
[ ] Production monitoring dashboard with alerts
[ ] Conversational graph exploration UI
[ ] Memory visualization tool (admin)
[ ] Trace export API documented
[ ] Rate limiting implemented and tested
[ ] Comprehensive evaluation suite (100+ tests) running nightly
[ ] Full operational runbooks
[ ] Production launch approval 🚀
13.6 Success Vision
Week 6 Demo Scenario:
Educational stakeholders watch a live demonstration:
Interaction 1: Educator asks "What fractions concepts do Year 3 students learn?"


Agent answers with confidence-scored claims and citations
Educator clicks to see graph evidence
Educator provides feedback: "Well grounded!" 👍
Behind the scenes (shown in trace):


Reflection Agent evaluates answer (scores appear)
Learning Agent creates memory node (visible in dashboard)
Interaction 2: Later in session, educator asks "How does Year 3 fractions progression compare to Year 5?"


Agent retrieves memory from earlier interaction
Applies learned pattern for "compare year groups"
Provides richer, more comprehensive answer
Dashboard reveal:


Learning curve shows: Interaction 1 score = 0.67, Interaction 10 score = 0.85
27% improvement visible in real-time
Pattern library shows discovered strategies
Stakeholder reaction: "This is incredible—it actually learns from our questions!"


Key Takeaway: "This isn't just a chatbot. It's a curriculum assistant that gets smarter the more we use it, always grounded in our actual curriculum data."

Appendix A: Quick Reference
Three-Agent Roles Summary
Agent
Timing
Primary Function
Blocking?
Query
User interaction
Answer questions with confidence + citations
❌ Synchronous (user waits)
Reflection
After interaction
Evaluate quality on 5-dimension rubric
✅ Async (background)
Learning
After reflection
Create memory, extract patterns, consolidate
✅ Async (background)

Key Metrics at a Glance
Metric
Target Value
Learning improvement
≥20% in 50 interactions
Grounding rate
≥95%
Confidence calibration
r > 0.7
Response latency (p95)
≤4s
Async processing
≤30s
Cache hit rate
≥40%
Query success rate
≥85%
Memory quality
≥75% relevant

Tech Stack Summary
Frontend: Next.js 14 + Vercel AI SDK v5 (useChat hook)
Agents: Vercel AI SDK v5 (createAgent)
Models: o1-mini (Query, Reflection), GPT-4o-mini (Learning)
Embeddings: text-embedding-3-small (1536 dims)
Data: Neo4j AuraDB (graph + vectors) + PostgreSQL (logs)
Async: Inngest (event-driven jobs)
Observability: Langfuse (LLM tracing) + Vercel Analytics + Sentry
Expected Code Volume (MVP)
Component
Lines of Code
Query Agent
~100
Reflection Agent
~80
Learning Agent
~120
Memory retrieval
~50
Frontend (chat + dashboard)
~200
Total core logic
~550 lines

Note: SDK handles orchestration, streaming, tool calling, error handling—we write only business logic

Appendix B: Glossary
Agentic: Agent autonomously plans and decides actions (vs. hard-coded logic flow)
Claim-Level Citation: Each factual statement in an answer is individually linked to specific graph evidence
Confidence Score: 0-1 rating of certainty for each claim based on evidence strength
Cypher: Neo4j's graph query language (similar to SQL but for graphs)
Episodic Memory: Specific Q&A interaction record stored as :Memory node
Few-Shot Learning: Using past successful examples to guide current behavior (core learning mechanism)
Grounding: Ensuring claims are supported by graph evidence (opposite of hallucination)
Hybrid Retrieval: Combining vector similarity search with graph traversal for richer context
Layer: Data source partition (e.g., 'oak_curriculum_data', 'dfe_curriculum_data') for version control and filtering
LLM-as-Judge: Using an LLM to evaluate another LLM's output quality
Memory Consolidation: Clustering similar episodic memories into semantic patterns
Pattern Extraction: Identifying reusable Cypher query strategies from successful interactions
Procedural Memory: Learned query patterns stored as :QueryPattern nodes
Query Repair: Automatic fixing of failed Cypher queries through LLM-guided correction
Self-RAG: Agent decides whether to retrieve information before answering (vs. always retrieving)
Semantic Chunking: Splitting documents at topic boundaries (vs. fixed character counts)
Semantic Memory: Distilled knowledge from multiple episodic memories (consolidated patterns)
Vector Index: Database structure enabling similarity search over embeddings

Document Version: 2.0
 Last Updated: 2025-10-16
 Owner: Product Team
 Status: Ready for Development
Core Philosophy: Maximize use of Vercel AI SDK v5 for minimal code. Three-agent architecture from day 1. Learning loop is the product, not a feature.



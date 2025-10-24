# ARCHITECTURE.md

**Oak Curriculum Agent - Phase 1 MVP**
Technical Architecture Specification

Version: 1.0
Scope: Phase 1 Only (4-6 week MVP)
See: `FUNCTIONAL.md` for user requirements, `CLAUDE.md` for development standards

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ Home Page  │→ │ Chat Page  │  │ Dashboard Page     │   │
│  │ (/)        │  │ (/chat)    │  │ (/dashboard)       │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 (VERCEL)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               API ROUTES (App Router)                │  │
│  │  /api/chat          - Query Agent (streamText)       │  │
│  │  /api/inngest       - Inngest webhook endpoint       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            LIB (Business Logic)                      │  │
│  │  agents/            - Agent functions                │  │
│  │  memory/            - Retrieval + embeddings         │  │
│  │  mcp/               - Neo4j MCP client               │  │
│  │  database/          - Supabase client                │  │
│  │  inngest/           - Event functions                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   NEO4J AURADB  │  │ SUPABASE        │  │  INNGEST CLOUD  │
│                 │  │ POSTGRES        │  │                 │
│ - Curriculum    │  │                 │  │ - Event Queue   │
│ - :Memory nodes │  │ - interactions  │  │ - Job Retry     │
│ - :QueryPattern │  │ - feedback      │  │ - Dead Letter   │
│ - Vectors       │  │ - metrics       │  │ - Observability │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        ↑                                           ↓
        │                                           │
        └───────────────────────────────────────────┘
           Learning Agent writes to Neo4j via MCP
```

### 1.2 Three-Agent Flow

```
USER QUERY
    ↓
┌─────────────────────────────────────────────┐
│  QUERY AGENT (Synchronous)                  │
│  1. Retrieve 3 similar memories (vector)    │
│  2. Build system prompt with few-shot       │
│  3. streamText() with MCP tools             │
│  4. Generate answer from curriculum data    │
│  5. Stream response to user                 │
│  6. Emit "interaction.complete" event ──────┼──┐
└─────────────────────────────────────────────┘  │
                                                  │
                                         (non-blocking)
                                                  │
                                                  ▼
                              ┌────────────────────────────┐
                              │    INNGEST EVENT QUEUE     │
                              └────────────────────────────┘
                                      │          │
                          ┌───────────┘          └───────────┐
                          ▼                                  ▼
            ┌──────────────────────────┐      ┌──────────────────────────┐
            │  REFLECTION AGENT (Async)│      │  (waits for reflection)  │
            │  1. Receive event        │      │                          │
            │  2. generateObject()     │      │                          │
            │  3. Evaluate on rubric   │      │                          │
            │  4. Save to Supabase     │      │                          │
            │  5. Emit "reflection.    │──────▶  LEARNING AGENT (Async)  │
            │     complete" event      │      │  1. Create :Memory node  │
            └──────────────────────────┘      │  2. Link evidence        │
                                              │  3. Extract patterns     │
                                              │  4. Find similar memories│
                                              └──────────────────────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────────────┐
                                              │  NEO4J AURADB            │
                                              │  Memory written via MCP  │
                                              │  Available for next query│
                                              └──────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Core Framework
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | TypeScript | 5.x | Type-safe development |
| **Framework** | Next.js | 15.5+ | React framework, App Router |
| **React** | React | 19.1+ | UI library |
| **Build** | Turbopack | - | Fast builds (Next.js 15) |
| **Package Manager** | pnpm | 9.x | Fast, efficient installs |

### 2.2 AI & LLM
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **AI SDK** | Vercel AI SDK | 5.0+ | Agent orchestration, streaming |
| **Query Agent** | OpenAI GPT-4o | Fast, high-quality responses |
| **Reflection Agent** | OpenAI GPT-4o | Structured evaluation |
| **Learning Agent** | OpenAI gpt-4o-mini | Cost-effective data ops |
| **Embeddings** | text-embedding-3-small | 1536-dim vectors for similarity |

### 2.3 Data Storage
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Graph DB** | Neo4j AuraDB | Curriculum graph + memory nodes |
| **Relational DB** | Supabase Postgres | Analytics, logs, feedback |
| **MCP Server** | Neo4j MCP (Cloud Run) | Write-enabled graph access |
| **Vector Search** | Neo4j native | Similarity search on embeddings |

### 2.4 Async Processing
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Job Queue** | Inngest Cloud | Event-driven async workflows |
| **Event Patterns** | Pub/Sub | Loose coupling between agents |

### 2.5 UI & Styling
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Styling** | Tailwind CSS | v4, utility-first |
| **Components** | shadcn/ui | New York style, neutral theme |
| **Icons** | Lucide React | Icon library |
| **Charts** | Tremor | Analytics dashboard |
| **Syntax** | Shiki | Code highlighting (Cypher) |

### 2.6 Deployment
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Vercel | Serverless Next.js deployment |
| **Database** | Supabase Cloud | Managed Postgres |
| **Graph DB** | Neo4j AuraDB | Managed Neo4j |
| **Jobs** | Inngest Cloud | Managed job queue |

---

## 3. Project Structure

```
curriculum-agent-v2/
├── app/
│   ├── page.tsx                     # Home page (model selector)
│   ├── layout.tsx                   # Root layout
│   ├── chat/
│   │   └── page.tsx                 # Chat interface
│   ├── dashboard/
│   │   └── page.tsx                 # Analytics dashboard
│   └── api/
│       ├── chat/
│       │   └── route.ts             # Query Agent endpoint
│       └── inngest/
│           └── route.ts             # Inngest webhook
│
├── components/
│   ├── home/
│   │   ├── model-selector.tsx       # LLM dropdown
│   │   ├── model-params.tsx         # Temperature, max tokens
│   │   └── app-description.tsx      # What the agent does
│   ├── chat/
│   │   ├── chat-interface.tsx       # Main chat UI
│   │   ├── message-list.tsx         # Scrollable messages
│   │   ├── message-item.tsx         # Single message
│   │   ├── agent-trace-panel.tsx    # Collapsible trace
│   │   ├── feedback-controls.tsx    # 👍/👎, note (auto-save)
│   │   └── prompt-input.tsx         # Message input (existing)
│   ├── dashboard/
│   │   ├── learning-curve.tsx       # Tremor line chart
│   │   ├── stats-cards.tsx          # Total/avg/memory stats
│   │   ├── interactions-table.tsx   # Recent 20 interactions
│   │   └── pattern-library.tsx      # Discovered patterns
│   ├── ui/                          # shadcn/ui components
│   └── ai-elements/                 # AI SDK elements
│
├── lib/
│   ├── agents/
│   │   ├── query-agent.ts           # Query Agent logic
│   │   ├── reflection-agent.ts      # Evaluation logic
│   │   ├── learning-agent.ts        # Memory creation logic
│   │   └── prompts/
│   │       ├── query-prompt.ts      # System prompt builder
│   │       └── reflection-prompt.ts # Evaluation rubric
│   ├── memory/
│   │   ├── retrieval.ts             # Vector similarity search
│   │   ├── embeddings.ts            # OpenAI embedding calls
│   │   └── types.ts                 # Memory interfaces
│   ├── mcp/
│   │   ├── client/
│   │   │   ├── neo4j-client.ts      # MCP client (existing)
│   │   │   └── types.ts             # MCP types
│   │   ├── tools/
│   │   │   └── cypher-tool.ts       # Cypher execution wrapper
│   │   └── index.ts                 # Exports
│   ├── database/
│   │   ├── supabase.ts              # Supabase client singleton
│   │   ├── schema.ts                # Table definitions
│   │   └── queries.ts               # Common SQL queries
│   ├── inngest/
│   │   ├── client.ts                # Inngest client singleton
│   │   ├── events.ts                # Event type definitions
│   │   └── functions/
│   │       ├── reflection.ts        # Reflection function
│   │       └── learning.ts          # Learning function
│   ├── types/
│   │   ├── agent.ts                 # Agent interfaces
│   │   ├── evaluation.ts            # Evaluation score types
│   │   └── index.ts                 # Exports
│   └── utils.ts                     # Shared utilities
│
├── docs/
│   └── test-queries.md              # 20 curated test queries
│
├── FUNCTIONAL.md                    # This file
├── ARCHITECTURE.md                  # Technical spec
├── CLAUDE.md                        # Dev standards
├── BRIEF.md                         # Full project vision
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local                       # Environment variables
```

---

## 4. Data Models

### 4.1 Neo4j Schema

#### Existing Nodes (Read-Only)
```cypher
(:Objective {
  id: string,
  code: string,
  title: string,
  description: string,
  year: integer,
  subject: string
})

(:Strand {
  id: string,
  name: string,
  subject: string
})

(:Concept {
  id: string,
  name: string,
  description: string
})

// Existing relationships
(:Objective)-[:PART_OF]->(:Strand)
(:Objective)-[:REQUIRES]->(:Objective)  // Prerequisites
(:Objective)-[:TEACHES]->(:Concept)
```

#### New Nodes (Phase 1 - Written by Learning Agent)
```cypher
(:Memory {
  id: string,                    // UUID
  type: "episodic",              // Always episodic in Phase 1
  user_query: string,            // Original user question
  final_answer: string,          // Agent's response
  cypher_used: string[],         // Array of Cypher queries

  // Evaluation scores (from Reflection Agent) - 4 dimensions
  accuracy_score: float,         // 0.0-1.0 (40% weight)
  completeness_score: float,     // 0.0-1.0 (30% weight)
  pedagogy_score: float,         // 0.0-1.0 (20% weight)
  clarity_score: float,          // 0.0-1.0 (10% weight)
  overall_score: float,          // Weighted average

  evaluator_notes: string,       // LLM-as-judge feedback
  embedding: float[1536],        // text-embedding-3-small
  memories_used: string[],       // IDs of memories used as few-shot

  created_at: datetime,
  updated_at: datetime
})

(:QueryPattern {
  id: string,                    // UUID
  name: string,                  // e.g., "objectives_by_year"
  description: string,           // Human-readable
  cypher_template: string,       // Parameterized Cypher
  success_count: integer,        // Times used successfully
  failure_count: integer,        // Times failed
  created_at: datetime,
  updated_at: datetime
})
```

#### New Relationships (Phase 1)
```cypher
// Memory → Evidence
(:Memory)-[:USED_EVIDENCE]->(curriculum_node)
// Links memory to specific graph nodes cited

// Memory → Pattern
(:Memory)-[:APPLIED_PATTERN]->(:QueryPattern)
// Links memory to pattern used

// Memory → Memory
(:Memory)-[:SIMILAR_TO {similarity: float}]->(:Memory)
// Similarity links for future retrieval optimization
```

#### Vector Indexes
```cypher
// Create vector index for memory retrieval
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

### 4.2 Supabase Postgres Schema

#### Tables

**interactions**
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_query TEXT NOT NULL,
  final_answer TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,           -- e.g., 'gpt-4o'
  temperature FLOAT NOT NULL,
  cypher_queries JSONB,                       -- Array of queries used
  tool_calls JSONB,                           -- Full tool call log
  latency_ms INTEGER,                         -- Response time
  step_count INTEGER,                         -- Number of agent steps
  memory_id UUID,                             -- Corresponding Neo4j :Memory id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX idx_interactions_memory ON interactions(memory_id);
```

**feedback**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  thumbs_up BOOLEAN,                          -- TRUE=👍, FALSE=👎, NULL=none
  note TEXT,                                  -- Optional user note (max 500 chars)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_interaction ON feedback(interaction_id);
```

**evaluation_metrics** (Pre-aggregated for dashboard)
```sql
CREATE TABLE evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  accuracy_score FLOAT NOT NULL,              -- 40% weight
  completeness_score FLOAT NOT NULL,          -- 30% weight
  pedagogy_score FLOAT NOT NULL,              -- 20% weight
  clarity_score FLOAT NOT NULL,               -- 10% weight
  overall_score FLOAT NOT NULL,               -- Weighted average
  evaluator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_interaction ON evaluation_metrics(interaction_id);
CREATE INDEX idx_metrics_overall ON evaluation_metrics(overall_score);
```

**memory_stats** (Cached stats for dashboard)
```sql
CREATE TABLE memory_stats (
  id SERIAL PRIMARY KEY,
  total_memories INTEGER NOT NULL,
  avg_overall_score FLOAT NOT NULL,
  total_patterns INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Single row table, updated by Learning Agent
```

### 4.3 TypeScript Interfaces

**lib/types/agent.ts**
```typescript
import type { CoreMessage } from 'ai';

export interface AgentContext {
  messages: CoreMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface QueryAgentResult {
  answer: string;
  cypherQueries: string[];
  stepCount: number;
  latencyMs: number;
}
```

**lib/types/memory.ts**
```typescript
export interface Memory {
  id: string;
  type: 'episodic';
  userQuery: string;
  finalAnswer: string;
  cypherUsed: string[];
  accuracyScore: number;
  completenessScore: number;
  pedagogyScore: number;
  clarityScore: number;
  overallScore: number;
  evaluatorNotes: string;
  embedding: number[];
  memoriesUsed: string[];
  createdAt: Date;
}

export interface QueryPattern {
  id: string;
  name: string;
  description: string;
  cypherTemplate: string;
  successCount: number;
  failureCount: number;
}
```

**lib/types/evaluation.ts**
```typescript
import { z } from 'zod';

export const EvaluationSchema = z.object({
  accuracy: z.number().min(0).max(1),       // 40% weight
  completeness: z.number().min(0).max(1),   // 30% weight
  pedagogy: z.number().min(0).max(1),       // 20% weight
  clarity: z.number().min(0).max(1),        // 10% weight
  overall: z.number().min(0).max(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;
```

---

## 5. API Endpoints

### 5.1 Query Agent (Chat)

**Endpoint**: `POST /api/chat`

**Request Body**:
```typescript
{
  messages: CoreMessage[];  // AI SDK format
  model: string;            // 'gpt-4o' | 'gpt-4o-mini' | 'gpt-5'
  temperature: number;      // 0.0-1.0
  maxTokens: number;        // 500-4000
}
```

**Response**: Server-Sent Events (SSE) stream
```typescript
// AI SDK useChat compatible stream
// Contains: text deltas, tool calls, final response
```

**Implementation Pattern**:
```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { messages, model, temperature, maxTokens } = await req.json();

  // 1. Retrieve similar memories
  const memories = await retrieveSimilarMemories(
    messages[messages.length - 1].content
  );

  // 2. Build system prompt with few-shot examples
  const systemPrompt = buildQueryPrompt(schema, memories);

  // 3. Get MCP tools
  const tools = await getMCPTools();

  // 4. Stream response
  const result = streamText({
    model: openai(model),
    system: systemPrompt,
    messages,
    tools,
    temperature,
    maxTokens,
    maxSteps: 10,
  });

  // 5. Emit event (non-blocking)
  result.onFinish(async (result) => {
    await inngest.send({
      name: 'interaction.complete',
      data: { /* interaction data */ }
    });
  });

  return result.toDataStreamResponse();
}
```

### 5.2 Inngest Webhook

**Endpoint**: `POST /api/inngest`, `GET /api/inngest`, `PUT /api/inngest`

**Purpose**: Inngest SDK auto-generates these for webhook communication

**Implementation**:
```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { reflectionFunction } from '@/lib/inngest/functions/reflection';
import { learningFunction } from '@/lib/inngest/functions/learning';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    reflectionFunction,
    learningFunction,
  ],
});
```

---

## 6. Agent Implementation Details

### 6.1 Query Agent

**File**: `lib/agents/query-agent.ts`

**Purpose**: User-facing agent that answers curriculum questions

**Key Functions**:

```typescript
/**
 * Retrieves similar high-quality memories for few-shot learning
 */
export async function retrieveSimilarMemories(
  query: string,
  limit: number = 3
): Promise<Memory[]> {
  // 1. Generate embedding for query
  const embedding = await generateEmbedding(query);

  // 2. Vector search in Neo4j
  const cypher = `
    CALL db.index.vector.queryNodes('memory_embeddings', $limit, $embedding)
    YIELD node, score
    WHERE node.overall_score > 0.75
    RETURN node, score
    ORDER BY score DESC
  `;

  // 3. Execute via MCP
  const result = await mcpClient.executeCypher(cypher, { embedding, limit });

  // 4. Parse and return
  return parseMemories(result);
}

/**
 * Builds system prompt with schema and few-shot examples
 */
export function buildQueryPrompt(
  schema: GraphSchema,
  memories: Memory[]
): string {
  return `
You are an expert curriculum assistant with access to the UK National Curriculum knowledge graph.

# Your Capabilities
- Query the Neo4j graph using the read_neo4j_cypher tool
- You can call the tool multiple times to explore different parts of the graph
- Always ground your answers in graph data

# Graph Schema
${formatSchema(schema)}

# Similar Past Successful Interactions (Learn from these)
${formatFewShotExamples(memories)}

# Instructions
1. Analyze the user's question carefully
2. Retrieve relevant memories to guide your approach
3. Generate appropriate Cypher queries
4. Execute queries using the read_neo4j_cypher tool (call multiple times if needed)
5. Synthesize the results into a clear answer

Always prioritize accuracy over completeness. If you're unsure, say so.
`;
}

/**
 * Formats memories as few-shot examples
 */
function formatFewShotExamples(memories: Memory[]): string {
  return memories.map((m, i) => `
## Example ${i + 1} (Success rate: ${m.overallScore.toFixed(2)})
User Query: "${m.userQuery}"
Cypher Used: ${m.cypherUsed[0]}
Answer: "${m.finalAnswer.substring(0, 200)}..."
Why it worked: ${m.evaluatorNotes}
`).join('\n');
}
```

**AI SDK Integration**:
```typescript
// In API route
const result = streamText({
  model: openai(model),
  system: buildQueryPrompt(schema, memories),
  messages,
  tools: {
    read_neo4j_cypher: cypherTool,
  },
  temperature,
  maxTokens,
  maxSteps: 10,
});
```

### 6.2 Reflection Agent

**File**: `lib/inngest/functions/reflection.ts`

**Purpose**: Async evaluation of interaction quality

**Implementation**:
```typescript
import { inngest } from '@/lib/inngest/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { EvaluationSchema } from '@/lib/types/evaluation';

export const reflectionFunction = inngest.createFunction(
  {
    id: 'reflection-agent',
    name: 'Reflection Agent - Evaluate Interaction',
    retries: 3,
  },
  { event: 'interaction.complete' },
  async ({ event, step }) => {
    const { query, answer, cypherQueries, graphResults } = event.data;

    // Step 1: Evaluate using LLM-as-judge
    const evaluation = await step.run('evaluate-interaction', async () => {
      const prompt = buildEvaluationPrompt(
        query,
        answer,
        cypherQueries,
        graphResults
      );

      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: EvaluationSchema,
        prompt,
      });

      return result.object;
    });

    // Step 2: Calculate overall score (weighted)
    const overallScore =
      evaluation.accuracy * 0.40 +
      evaluation.completeness * 0.30 +
      evaluation.pedagogy * 0.20 +
      evaluation.clarity * 0.10;

    // Step 3: Save to Supabase
    await step.run('save-evaluation', async () => {
      await supabase.from('evaluation_metrics').insert({
        interaction_id: event.data.interactionId,
        accuracy_score: evaluation.accuracy,
        completeness_score: evaluation.completeness,
        pedagogy_score: evaluation.pedagogy,
        clarity_score: evaluation.clarity,
        overall_score: overallScore,
        evaluator_notes: JSON.stringify({
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          suggestions: evaluation.suggestions,
        }),
      });
    });

    // Step 4: Emit event for Learning Agent
    await step.sendEvent('trigger-learning', {
      name: 'reflection.complete',
      data: {
        ...event.data,
        evaluation: { ...evaluation, overall: overallScore },
      },
    });

    return { success: true, overallScore };
  }
);

/**
 * Builds evaluation prompt with rubric
 */
function buildEvaluationPrompt(
  query: string,
  answer: string,
  cypherQueries: string[],
  graphResults: any[]
): string {
  return `
You are an expert evaluator assessing the quality of an AI curriculum assistant's response.

# User Query
"${query}"

# Agent's Answer
"${answer}"

# Cypher Queries Used
${cypherQueries.join('\n')}

# Graph Results
${JSON.stringify(graphResults, null, 2)}

# Evaluation Rubric (score 0.0-1.0 for each)

## Accuracy (40% weight)
- 1.0: Completely accurate per curriculum data
- 0.7: Minor inaccuracies that don't affect core message
- 0.4: Significant factual errors
- 0.0: Fundamentally incorrect information

## Completeness (30% weight)
- 1.0: Comprehensive, addresses all aspects of the query
- 0.7: Answers main question, some gaps
- 0.4: Partial answer, missing key elements
- 0.0: Doesn't answer the question

## Pedagogy (20% weight)
- 1.0: Excellent pedagogical framing for educators
- 0.7: Good, appropriate for curriculum context
- 0.4: Lacks proper curriculum context
- 0.0: Inappropriate or misleading for educators

## Clarity (10% weight)
- 1.0: Crystal clear, well-structured
- 0.7: Clear with minor ambiguities
- 0.4: Somewhat confusing
- 0.0: Unclear or contradictory

Provide:
- Scores for each dimension
- 3 strengths
- 3 weaknesses
- 3 suggestions for improvement
`;
}
```

### 6.3 Learning Agent

**File**: `lib/inngest/functions/learning.ts`

**Purpose**: Create memories, extract patterns, update graph

**Implementation**:
```typescript
import { inngest } from '@/lib/inngest/client';
import { generateEmbedding } from '@/lib/memory/embeddings';
import { mcpClient } from '@/lib/mcp';

export const learningFunction = inngest.createFunction(
  {
    id: 'learning-agent',
    name: 'Learning Agent - Create Memory',
    retries: 3,
  },
  { event: 'reflection.complete' },
  async ({ event, step }) => {
    const { query, answer, cypherQueries, evaluation, evidenceNodeIds } = event.data;

    // Step 1: Generate embedding for query
    const embedding = await step.run('generate-embedding', async () => {
      return await generateEmbedding(query);
    });

    // Step 2: Create :Memory node in Neo4j
    const memoryId = await step.run('create-memory-node', async () => {
      const cypher = `
        CREATE (m:Memory {
          id: randomUUID(),
          type: 'episodic',
          user_query: $query,
          final_answer: $answer,
          cypher_used: $cypherQueries,
          accuracy_score: $evaluation.accuracy,
          completeness_score: $evaluation.completeness,
          pedagogy_score: $evaluation.pedagogy,
          clarity_score: $evaluation.clarity,
          overall_score: $evaluation.overall,
          evaluator_notes: $evaluatorNotes,
          embedding: $embedding,
          memories_used: $memoriesUsed,
          created_at: datetime(),
          updated_at: datetime()
        })
        RETURN m.id as id
      `;

      const result = await mcpClient.executeCypher(cypher, {
        query,
        answer,
        cypherQueries,
        evaluation: evaluation,
        evaluatorNotes: JSON.stringify(evaluation),
        embedding,
        memoriesUsed: event.data.memoriesUsed || [],
      });

      return result[0].id;
    });

    // Step 3: Link to evidence nodes
    await step.run('link-evidence', async () => {
      const cypher = `
        MATCH (m:Memory {id: $memoryId})
        UNWIND $evidenceNodeIds as nodeId
        MATCH (n) WHERE n.id = nodeId
        CREATE (m)-[:USED_EVIDENCE]->(n)
      `;

      await mcpClient.executeCypher(cypher, {
        memoryId,
        evidenceNodeIds,
      });
    });

    // Step 4: Extract pattern if high quality
    if (evaluation.overall > 0.8) {
      await step.run('extract-pattern', async () => {
        // Simple pattern extraction: hash Cypher structure
        const patternName = hashCypherPattern(cypherQueries[0]);

        const cypher = `
          MERGE (p:QueryPattern {name: $patternName})
          ON CREATE SET
            p.id = randomUUID(),
            p.description = $description,
            p.cypher_template = $cypherTemplate,
            p.success_count = 1,
            p.failure_count = 0,
            p.created_at = datetime()
          ON MATCH SET
            p.success_count = p.success_count + 1,
            p.updated_at = datetime()

          WITH p
          MATCH (m:Memory {id: $memoryId})
          CREATE (m)-[:APPLIED_PATTERN]->(p)
        `;

        await mcpClient.executeCypher(cypher, {
          patternName,
          description: `Pattern for: ${query}`,
          cypherTemplate: cypherQueries[0],
          memoryId,
        });
      });
    }

    // Step 5: Find similar memories (for future optimization)
    await step.run('link-similar-memories', async () => {
      const cypher = `
        MATCH (m:Memory {id: $memoryId})
        CALL db.index.vector.queryNodes('memory_embeddings', 5, m.embedding)
        YIELD node, score
        WHERE node.id <> $memoryId AND score > 0.8
        CREATE (m)-[:SIMILAR_TO {similarity: score}]->(node)
      `;

      await mcpClient.executeCypher(cypher, { memoryId });
    });

    // Step 6: Update stats cache in Supabase
    await step.run('update-stats', async () => {
      // Count memories and patterns
      const statsCypher = `
        MATCH (m:Memory)
        WITH count(m) as memoryCount, avg(m.overall_score) as avgScore
        MATCH (p:QueryPattern)
        RETURN memoryCount, avgScore, count(p) as patternCount
      `;

      const stats = await mcpClient.executeCypher(statsCypher);

      await supabase.from('memory_stats').upsert({
        id: 1,
        total_memories: stats[0].memoryCount,
        avg_overall_score: stats[0].avgScore,
        total_patterns: stats[0].patternCount,
        last_updated: new Date(),
      });
    });

    return { success: true, memoryId };
  }
);

/**
 * Hashes Cypher query to identify pattern
 */
function hashCypherPattern(cypher: string): string {
  // Simple heuristic: extract MATCH pattern
  const match = cypher.match(/MATCH\s+\(([^)]+)\)/i);
  if (!match) return 'unknown';

  // Normalize to pattern name
  return match[1]
    .replace(/\{[^}]+\}/g, '') // Remove filters
    .replace(/\s+/g, '_')
    .toLowerCase();
}
```

---

## 7. Error Handling Strategy

### 7.1 Query Agent (User-Facing)

**Principle**: Never show raw errors to users

```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  try {
    // ... agent logic
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Query Agent failed:', error);

    // Log to Supabase for debugging
    await logError('query-agent', error, { /* context */ });

    // Return graceful fallback
    return new Response(
      JSON.stringify({
        error: 'I apologize, I\'m having trouble accessing the curriculum data right now. Please try again.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Cypher Tool Error Handling**:
```typescript
// lib/mcp/tools/cypher-tool.ts
export const cypherTool = {
  description: 'Execute read-only Cypher queries',
  parameters: cypherParamsSchema,
  execute: async (args: { query: string }) => {
    try {
      const result = await mcpClient.executeCypher(args.query);
      return {
        success: true,
        data: result,
        count: result.length,
      };
    } catch (error) {
      console.error('Cypher execution failed:', error);

      // Return structured error for agent
      return {
        success: false,
        error: 'Query failed. Try simplifying or checking syntax.',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
```

### 7.2 Reflection Agent (Async)

**Principle**: Don't block pipeline, use default scores if LLM fails

```typescript
export const reflectionFunction = inngest.createFunction(
  {
    id: 'reflection-agent',
    retries: 3,
    onFailure: async ({ error, event }) => {
      // Log failure
      await supabase.from('agent_errors').insert({
        agent: 'reflection',
        event_id: event.id,
        error: error.message,
        timestamp: new Date(),
      });

      // Continue pipeline with default scores
      await inngest.send({
        name: 'reflection.complete',
        data: {
          ...event.data,
          evaluation: getDefaultEvaluation(),
        },
      });
    },
  },
  { event: 'interaction.complete' },
  async ({ event, step }) => {
    // ... evaluation logic with fallback
    const evaluation = await step.run('evaluate', async () => {
      try {
        return await evaluateInteraction(event.data);
      } catch (error) {
        console.error('Evaluation failed:', error);
        return getDefaultEvaluation();
      }
    });

    // ... rest of function
  }
);

function getDefaultEvaluation(): Evaluation {
  return {
    accuracy: 0.5,
    completeness: 0.5,
    pedagogy: 0.5,
    clarity: 0.5,
    overall: 0.5,
    strengths: [],
    weaknesses: ['Evaluation failed, using defaults'],
    suggestions: [],
  };
}
```

### 7.3 Learning Agent (Async)

**Principle**: Granular retry, preserve partial success

```typescript
export const learningFunction = inngest.createFunction(
  {
    id: 'learning-agent',
    retries: 3,
  },
  { event: 'reflection.complete' },
  async ({ event, step }) => {
    // Each step retries independently
    const memoryId = await step.run('create-memory', async () => {
      return await createMemoryNode(event.data);
    });

    // If memory creation succeeds but linking fails, we still have memory
    await step.run('link-evidence', async () => {
      return await linkEvidence(memoryId, event.data.evidenceNodeIds)
        .catch(error => {
          console.error('Evidence linking failed:', error);
          // Don't throw - memory still valid
        });
    });

    // Pattern extraction is optional
    await step.run('extract-patterns', async () => {
      return await extractPatterns(memoryId, event.data)
        .catch(error => {
          console.error('Pattern extraction failed:', error);
          // Don't throw - not critical
        });
    });

    return { success: true, memoryId };
  }
);
```

---

## 8. Environment Variables

**File**: `.env.local` (not committed)

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Neo4j MCP Server
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # For server-side operations

# Inngest
INNGEST_EVENT_KEY=...                 # From Inngest dashboard
INNGEST_SIGNING_KEY=...               # For webhook verification

# Development
NODE_ENV=development
```

**File**: `.env.example` (committed)

```bash
# Copy to .env.local and fill in values

OPENAI_API_KEY=
NEO4J_MCP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
NODE_ENV=development
```

---

## 9. Deployment Architecture

### 9.1 Vercel Deployment

**Configuration**: `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["iad1"],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "NEO4J_MCP_URL": "@neo4j-mcp-url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "INNGEST_EVENT_KEY": "@inngest-event-key",
    "INNGEST_SIGNING_KEY": "@inngest-signing-key"
  }
}
```

**Build Settings**:
- Framework: Next.js
- Build command: `pnpm build --turbopack`
- Output directory: `.next`
- Install command: `pnpm install`
- Node version: 20.x

### 9.2 External Services

**Neo4j AuraDB**
- Existing instance with curriculum data
- Add vector index for memory embeddings
- Configure write permissions for MCP

**Supabase**
- Create project
- Run schema migrations
- Configure connection pooling
- Set up row-level security (Phase 2+)

**Inngest Cloud**
- Create account (free tier)
- Configure webhook URL: `https://your-app.vercel.app/api/inngest`
- Set signing key in environment

---

## 10. Performance Optimization

### 10.1 Query Agent Optimizations

**Memory Retrieval Caching**
- Cache schema in memory (rarely changes)
- Pre-compute common embeddings
- Limit vector search results (top 3)

**MCP Connection Pooling**
- Singleton pattern (already implemented)
- Keep connection alive between requests
- Handle reconnection gracefully

**Streaming**
- Start streaming immediately (don't wait for full response)
- Stream tool call status to user
- Use AI SDK's built-in backpressure handling

### 10.2 Dashboard Optimizations

**Data Pre-Aggregation**
- Learning Agent updates `memory_stats` table
- Dashboard queries pre-aggregated data (not raw)
- Cache dashboard queries for 30s

**Lazy Loading**
- Load charts only when dashboard page opens
- Paginate interactions table (20 at a time)
- Defer pattern library loading

### 10.3 Database Optimizations

**Neo4j**
- Indexes on frequently queried properties:
  - `Memory.overall_score`
  - `Memory.created_at`
  - `QueryPattern.name`
- Vector index optimized for cosine similarity
- Limit graph traversal depth (max 3 hops)

**Supabase**
- Indexes on:
  - `interactions.created_at`
  - `evaluation_metrics.overall_score`
- Connection pooling enabled
- Use prepared statements

---

## 11. Security Considerations

### 11.1 Phase 1 (Development Mode)

**Acceptable for MVP**:
- No user authentication
- Neo4j MCP server publicly accessible (read + write)
- No rate limiting
- No input sanitization (beyond Zod)

**Rationale**: 4-6 week timeline, demo purposes, controlled access

### 11.2 Phase 2+ (Production)

**Must Add**:
- Cloud Run IAM authentication for MCP
- User authentication (Supabase Auth)
- Rate limiting (per IP)
- Input validation (max length, SQL injection prevention)
- CORS configuration
- API key rotation

---

## 12. Monitoring & Observability

### 12.1 Phase 1 Monitoring

**Built-In**:
- Vercel Analytics (page views, latency)
- Inngest Dashboard (job status, retries, failures)
- Supabase Logs (query performance)
- Console logs (streamed to Vercel logs)

**Manual Checks**:
- Dashboard metrics (learning curve, success rate)
- Neo4j browser (memory node count)
- Supabase tables (interaction count)

### 12.2 Key Metrics to Track

**Query Agent**:
- Response latency (p50, p95, p99)
- Cypher success rate
- Step count per query

**Async Agents**:
- Reflection completion time
- Learning completion time
- Retry count
- Failure rate

**Learning Loop**:
- Memory growth rate
- Average evaluation score over time
- Pattern extraction rate
- Memory retrieval relevance

---

**Document Status**: Task 34 Complete - Simplified System (4-Dimension Rubric)
**Last Updated**: 2025-10-24
**Dependencies**: FUNCTIONAL.md, CLAUDE.md, BRIEF.md

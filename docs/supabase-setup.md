# Supabase Database Setup Guide

**Oak Curriculum Agent - Phase 1 MVP**

This guide provides step-by-step instructions for setting up the Supabase PostgreSQL database for the Oak Curriculum Agent.

---

## Overview

The Supabase database stores analytics, logs, and user feedback for the learning agent system. It works alongside Neo4j (curriculum graph + memories) to provide:

- **Interaction logs**: Full audit trail of all queries and responses
- **User feedback**: Thumbs up/down, grounded checkbox, optional notes
- **Evaluation metrics**: Reflection Agent quality scores (5-dimension rubric)
- **Cached statistics**: Pre-aggregated dashboard data

---

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com (free tier sufficient for Phase 1)
2. **Project Created**: Create a new Supabase project
3. **Connection Details**: Note your project URL and API keys from Project Settings → API

Required environment variables (from `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Quick Setup (Recommended)

**Copy-paste the following SQL into your Supabase SQL Editor and run it:**

This creates all 4 tables with indexes and initializes the `memory_stats` cache.

```sql
-- Oak Curriculum Agent - Phase 1 Database Schema
-- Safe to run multiple times (uses IF NOT EXISTS)

-- =====================================================
-- INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_query TEXT NOT NULL,
  final_answer TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  temperature FLOAT NOT NULL,
  confidence_overall FLOAT,
  grounding_rate FLOAT,
  cypher_queries JSONB,
  tool_calls JSONB,
  latency_ms INTEGER,
  step_count INTEGER,
  memory_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chronological queries (dashboard)
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);

-- Index for linking to Neo4j memories
CREATE INDEX IF NOT EXISTS idx_interactions_memory ON interactions(memory_id);

-- Index for model performance analysis
CREATE INDEX IF NOT EXISTS idx_interactions_model ON interactions(model_used);

COMMENT ON TABLE interactions IS 'Main interaction logs with query, answer, and metadata';
COMMENT ON COLUMN interactions.user_query IS 'User''s original question';
COMMENT ON COLUMN interactions.final_answer IS 'Agent''s complete response';
COMMENT ON COLUMN interactions.model_used IS 'LLM model name (e.g., gpt-4o)';
COMMENT ON COLUMN interactions.temperature IS 'Model temperature setting (0.0-1.0)';
COMMENT ON COLUMN interactions.confidence_overall IS 'Weighted average confidence score (0.0-1.0)';
COMMENT ON COLUMN interactions.grounding_rate IS 'Percentage of claims with citations (0.0-1.0)';
COMMENT ON COLUMN interactions.cypher_queries IS 'Array of Cypher queries executed';
COMMENT ON COLUMN interactions.tool_calls IS 'Full tool call log from AI SDK';
COMMENT ON COLUMN interactions.latency_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN interactions.step_count IS 'Number of agent steps (tool calls)';
COMMENT ON COLUMN interactions.memory_id IS 'Corresponding Neo4j :Memory node UUID';

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  thumbs_up BOOLEAN,
  well_grounded BOOLEAN,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for joining with interactions
CREATE INDEX IF NOT EXISTS idx_feedback_interaction ON feedback(interaction_id);

-- Index for feedback analysis
CREATE INDEX IF NOT EXISTS idx_feedback_thumbs ON feedback(thumbs_up) WHERE thumbs_up IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_grounded ON feedback(well_grounded) WHERE well_grounded IS NOT NULL;

COMMENT ON TABLE feedback IS 'User feedback (thumbs, grounded checkbox, notes)';
COMMENT ON COLUMN feedback.interaction_id IS 'References interactions.id';
COMMENT ON COLUMN feedback.thumbs_up IS 'TRUE=👍, FALSE=👎, NULL=no feedback';
COMMENT ON COLUMN feedback.well_grounded IS 'User assessment of grounding quality';
COMMENT ON COLUMN feedback.note IS 'Optional user note (max 500 chars)';

-- =====================================================
-- EVALUATION_METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  grounding_score FLOAT NOT NULL,
  accuracy_score FLOAT NOT NULL,
  completeness_score FLOAT NOT NULL,
  pedagogy_score FLOAT NOT NULL,
  clarity_score FLOAT NOT NULL,
  overall_score FLOAT NOT NULL,
  evaluator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for joining with interactions
CREATE INDEX IF NOT EXISTS idx_metrics_interaction ON evaluation_metrics(interaction_id);

-- Index for score-based queries (learning curve)
CREATE INDEX IF NOT EXISTS idx_metrics_overall ON evaluation_metrics(overall_score);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_metrics_created ON evaluation_metrics(created_at DESC);

COMMENT ON TABLE evaluation_metrics IS 'Reflection Agent evaluation scores (5-dimension rubric)';
COMMENT ON COLUMN evaluation_metrics.interaction_id IS 'References interactions.id';
COMMENT ON COLUMN evaluation_metrics.grounding_score IS 'Claims supported by evidence (0.0-1.0, 30% weight)';
COMMENT ON COLUMN evaluation_metrics.accuracy_score IS 'Information correct per curriculum (0.0-1.0, 30% weight)';
COMMENT ON COLUMN evaluation_metrics.completeness_score IS 'Fully answers question (0.0-1.0, 20% weight)';
COMMENT ON COLUMN evaluation_metrics.pedagogy_score IS 'Appropriate for curriculum context (0.0-1.0, 10% weight)';
COMMENT ON COLUMN evaluation_metrics.clarity_score IS 'Well-explained (0.0-1.0, 10% weight)';
COMMENT ON COLUMN evaluation_metrics.overall_score IS 'Weighted average of all scores';
COMMENT ON COLUMN evaluation_metrics.evaluator_notes IS 'JSON with strengths, weaknesses, suggestions';

-- =====================================================
-- MEMORY_STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS memory_stats (
  id SERIAL PRIMARY KEY,
  total_memories INTEGER NOT NULL,
  avg_confidence FLOAT NOT NULL,
  avg_overall_score FLOAT NOT NULL,
  total_patterns INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_stats_singleton ON memory_stats(id) WHERE id = 1;

COMMENT ON TABLE memory_stats IS 'Cached statistics for dashboard (single-row table)';
COMMENT ON COLUMN memory_stats.total_memories IS 'Count of :Memory nodes in Neo4j';
COMMENT ON COLUMN memory_stats.avg_confidence IS 'Average confidence_overall across all memories';
COMMENT ON COLUMN memory_stats.avg_overall_score IS 'Average overall_score from evaluations';
COMMENT ON COLUMN memory_stats.total_patterns IS 'Count of :QueryPattern nodes in Neo4j';
COMMENT ON COLUMN memory_stats.last_updated IS 'Last update timestamp (by Learning Agent)';

-- =====================================================
-- INITIALIZE MEMORY_STATS
-- =====================================================
INSERT INTO memory_stats (id, total_memories, avg_confidence, avg_overall_score, total_patterns, last_updated)
VALUES (1, 0, 0.0, 0.0, 0, NOW())
ON CONFLICT (id) DO NOTHING;
```

---

## Detailed Setup (Step-by-Step)

If you prefer to understand each table individually, follow these steps:

### 1. Access Supabase SQL Editor

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL editor tab

### 2. Create `interactions` Table

**Purpose**: Stores all user-agent interactions with full audit trail.

```sql
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_query TEXT NOT NULL,
  final_answer TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  temperature FLOAT NOT NULL,
  confidence_overall FLOAT,
  grounding_rate FLOAT,
  cypher_queries JSONB,
  tool_calls JSONB,
  latency_ms INTEGER,
  step_count INTEGER,
  memory_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_memory ON interactions(memory_id);
CREATE INDEX IF NOT EXISTS idx_interactions_model ON interactions(model_used);
```

**Key Fields**:
- `user_query`: The user's question
- `final_answer`: Agent's complete response
- `cypher_queries`: JSONB array of Cypher queries executed
- `memory_id`: Links to corresponding `:Memory` node in Neo4j
- `latency_ms`: Response time for performance tracking

### 3. Create `feedback` Table

**Purpose**: Stores user feedback (👍/👎, grounded checkbox, optional notes).

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  thumbs_up BOOLEAN,
  well_grounded BOOLEAN,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_interaction ON feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_thumbs ON feedback(thumbs_up) WHERE thumbs_up IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_grounded ON feedback(well_grounded) WHERE well_grounded IS NOT NULL;
```

**Key Fields**:
- `thumbs_up`: TRUE=👍, FALSE=👎, NULL=no feedback
- `well_grounded`: Boolean checkbox for grounding quality assessment
- `note`: Optional text note (max 500 chars)

**Foreign Key**: `interaction_id` references `interactions(id)` with CASCADE delete

### 4. Create `evaluation_metrics` Table

**Purpose**: Stores Reflection Agent evaluation scores (5-dimension rubric).

```sql
CREATE TABLE IF NOT EXISTS evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  grounding_score FLOAT NOT NULL,
  accuracy_score FLOAT NOT NULL,
  completeness_score FLOAT NOT NULL,
  pedagogy_score FLOAT NOT NULL,
  clarity_score FLOAT NOT NULL,
  overall_score FLOAT NOT NULL,
  evaluator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_interaction ON evaluation_metrics(interaction_id);
CREATE INDEX IF NOT EXISTS idx_metrics_overall ON evaluation_metrics(overall_score);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON evaluation_metrics(created_at DESC);
```

**5-Dimension Rubric** (all scores 0.0-1.0):
- `grounding_score`: Claims supported by evidence (30% weight)
- `accuracy_score`: Information correct per curriculum (30% weight)
- `completeness_score`: Fully answers question (20% weight)
- `pedagogy_score`: Appropriate for curriculum context (10% weight)
- `clarity_score`: Well-explained (10% weight)
- `overall_score`: Weighted average

**Overall Score Calculation**:
```
overall_score = (grounding × 0.30) + (accuracy × 0.30) +
                (completeness × 0.20) + (pedagogy × 0.10) + (clarity × 0.10)
```

### 5. Create `memory_stats` Table

**Purpose**: Single-row cache of statistics for fast dashboard queries.

```sql
CREATE TABLE IF NOT EXISTS memory_stats (
  id SERIAL PRIMARY KEY,
  total_memories INTEGER NOT NULL,
  avg_confidence FLOAT NOT NULL,
  avg_overall_score FLOAT NOT NULL,
  total_patterns INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_stats_singleton ON memory_stats(id) WHERE id = 1;

-- Initialize with default values
INSERT INTO memory_stats (id, total_memories, avg_confidence, avg_overall_score, total_patterns, last_updated)
VALUES (1, 0, 0.0, 0.0, 0, NOW())
ON CONFLICT (id) DO NOTHING;
```

**Key Features**:
- Single-row table (enforced by unique index on `id = 1`)
- Updated by Learning Agent after each memory creation
- Avoids expensive Neo4j aggregation queries on dashboard page load
- Pre-aggregated statistics for fast rendering

---

## Verification

After running the SQL, verify all tables and indexes were created successfully.

### 1. Check Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('interactions', 'feedback', 'evaluation_metrics', 'memory_stats')
ORDER BY table_name;
```

**Expected Result**: 4 rows
```
evaluation_metrics
feedback
interactions
memory_stats
```

### 2. Check Indexes

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('interactions', 'feedback', 'evaluation_metrics', 'memory_stats')
ORDER BY tablename, indexname;
```

**Expected Result**: At least 9 indexes (3 for interactions, 3 for feedback, 3 for evaluation_metrics, 1 for memory_stats)

### 3. Check Foreign Keys

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('feedback', 'evaluation_metrics')
ORDER BY tc.table_name;
```

**Expected Result**: 2 foreign keys
```
feedback.interaction_id → interactions.id
evaluation_metrics.interaction_id → interactions.id
```

### 4. Check memory_stats Initialization

```sql
SELECT * FROM memory_stats;
```

**Expected Result**: 1 row with all values initialized to 0
```
id | total_memories | avg_confidence | avg_overall_score | total_patterns | last_updated
1  | 0              | 0.0            | 0.0               | 0              | [current timestamp]
```

---

## Test Queries

Run these test queries to verify insert/select functionality for all tables.

### Test 1: Insert Interaction

```sql
INSERT INTO interactions (
  user_query,
  final_answer,
  model_used,
  temperature,
  confidence_overall,
  grounding_rate,
  cypher_queries,
  latency_ms,
  step_count
) VALUES (
  'What fractions do Year 3 students learn?',
  'Year 3 students learn unit fractions (1/2, 1/3, 1/4) and comparing fractions with the same denominator.',
  'gpt-4o',
  0.3,
  0.92,
  0.98,
  '["MATCH (o:Objective {year: 3})-[:PART_OF]->(s:Strand) WHERE s.name CONTAINS ''Fraction'' RETURN o"]'::jsonb,
  2100,
  4
)
RETURNING id, user_query, created_at;
```

**Expected**: Returns the new row with generated UUID and timestamp.

### Test 2: Select Recent Interactions

```sql
SELECT
  id,
  user_query,
  model_used,
  confidence_overall,
  latency_ms,
  created_at
FROM interactions
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Shows the interaction you just inserted (and any others).

### Test 3: Insert Feedback

**Note**: Replace `<interaction_id>` with the UUID from Test 1.

```sql
INSERT INTO feedback (
  interaction_id,
  thumbs_up,
  well_grounded,
  note
) VALUES (
  '<interaction_id>',  -- Replace with actual UUID
  TRUE,
  TRUE,
  'Great answer with clear citations!'
)
RETURNING *;
```

**Expected**: Returns the new feedback row.

### Test 4: Join Interactions with Feedback

```sql
SELECT
  i.user_query,
  i.confidence_overall,
  f.thumbs_up,
  f.well_grounded,
  f.note
FROM interactions i
LEFT JOIN feedback f ON i.id = f.interaction_id
ORDER BY i.created_at DESC
LIMIT 5;
```

**Expected**: Shows interactions with their feedback (NULL for interactions without feedback).

### Test 5: Insert Evaluation Metrics

**Note**: Replace `<interaction_id>` with the UUID from Test 1.

```sql
INSERT INTO evaluation_metrics (
  interaction_id,
  grounding_score,
  accuracy_score,
  completeness_score,
  pedagogy_score,
  clarity_score,
  overall_score,
  evaluator_notes
) VALUES (
  '<interaction_id>',  -- Replace with actual UUID
  0.95,
  0.90,
  0.88,
  0.92,
  0.94,
  0.92,
  '{"strengths": ["Excellent citations", "Clear explanation"], "weaknesses": ["Could mention prerequisites"], "suggestions": ["Add context about Year 2 foundations"]}'
)
RETURNING *;
```

**Expected**: Returns the new evaluation metrics row.

### Test 6: Dashboard Query (Learning Curve Data)

```sql
SELECT
  i.id,
  i.user_query,
  i.created_at,
  em.overall_score,
  em.grounding_score,
  em.accuracy_score
FROM interactions i
LEFT JOIN evaluation_metrics em ON i.id = em.interaction_id
ORDER BY i.created_at ASC
LIMIT 20;
```

**Expected**: Shows interactions with their evaluation scores (NULL if not yet evaluated).

### Test 7: Update memory_stats

```sql
UPDATE memory_stats
SET
  total_memories = 5,
  avg_confidence = 0.87,
  avg_overall_score = 0.82,
  total_patterns = 3,
  last_updated = NOW()
WHERE id = 1
RETURNING *;
```

**Expected**: Returns the updated row with new values.

### Test 8: Verify Foreign Key Cascade Delete

**WARNING**: This deletes the test interaction. Only run if you want to clean up test data.

```sql
-- First, check what will be deleted
SELECT
  'interactions' AS table_name, id::text AS record_id
FROM interactions
WHERE user_query = 'What fractions do Year 3 students learn?'
UNION ALL
SELECT
  'feedback', id::text
FROM feedback
WHERE interaction_id = (
  SELECT id FROM interactions
  WHERE user_query = 'What fractions do Year 3 students learn?'
)
UNION ALL
SELECT
  'evaluation_metrics', id::text
FROM evaluation_metrics
WHERE interaction_id = (
  SELECT id FROM interactions
  WHERE user_query = 'What fractions do Year 3 students learn?'
);

-- Then delete the interaction (this will cascade to feedback and evaluation_metrics)
DELETE FROM interactions
WHERE user_query = 'What fractions do Year 3 students learn?'
RETURNING id;
```

**Expected**:
1. First query shows 3 records (1 interaction, 1 feedback, 1 evaluation_metrics)
2. Second query deletes the interaction and returns its ID
3. Foreign key CASCADE automatically deletes related feedback and evaluation_metrics rows

---

## Integration with Codebase

### Query Agent (app/api/chat/route.ts)

**Writes to**: `interactions` table

After streaming response completes:
```typescript
await supabase.from('interactions').insert({
  user_query: query,
  final_answer: answer,
  model_used: model,
  temperature: temperature,
  confidence_overall: confidenceScore,
  grounding_rate: groundingRate,
  cypher_queries: cypherQueries,
  tool_calls: toolCalls,
  latency_ms: latencyMs,
  step_count: stepCount,
  memory_id: memoryId,  // Set later by Learning Agent
});
```

### Reflection Agent (lib/inngest/functions/reflection.ts)

**Writes to**: `evaluation_metrics` table

After evaluating interaction:
```typescript
await supabase.from('evaluation_metrics').insert({
  interaction_id: event.data.interactionId,
  grounding_score: evaluation.grounding,
  accuracy_score: evaluation.accuracy,
  completeness_score: evaluation.completeness,
  pedagogy_score: evaluation.pedagogy,
  clarity_score: evaluation.clarity,
  overall_score: overallScore,
  evaluator_notes: JSON.stringify(evaluation),
});
```

### Learning Agent (lib/inngest/functions/learning.ts)

**Writes to**: `memory_stats` table

After creating memory in Neo4j:
```typescript
await supabase.from('memory_stats').upsert({
  id: 1,
  total_memories: stats.memoryCount,
  avg_overall_score: stats.avgScore,
  total_patterns: stats.patternCount,
  last_updated: new Date(),
});
```

### Feedback Controls (components/chat/feedback-controls.tsx)

**Writes to**: `feedback` table

When user provides feedback:
```typescript
await supabase.from('feedback').upsert({
  interaction_id: messageId,
  thumbs_up: thumbsValue,
  well_grounded: wellGroundedValue,
  note: noteValue,
});
```

### Dashboard Components

**Reads from**: All tables

- `learning-curve.tsx`: Queries `evaluation_metrics` joined with `interactions`
- `stats-cards.tsx`: Queries `memory_stats` and `interactions` count
- `interactions-table.tsx`: Queries last 20 `interactions` with left join to `evaluation_metrics`

---

## Troubleshooting

### Issue: "relation already exists" error

**Cause**: Tables were already created in a previous run.

**Solution**: This is expected behavior with `IF NOT EXISTS`. The script is safe to re-run. If you want to start fresh, see "Cleanup" section below.

### Issue: Foreign key constraint violation

**Cause**: Trying to insert feedback/evaluation_metrics for non-existent interaction.

**Solution**: Ensure the `interaction_id` UUID exists in `interactions` table before inserting related records.

```sql
-- Check if interaction exists
SELECT id FROM interactions WHERE id = '<uuid>';
```

### Issue: memory_stats shows duplicate key error

**Cause**: Trying to insert a second row when only one row (id=1) is allowed.

**Solution**: Use `ON CONFLICT (id) DO NOTHING` or `UPDATE` instead of `INSERT`:

```sql
-- Update existing row
UPDATE memory_stats
SET total_memories = 10, avg_confidence = 0.85, last_updated = NOW()
WHERE id = 1;
```

### Issue: Indexes not created

**Cause**: Permission issues or syntax error.

**Solution**:
1. Verify you're running SQL as the project owner
2. Check Supabase logs for specific error messages
3. Re-run individual index creation statements:

```sql
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
```

### Issue: Cannot see tables in Supabase dashboard

**Cause**: Tables created in wrong schema or connection issue.

**Solution**:
1. Verify tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
2. Refresh Supabase dashboard page
3. Navigate to **Table Editor** in left sidebar

### Issue: JSONB column queries not working

**Cause**: Incorrect JSONB syntax.

**Solution**: Use JSONB operators:

```sql
-- Query JSONB array
SELECT * FROM interactions
WHERE cypher_queries @> '["MATCH (o:Objective)"]'::jsonb;

-- Extract JSONB field
SELECT evaluator_notes->>'strengths' FROM evaluation_metrics;
```

---

## Cleanup (Development Only)

**WARNING**: These commands delete all data. Only use in development.

### Drop All Tables

```sql
-- Drop tables in reverse order (respects foreign keys)
DROP TABLE IF EXISTS evaluation_metrics CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS memory_stats CASCADE;
```

### Reset to Fresh State

```sql
-- Drop all tables
DROP TABLE IF EXISTS evaluation_metrics CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS memory_stats CASCADE;

-- Recreate all tables (run the Quick Setup SQL above)
```

---

## Next Steps

After completing this setup:

1. ✅ Verify all tables created (run verification queries)
2. ✅ Test insert/select queries (run test queries above)
3. ➡️ **Proceed to Task 28**: Environment Variables Setup
   - Add Supabase credentials to `.env.local`
   - Test connection from Next.js application
4. ➡️ **Task 29**: Integration Testing - End-to-End Flow
   - Verify Query Agent writes to `interactions` table
   - Verify Reflection Agent writes to `evaluation_metrics` table
   - Verify Learning Agent updates `memory_stats` table
   - Verify Feedback Controls write to `feedback` table

---

## Reference

- **ARCHITECTURE.md** - Section 4.2: Supabase Postgres Schema
- **lib/database/schema.ts** - TypeScript schema definitions (source of SQL)
- **lib/database/queries.ts** - Pre-built query functions for TypeScript
- **Supabase Docs**: https://supabase.com/docs/guides/database

---

**Document Status**: Ready for Use
**Last Updated**: 2025-10-19
**Task**: 27 - Supabase Schema Setup - Table Creation

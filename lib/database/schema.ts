/**
 * Supabase database schema definitions
 *
 * Contains SQL CREATE TABLE statements for all database tables used in Phase 1.
 * These schemas match the specifications in ARCHITECTURE.md section 4.2.
 *
 * Usage:
 *   Run these SQL statements in your Supabase SQL Editor to create the tables.
 *   Tables are designed to work with the Supabase client from supabase.ts
 *
 * Tables:
 *   - interactions: Main interaction logs with query, answer, and metadata
 *   - feedback: User feedback (thumbs up/down, grounded checkbox, notes)
 *   - evaluation_metrics: Reflection Agent evaluation scores
 *   - memory_stats: Cached statistics for dashboard (single-row table)
 */

/**
 * interactions table
 *
 * Stores all user-agent interactions with full audit trail.
 * Primary data source for dashboard metrics and analysis.
 */
export const INTERACTIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_query TEXT NOT NULL,
  final_answer TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  temperature FLOAT NOT NULL,
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
COMMENT ON COLUMN interactions.cypher_queries IS 'Array of Cypher queries executed';
COMMENT ON COLUMN interactions.tool_calls IS 'Full tool call log from AI SDK';
COMMENT ON COLUMN interactions.latency_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN interactions.step_count IS 'Number of agent steps (tool calls)';
COMMENT ON COLUMN interactions.memory_id IS 'Corresponding Neo4j :Memory node UUID';
`;

/**
 * feedback table
 *
 * Stores user feedback for each interaction.
 * Supports thumbs up/down and optional notes.
 */
export const FEEDBACK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  thumbs_up BOOLEAN,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for joining with interactions
CREATE INDEX IF NOT EXISTS idx_feedback_interaction ON feedback(interaction_id);

-- Index for feedback analysis
CREATE INDEX IF NOT EXISTS idx_feedback_thumbs ON feedback(thumbs_up) WHERE thumbs_up IS NOT NULL;

COMMENT ON TABLE feedback IS 'User feedback (thumbs and notes)';
COMMENT ON COLUMN feedback.interaction_id IS 'References interactions.id';
COMMENT ON COLUMN feedback.thumbs_up IS 'TRUE=👍, FALSE=👎, NULL=no feedback';
COMMENT ON COLUMN feedback.note IS 'Optional user note (max 500 chars)';
`;

/**
 * evaluation_metrics table
 *
 * Stores Reflection Agent evaluation scores.
 * Pre-aggregated for fast dashboard queries.
 */
export const EVALUATION_METRICS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
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

COMMENT ON TABLE evaluation_metrics IS 'Reflection Agent evaluation scores (4-dimension rubric)';
COMMENT ON COLUMN evaluation_metrics.interaction_id IS 'References interactions.id';
COMMENT ON COLUMN evaluation_metrics.accuracy_score IS 'Information correct per curriculum (0.0-1.0, 40% weight)';
COMMENT ON COLUMN evaluation_metrics.completeness_score IS 'Fully answers question (0.0-1.0, 30% weight)';
COMMENT ON COLUMN evaluation_metrics.pedagogy_score IS 'Appropriate for curriculum context (0.0-1.0, 20% weight)';
COMMENT ON COLUMN evaluation_metrics.clarity_score IS 'Well-explained (0.0-1.0, 10% weight)';
COMMENT ON COLUMN evaluation_metrics.overall_score IS 'Weighted average of all scores';
COMMENT ON COLUMN evaluation_metrics.evaluator_notes IS 'JSON with strengths, weaknesses, suggestions';
`;

/**
 * memory_stats table
 *
 * Single-row table storing cached statistics for dashboard.
 * Updated by Learning Agent after each memory creation.
 * Avoids expensive Neo4j aggregation queries on page load.
 */
export const MEMORY_STATS_TABLE_SQL = `
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
COMMENT ON COLUMN memory_stats.avg_confidence IS 'Deprecated - no longer used (kept for backward compatibility)';
COMMENT ON COLUMN memory_stats.avg_overall_score IS 'Average overall_score from evaluations';
COMMENT ON COLUMN memory_stats.total_patterns IS 'Count of :QueryPattern nodes in Neo4j';
COMMENT ON COLUMN memory_stats.last_updated IS 'Last update timestamp (by Learning Agent)';
`;

/**
 * Complete schema migration
 *
 * Run all table creation statements in order.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
export const ALL_TABLES_SQL = `
-- Oak Curriculum Agent - Phase 1 Database Schema
-- Run this in Supabase SQL Editor to create all tables

${INTERACTIONS_TABLE_SQL}

${FEEDBACK_TABLE_SQL}

${EVALUATION_METRICS_TABLE_SQL}

${MEMORY_STATS_TABLE_SQL}

-- Initialize memory_stats with default values
INSERT INTO memory_stats (id, total_memories, avg_confidence, avg_overall_score, total_patterns, last_updated)
VALUES (1, 0, 0.0, 0.0, 0, NOW())
ON CONFLICT (id) DO NOTHING;
`;

/**
 * Development helper: Drop all tables (dangerous!)
 *
 * Use only for resetting development database.
 * NEVER run in production.
 */
export const DROP_ALL_TABLES_SQL = `
-- WARNING: This will delete all data!
-- Only use in development environment

DROP TABLE IF EXISTS evaluation_metrics CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS memory_stats CASCADE;
`;

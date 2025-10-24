/**
 * Common database query functions
 *
 * Provides type-safe, reusable query functions for all database operations.
 * All functions use the singleton Supabase client from supabase.ts
 *
 * Usage:
 *   import { createInteraction, getRecentInteractions } from '@/lib/database/queries';
 *   const interactionId = await createInteraction({ ... });
 *   const recent = await getRecentInteractions(20);
 */

import { getSupabaseClient } from './supabase';

// Type definitions for function parameters
export interface CreateInteractionParams {
  userQuery: string;
  finalAnswer: string;
  modelUsed: string;
  temperature: number;
  cypherQueries?: Record<string, unknown>[];
  toolCalls?: Record<string, unknown>[];
  latencyMs?: number;
  stepCount?: number;
  memoryId?: string;
}

export interface CreateFeedbackParams {
  interactionId: string;
  thumbsUp?: boolean | null;
  note?: string | null;
}

export interface CreateEvaluationMetricsParams {
  interactionId: string;
  accuracyScore: number;
  completenessScore: number;
  pedagogyScore: number;
  clarityScore: number;
  overallScore: number;
  evaluatorNotes?: string;
}

export interface UpdateMemoryStatsParams {
  totalMemories: number;
  avgConfidence: number;
  avgOverallScore: number;
  totalPatterns: number;
}

/**
 * Creates a new interaction record
 *
 * Call this after Query Agent completes a response.
 * Returns the created interaction ID for linking feedback/evaluations.
 *
 * @param params - Interaction data from Query Agent
 * @returns UUID of created interaction
 * @throws Error if insertion fails
 */
export async function createInteraction(
  params: CreateInteractionParams
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('interactions')
    .insert({
      user_query: params.userQuery,
      final_answer: params.finalAnswer,
      model_used: params.modelUsed,
      temperature: params.temperature,
      cypher_queries: params.cypherQueries ?? null,
      tool_calls: params.toolCalls ?? null,
      latency_ms: params.latencyMs ?? null,
      step_count: params.stepCount ?? null,
      memory_id: params.memoryId ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create interaction: ${error.message}`);
  }

  return data.id;
}

/**
 * Updates an existing interaction record
 *
 * Used to update interaction with full details after streaming completes.
 *
 * @param interactionId - UUID of interaction to update
 * @param params - Partial interaction data to update
 * @throws Error if update fails
 */
export async function updateInteraction(
  interactionId: string,
  params: Partial<CreateInteractionParams>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('interactions')
    .update({
      final_answer: params.finalAnswer,
      cypher_queries: params.cypherQueries,
      tool_calls: params.toolCalls,
      latency_ms: params.latencyMs,
      step_count: params.stepCount,
      memory_id: params.memoryId,
    })
    .eq('id', interactionId);

  if (error) {
    throw new Error(`Failed to update interaction: ${error.message}`);
  }
}

/**
 * Retrieves recent interactions for dashboard display
 *
 * Returns interactions in reverse chronological order.
 * Includes all fields needed for dashboard table.
 *
 * @param limit - Maximum number of interactions to retrieve (default: 20)
 * @returns Array of interaction records
 * @throws Error if query fails
 */
export async function getRecentInteractions(limit: number = 20): Promise<
  Array<{
    id: string;
    user_query: string;
    final_answer: string;
    model_used: string;
    confidence_overall: number | null;
    grounding_rate: number | null;
    latency_ms: number | null;
    created_at: string;
  }>
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('interactions')
    .select(
      'id, user_query, final_answer, model_used, confidence_overall, grounding_rate, latency_ms, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to retrieve interactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves a single interaction by ID
 *
 * Used for displaying full interaction details in modal.
 *
 * @param interactionId - UUID of interaction to retrieve
 * @returns Full interaction record or null if not found
 * @throws Error if query fails
 */
export async function getInteractionById(interactionId: string): Promise<{
  id: string;
  user_query: string;
  final_answer: string;
  model_used: string;
  temperature: number;
  confidence_overall: number | null;
  grounding_rate: number | null;
  cypher_queries: Record<string, unknown>[] | null;
  tool_calls: Record<string, unknown>[] | null;
  latency_ms: number | null;
  step_count: number | null;
  memory_id: string | null;
  created_at: string;
} | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to retrieve interaction: ${error.message}`);
  }

  return data;
}

/**
 * Creates feedback for an interaction
 *
 * Call this when user provides thumbs up/down, checks grounded checkbox,
 * or submits a note. All fields are optional.
 *
 * @param params - Feedback data from user
 * @returns UUID of created feedback record
 * @throws Error if insertion fails
 */
export async function createFeedback(
  params: CreateFeedbackParams
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error} = await supabase
    .from('feedback')
    .insert({
      interaction_id: params.interactionId,
      thumbs_up: params.thumbsUp ?? null,
      note: params.note ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create feedback: ${error.message}`);
  }

  return data.id;
}

/**
 * Updates existing feedback record
 *
 * Use this to update feedback if user changes their mind
 * (e.g., clicks thumbs up after previously clicking thumbs down).
 *
 * @param feedbackId - UUID of feedback record to update
 * @param params - Partial feedback data to update
 * @throws Error if update fails
 */
export async function updateFeedback(
  feedbackId: string,
  params: Partial<CreateFeedbackParams>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('feedback')
    .update({
      thumbs_up: params.thumbsUp ?? undefined,
      note: params.note ?? undefined,
    })
    .eq('id', feedbackId);

  if (error) {
    throw new Error(`Failed to update feedback: ${error.message}`);
  }
}

/**
 * Retrieves feedback for a specific interaction
 *
 * @param interactionId - UUID of interaction
 * @returns Feedback record or null if none exists
 * @throws Error if query fails
 */
export async function getFeedbackByInteractionId(interactionId: string): Promise<{
  id: string;
  interaction_id: string;
  thumbs_up: boolean | null;
  well_grounded: boolean | null;
  note: string | null;
  created_at: string;
} | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('interaction_id', interactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to retrieve feedback: ${error.message}`);
  }

  return data;
}

/**
 * Creates evaluation metrics for an interaction
 *
 * Called by Reflection Agent after evaluating interaction quality.
 * All score fields are required (0.0-1.0 range).
 *
 * @param params - Evaluation scores from Reflection Agent
 * @returns UUID of created evaluation record
 * @throws Error if insertion fails
 */
export async function createEvaluationMetrics(
  params: CreateEvaluationMetricsParams
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('evaluation_metrics')
    .insert({
      interaction_id: params.interactionId,
      accuracy_score: params.accuracyScore,
      completeness_score: params.completenessScore,
      pedagogy_score: params.pedagogyScore,
      clarity_score: params.clarityScore,
      overall_score: params.overallScore,
      evaluator_notes: params.evaluatorNotes ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create evaluation metrics: ${error.message}`);
  }

  return data.id;
}

/**
 * Retrieves evaluation metrics for dashboard learning curve
 *
 * Returns all evaluation records in chronological order.
 * Used to generate learning curve chart showing improvement over time.
 *
 * @returns Array of evaluation metrics with timestamps
 * @throws Error if query fails
 */
export async function getAllEvaluationMetrics(): Promise<
  Array<{
    id: string;
    interaction_id: string;
    accuracy_score: number;
    completeness_score: number;
    pedagogy_score: number;
    clarity_score: number;
    overall_score: number;
    created_at: string;
  }>
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('evaluation_metrics')
    .select(
      'id, interaction_id, grounding_score, accuracy_score, completeness_score, pedagogy_score, clarity_score, overall_score, created_at'
    )
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to retrieve evaluation metrics: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves evaluation metrics for a specific interaction
 *
 * @param interactionId - UUID of interaction
 * @returns Evaluation metrics record or null if not found
 * @throws Error if query fails
 */
export async function getEvaluationMetricsByInteractionId(
  interactionId: string
): Promise<{
  id: string;
  interaction_id: string;
  grounding_score: number;
  accuracy_score: number;
  completeness_score: number;
  pedagogy_score: number;
  clarity_score: number;
  overall_score: number;
  evaluator_notes: string | null;
  created_at: string;
} | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('evaluation_metrics')
    .select('*')
    .eq('interaction_id', interactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to retrieve evaluation metrics: ${error.message}`);
  }

  return data;
}

/**
 * Updates memory statistics cache
 *
 * Called by Learning Agent after creating a new memory.
 * Uses upsert to ensure single-row table constraint.
 *
 * @param params - Updated statistics from Neo4j
 * @throws Error if update fails
 */
export async function updateMemoryStats(
  params: UpdateMemoryStatsParams
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('memory_stats').upsert({
    id: 1, // Single row table
    total_memories: params.totalMemories,
    avg_confidence: params.avgConfidence,
    avg_overall_score: params.avgOverallScore,
    total_patterns: params.totalPatterns,
    last_updated: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to update memory stats: ${error.message}`);
  }
}

/**
 * Retrieves current memory statistics for dashboard
 *
 * Returns cached statistics from single-row table.
 * Fast query (no aggregation needed).
 *
 * @returns Memory statistics or default values if not initialized
 * @throws Error if query fails
 */
export async function getMemoryStats(): Promise<{
  id: number;
  total_memories: number;
  avg_confidence: number;
  avg_overall_score: number;
  total_patterns: number;
  last_updated: string;
}> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('memory_stats')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not initialized yet, return defaults
      return {
        id: 1,
        total_memories: 0,
        avg_confidence: 0.0,
        avg_overall_score: 0.0,
        total_patterns: 0,
        last_updated: new Date().toISOString(),
      };
    }
    throw new Error(`Failed to retrieve memory stats: ${error.message}`);
  }

  return data;
}

/**
 * Counts total interactions in database
 *
 * Used for dashboard stats card.
 *
 * @returns Total number of interactions
 * @throws Error if query fails
 */
export async function countInteractions(): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to count interactions: ${error.message}`);
  }

  return count || 0;
}

/**
 * Calculates average confidence across all interactions
 *
 * Used for dashboard stats card.
 * Only includes interactions with non-null confidence values.
 *
 * @returns Average confidence score (0.0-1.0) or 0 if no data
 * @throws Error if query fails
 */
export async function getAverageConfidence(): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('avg_confidence_overall');

  if (error) {
    // If RPC doesn't exist, calculate manually
    const { data: interactions, error: selectError } = await supabase
      .from('interactions')
      .select('confidence_overall')
      .not('confidence_overall', 'is', null);

    if (selectError) {
      throw new Error(`Failed to calculate average confidence: ${selectError.message}`);
    }

    if (!interactions || interactions.length === 0) {
      return 0;
    }

    const sum = interactions.reduce(
      (acc, i) => acc + (i.confidence_overall || 0),
      0
    );
    return sum / interactions.length;
  }

  return data || 0;
}

/**
 * Retrieves interactions with evaluation metrics for analysis
 *
 * Joins interactions with their evaluation metrics.
 * Used for dashboard learning curve and detailed analysis.
 *
 * @param limit - Maximum number of records to retrieve
 * @returns Array of interactions with evaluation metrics
 * @throws Error if query fails
 */
export async function getInteractionsWithEvaluations(limit?: number): Promise<
  Array<{
    interaction_id: string;
    user_query: string;
    model_used: string;
    confidence_overall: number | null;
    grounding_rate: number | null;
    overall_score: number;
    created_at: string;
  }>
> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('evaluation_metrics')
    .select(
      `
      interaction_id,
      overall_score,
      created_at,
      interactions!inner (
        user_query,
        model_used,
        confidence_overall,
        grounding_rate
      )
    `
    )
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to retrieve interactions with evaluations: ${error.message}`);
  }

  // Flatten the nested structure
  return (data || []).map((record: any) => ({
    interaction_id: record.interaction_id,
    user_query: record.interactions.user_query,
    model_used: record.interactions.model_used,
    confidence_overall: record.interactions.confidence_overall,
    grounding_rate: record.interactions.grounding_rate,
    overall_score: record.overall_score,
    created_at: record.created_at,
  }));
}

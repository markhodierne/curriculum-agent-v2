/**
 * Dashboard Interactions API Route
 * Provides interaction data with evaluations for the dashboard table
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Fetch interactions with left join to evaluation_metrics
    const { data, error } = await supabase
      .from('interactions')
      .select(
        `
        id,
        user_query,
        final_answer,
        model_used,
        temperature,
        latency_ms,
        step_count,
        cypher_queries,
        tool_calls,
        created_at,
        evaluation_metrics (
          overall_score
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch interactions: ${error.message}`);
    }

    // Transform data to flatten evaluation_metrics
    const interactions = (data || []).map((row: any) => ({
      id: row.id,
      user_query: row.user_query,
      final_answer: row.final_answer,
      model_used: row.model_used,
      temperature: row.temperature,
      latency_ms: row.latency_ms,
      step_count: row.step_count,
      cypher_queries: row.cypher_queries,
      tool_calls: row.tool_calls,
      created_at: row.created_at,
      overall_score: row.evaluation_metrics?.[0]?.overall_score ?? null,
    }));

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Failed to fetch interactions:', error);
    return NextResponse.json(
      { error: 'Failed to load interactions' },
      { status: 500 }
    );
  }
}

/**
 * Supabase client singleton for database operations
 *
 * Implements singleton pattern to ensure connection reuse across the application.
 * Uses service role key for server-side operations (bypasses RLS).
 *
 * Usage:
 *   import { getSupabaseClient } from '@/lib/database/supabase';
 *   const supabase = getSupabaseClient();
 *   const { data, error } = await supabase.from('interactions').select('*');
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance
let clientInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton
 *
 * Creates a new client on first call, then returns the same instance on subsequent calls.
 * Uses service role key for full database access (server-side only).
 *
 * @returns Supabase client instance
 * @throws Error if required environment variables are missing
 */
export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    clientInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return clientInstance;
}

/**
 * Type-safe database schema interface
 *
 * Defines the structure of all tables in the database.
 * Used for type-safe queries with Supabase client.
 */
export interface Database {
  public: {
    Tables: {
      interactions: {
        Row: {
          id: string;
          user_query: string;
          final_answer: string;
          model_used: string;
          temperature: number;
          cypher_queries: Record<string, unknown>[] | null;
          tool_calls: Record<string, unknown>[] | null;
          latency_ms: number | null;
          step_count: number | null;
          memory_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_query: string;
          final_answer: string;
          model_used: string;
          temperature: number;
          cypher_queries?: Record<string, unknown>[] | null;
          tool_calls?: Record<string, unknown>[] | null;
          latency_ms?: number | null;
          step_count?: number | null;
          memory_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_query?: string;
          final_answer?: string;
          model_used?: string;
          temperature?: number;
          cypher_queries?: Record<string, unknown>[] | null;
          tool_calls?: Record<string, unknown>[] | null;
          latency_ms?: number | null;
          step_count?: number | null;
          memory_id?: string | null;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          interaction_id: string;
          thumbs_up: boolean | null;
          well_grounded: boolean | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interaction_id: string;
          thumbs_up?: boolean | null;
          well_grounded?: boolean | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interaction_id?: string;
          thumbs_up?: boolean | null;
          well_grounded?: boolean | null;
          note?: string | null;
          created_at?: string;
        };
      };
      evaluation_metrics: {
        Row: {
          id: string;
          interaction_id: string;
          accuracy_score: number;
          completeness_score: number;
          pedagogy_score: number;
          clarity_score: number;
          overall_score: number;
          evaluator_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interaction_id: string;
          accuracy_score: number;
          completeness_score: number;
          pedagogy_score: number;
          clarity_score: number;
          overall_score: number;
          evaluator_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interaction_id?: string;
          accuracy_score?: number;
          completeness_score?: number;
          pedagogy_score?: number;
          clarity_score?: number;
          overall_score?: number;
          evaluator_notes?: string | null;
          created_at?: string;
        };
      };
      memory_stats: {
        Row: {
          id: number;
          total_memories: number;
          avg_confidence: number;
          avg_overall_score: number;
          total_patterns: number;
          last_updated: string;
        };
        Insert: {
          id?: number;
          total_memories: number;
          avg_confidence: number;
          avg_overall_score: number;
          total_patterns: number;
          last_updated?: string;
        };
        Update: {
          id?: number;
          total_memories?: number;
          avg_confidence?: number;
          avg_overall_score?: number;
          total_patterns?: number;
          last_updated?: string;
        };
      };
    };
  };
}

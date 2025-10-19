/**
 * Interactions Table Component
 *
 * Displays last 20 interactions with key metrics in a sortable table.
 * Clicking a row opens a modal with full interaction details.
 *
 * Features:
 * - Sortable columns (query, confidence, grounding, overall score, latency, timestamp)
 * - Truncated query text (50 chars max)
 * - Modal view for complete interaction details
 * - Loading/error states
 *
 * Usage:
 *   <InteractionsTable />
 *
 * Compliance:
 * - FUNCTIONAL.md: Section 4.3.C - Recent Interactions Table
 * - ARCHITECTURE.md: Section 4.2 - Supabase interactions table
 * - CLAUDE.md: TypeScript standards, shadcn/ui components
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSupabaseClient } from '@/lib/database/supabase';

// Type definitions for table data
interface InteractionRow {
  id: string;
  user_query: string;
  final_answer: string;
  model_used: string;
  confidence_overall: number | null;
  grounding_rate: number | null;
  latency_ms: number | null;
  created_at: string;
  overall_score: number | null;
  cypher_queries?: Record<string, unknown>[] | null;
  tool_calls?: Record<string, unknown>[] | null;
  temperature?: number;
  step_count?: number | null;
}

type SortColumn = 'query' | 'confidence' | 'grounding' | 'score' | 'latency' | 'timestamp';
type SortDirection = 'asc' | 'desc';

/**
 * InteractionsTable Component
 *
 * Fetches and displays last 20 interactions from Supabase with evaluation metrics.
 * Provides sortable columns and modal details view.
 */
export default function InteractionsTable() {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionRow | null>(null);

  /**
   * Fetches interactions with evaluation metrics from Supabase
   *
   * Joins interactions table with evaluation_metrics to get overall_score.
   * Fetches last 20 interactions ordered by created_at DESC.
   */
  useEffect(() => {
    async function fetchInteractions() {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();

        // Fetch interactions with left join to evaluation_metrics
        const { data, error: queryError } = await supabase
          .from('interactions')
          .select(
            `
            id,
            user_query,
            final_answer,
            model_used,
            temperature,
            confidence_overall,
            grounding_rate,
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

        if (queryError) {
          throw new Error(`Failed to fetch interactions: ${queryError.message}`);
        }

        // Transform data to flatten evaluation_metrics
        const transformedData: InteractionRow[] = (data || []).map((row: any) => ({
          id: row.id,
          user_query: row.user_query,
          final_answer: row.final_answer,
          model_used: row.model_used,
          temperature: row.temperature,
          confidence_overall: row.confidence_overall,
          grounding_rate: row.grounding_rate,
          latency_ms: row.latency_ms,
          step_count: row.step_count,
          cypher_queries: row.cypher_queries,
          tool_calls: row.tool_calls,
          created_at: row.created_at,
          overall_score: row.evaluation_metrics?.[0]?.overall_score ?? null,
        }));

        setInteractions(transformedData);
      } catch (err) {
        console.error('Error fetching interactions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interactions');
      } finally {
        setLoading(false);
      }
    }

    fetchInteractions();
  }, []);

  /**
   * Handles column header click for sorting
   *
   * Toggles sort direction if clicking same column,
   * otherwise sets new column with ascending sort.
   *
   * @param column - Column to sort by
   */
  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  /**
   * Sorts interactions based on current sort column and direction
   *
   * @param data - Array of interactions to sort
   * @returns Sorted array
   */
  function sortInteractions(data: InteractionRow[]): InteractionRow[] {
    const sorted = [...data].sort((a, b) => {
      let aValue: string | number | null = null;
      let bValue: string | number | null = null;

      switch (sortColumn) {
        case 'query':
          aValue = a.user_query.toLowerCase();
          bValue = b.user_query.toLowerCase();
          break;
        case 'confidence':
          aValue = a.confidence_overall ?? -1;
          bValue = b.confidence_overall ?? -1;
          break;
        case 'grounding':
          aValue = a.grounding_rate ?? -1;
          bValue = b.grounding_rate ?? -1;
          break;
        case 'score':
          aValue = a.overall_score ?? -1;
          bValue = b.overall_score ?? -1;
          break;
        case 'latency':
          aValue = a.latency_ms ?? -1;
          bValue = b.latency_ms ?? -1;
          break;
        case 'timestamp':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (aValue === null || aValue === -1) return 1;
      if (bValue === null || bValue === -1) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Truncates query text to 50 characters with ellipsis
   *
   * @param text - Query text to truncate
   * @returns Truncated string
   */
  function truncateQuery(text: string): string {
    if (text.length <= 50) return text;
    return text.substring(0, 50) + '...';
  }

  /**
   * Formats timestamp to readable date/time string
   *
   * @param timestamp - ISO timestamp string
   * @returns Formatted date string
   */
  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formats latency from milliseconds to seconds
   *
   * @param latencyMs - Latency in milliseconds
   * @returns Formatted latency string (e.g., "2.1s")
   */
  function formatLatency(latencyMs: number | null): string {
    if (latencyMs === null) return 'N/A';
    return `${(latencyMs / 1000).toFixed(1)}s`;
  }

  /**
   * Formats score to 2 decimal places
   *
   * @param score - Score value (0.0-1.0)
   * @returns Formatted score string
   */
  function formatScore(score: number | null): string {
    if (score === null) return 'N/A';
    return score.toFixed(2);
  }

  /**
   * Renders sort indicator arrow
   *
   * @param column - Column to check
   * @returns Arrow indicator or empty string
   */
  function getSortIndicator(column: SortColumn): string {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading interactions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-card p-8 text-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  // Empty state
  if (interactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No interactions yet. Start chatting to see data here!</p>
      </div>
    );
  }

  const sortedInteractions = sortInteractions(interactions);

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('query')}
              >
                Query{getSortIndicator('query')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('confidence')}
              >
                Confidence{getSortIndicator('confidence')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('grounding')}
              >
                Grounding{getSortIndicator('grounding')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('score')}
              >
                Overall Score{getSortIndicator('score')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('latency')}
              >
                Latency{getSortIndicator('latency')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('timestamp')}
              >
                Timestamp{getSortIndicator('timestamp')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInteractions.map((interaction) => (
              <TableRow
                key={interaction.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedInteraction(interaction)}
              >
                <TableCell className="font-medium">
                  {truncateQuery(interaction.user_query)}
                </TableCell>
                <TableCell className="text-right">
                  {formatScore(interaction.confidence_overall)}
                </TableCell>
                <TableCell className="text-right">
                  {formatScore(interaction.grounding_rate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatScore(interaction.overall_score)}
                </TableCell>
                <TableCell className="text-right">
                  {formatLatency(interaction.latency_ms)}
                </TableCell>
                <TableCell>{formatTimestamp(interaction.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal for full interaction details */}
      <Dialog open={selectedInteraction !== null} onOpenChange={(open) => !open && setSelectedInteraction(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interaction Details</DialogTitle>
            <DialogDescription>
              {selectedInteraction && formatTimestamp(selectedInteraction.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedInteraction && (
            <div className="space-y-4">
              {/* Query */}
              <div>
                <h3 className="font-semibold mb-1">User Query</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedInteraction.user_query}
                </p>
              </div>

              {/* Answer */}
              <div>
                <h3 className="font-semibold mb-1">Agent Response</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedInteraction.final_answer}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Model</p>
                  <p className="text-sm">{selectedInteraction.model_used}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Temperature</p>
                  <p className="text-sm">{selectedInteraction.temperature ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Confidence</p>
                  <p className="text-sm">{formatScore(selectedInteraction.confidence_overall)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Grounding</p>
                  <p className="text-sm">{formatScore(selectedInteraction.grounding_rate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overall Score</p>
                  <p className="text-sm">{formatScore(selectedInteraction.overall_score)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Latency</p>
                  <p className="text-sm">{formatLatency(selectedInteraction.latency_ms)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Steps</p>
                  <p className="text-sm">{selectedInteraction.step_count ?? 'N/A'}</p>
                </div>
              </div>

              {/* Cypher Queries */}
              {selectedInteraction.cypher_queries && selectedInteraction.cypher_queries.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Cypher Queries</h3>
                  <div className="space-y-2">
                    {selectedInteraction.cypher_queries.map((query, index) => (
                      <div key={index} className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                        {JSON.stringify(query, null, 2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Calls */}
              {selectedInteraction.tool_calls && selectedInteraction.tool_calls.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Tool Calls</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedInteraction.tool_calls.length} tool call(s)
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

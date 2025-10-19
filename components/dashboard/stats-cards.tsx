/**
 * Dashboard Stats Cards Component
 *
 * Displays three key metrics in card format:
 * - Total Interactions: Count of all queries processed
 * - Average Confidence: Mean confidence score across all interactions
 * - Memories Created: Count of :Memory nodes in Neo4j
 *
 * Data fetched from Supabase on component mount.
 * Uses Tremor Card components with Lucide React icons.
 *
 * Usage:
 *   import { StatsCards } from '@/components/dashboard/stats-cards';
 *   <StatsCards />
 *
 * See: FUNCTIONAL.md section 4.3.B, ARCHITECTURE.md section 3
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@tremor/react';
import { MessageSquare, Star, Brain } from 'lucide-react';

/**
 * Statistics data structure
 */
interface Stats {
  totalInteractions: number;
  avgConfidence: number;
  memoriesCreated: number;
}

/**
 * Stats Cards Component
 *
 * Fetches and displays three key dashboard metrics in card format.
 * Shows loading state while fetching, error state on failure, and
 * formatted stats once loaded.
 *
 * @returns React component with three stat cards
 */
export function StatsCards(): React.ReactElement {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Fetches statistics from API route
   *
   * Calls /api/dashboard/stats to get aggregated statistics.
   */
  async function fetchStats(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();

      setStats({
        totalInteractions: data.totalInteractions,
        avgConfidence: data.avgConfidence,
        memoriesCreated: data.totalMemories,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load statistics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-3">
          <p className="text-red-600 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  // Empty state (no data yet)
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-3">
          <p className="text-gray-600 text-center">
            No data available yet. Start a conversation to see statistics.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Interactions Card */}
      <Card decoration="top" decorationColor="blue">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Interactions</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.totalInteractions.toLocaleString()}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Total queries processed by the agent
        </p>
      </Card>

      {/* Average Confidence Card */}
      <Card decoration="top" decorationColor="amber">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Confidence</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatConfidence(stats.avgConfidence)}
            </p>
          </div>
          <div className="rounded-full bg-amber-100 p-3">
            <Star className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {getStarRating(stats.avgConfidence)} Mean confidence across all interactions
        </p>
      </Card>

      {/* Memories Created Card */}
      <Card decoration="top" decorationColor="purple">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Memories Created</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.memoriesCreated.toLocaleString()}
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          High-quality interactions stored for learning
        </p>
      </Card>
    </div>
  );
}

/**
 * Formats confidence score for display
 *
 * Converts 0.0-1.0 float to percentage or two decimal places.
 *
 * @param confidence - Confidence score (0.0-1.0)
 * @returns Formatted string (e.g., "0.85" or "85%")
 */
function formatConfidence(confidence: number): string {
  if (confidence === 0) {
    return '0.00';
  }
  return confidence.toFixed(2);
}

/**
 * Converts confidence score to star rating
 *
 * Uses 5-tier system from FUNCTIONAL.md section 4.2.E:
 * - ★★★★★ = 0.90-1.00 (Direct graph match)
 * - ★★★★☆ = 0.75-0.89 (Inferred from traversal)
 * - ★★★☆☆ = 0.60-0.74 (Synthesized from multiple nodes)
 * - ★★☆☆☆ = 0.40-0.59 (Weak support)
 * - ★☆☆☆☆ = 0.00-0.39 (No clear support)
 *
 * @param confidence - Confidence score (0.0-1.0)
 * @returns Star rating string
 */
function getStarRating(confidence: number): string {
  if (confidence >= 0.9) return '★★★★★';
  if (confidence >= 0.75) return '★★★★☆';
  if (confidence >= 0.6) return '★★★☆☆';
  if (confidence >= 0.4) return '★★☆☆☆';
  return '★☆☆☆☆';
}

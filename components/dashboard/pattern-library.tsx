/**
 * Dashboard Pattern Library Component
 *
 * Displays discovered query patterns from Neo4j :QueryPattern nodes.
 * Shows pattern name, description, usage count, and success rate.
 * Patterns are sorted by usage count (total uses) descending.
 *
 * Data fetched from API route (/api/dashboard/patterns).
 * Uses Tremor Card components for consistent dashboard styling.
 *
 * Usage:
 *   import { PatternLibrary } from '@/components/dashboard/pattern-library';
 *   <PatternLibrary />
 *
 * See: FUNCTIONAL.md section 4.3.D, ARCHITECTURE.md section 4.1
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@tremor/react';

/**
 * Query pattern data structure from API
 */
interface QueryPattern {
  id: string;
  name: string;
  description: string;
  successCount: number;
  failureCount: number;
  totalUsage: number;
  successRate: number;
}

/**
 * Pattern Library Component
 *
 * Fetches and displays discovered query patterns from Neo4j.
 * Shows loading state while fetching, error state on failure,
 * and sorted patterns once loaded.
 *
 * @returns React component with pattern cards
 */
export function PatternLibrary(): React.ReactElement {
  const [patterns, setPatterns] = useState<QueryPattern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  /**
   * Fetches query patterns from API route
   *
   * Calls /api/dashboard/patterns to get top 20 patterns
   * sorted by total usage descending.
   */
  async function fetchPatterns(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      // Fetch from API route
      const response = await fetch('/api/dashboard/patterns');
      if (!response.ok) {
        throw new Error('Failed to fetch patterns');
      }

      const { patterns: data } = await response.json();
      setPatterns(data);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
      setError('Failed to load patterns. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pattern Library</h2>
        <Card className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded" />
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pattern Library</h2>
        <Card>
          <p className="text-red-600 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  // Empty state (no patterns discovered yet)
  if (patterns.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pattern Library</h2>
        <Card>
          <p className="text-gray-600 text-center">
            No query patterns discovered yet. Patterns are extracted from high-quality interactions (score {'>'} 0.8).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Pattern Library ({patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'})
      </h2>
      <div className="space-y-3">
        {patterns.map((pattern) => {
          return (
            <Card key={pattern.id} decoration="left" decorationColor={getDecorationColor(pattern.successRate)}>
              <div className="space-y-2">
                {/* Pattern name and success rate */}
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {pattern.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getSuccessRateColor(pattern.successRate)}`}>
                      {pattern.successRate.toFixed(0)}% success
                    </span>
                  </div>
                </div>

                {/* Pattern description */}
                <p className="text-sm text-gray-600">
                  {pattern.description || 'No description available'}
                </p>

                {/* Usage stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    <span className="font-medium text-gray-700">{pattern.totalUsage}</span> total {pattern.totalUsage === 1 ? 'use' : 'uses'}
                  </span>
                  <span>•</span>
                  <span>
                    <span className="font-medium text-green-700">{pattern.successCount}</span> successful
                  </span>
                  {pattern.failureCount > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <span className="font-medium text-red-700">{pattern.failureCount}</span> failed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Determines card decoration color based on success rate
 *
 * @param successRate - Success percentage (0-100)
 * @returns Tremor color name
 */
function getDecorationColor(successRate: number): string {
  if (successRate >= 90) return 'green';
  if (successRate >= 75) return 'blue';
  if (successRate >= 60) return 'amber';
  return 'red';
}

/**
 * Determines text color for success rate display
 *
 * @param successRate - Success percentage (0-100)
 * @returns Tailwind text color class
 */
function getSuccessRateColor(successRate: number): string {
  if (successRate >= 90) return 'text-green-700';
  if (successRate >= 75) return 'text-blue-700';
  if (successRate >= 60) return 'text-amber-700';
  return 'text-red-700';
}

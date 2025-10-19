/**
 * Learning Curve Chart Component
 *
 * Displays a Tremor LineChart showing the agent's learning improvement over time.
 * Fetches evaluation metrics from Supabase and visualizes overall scores by interaction number.
 *
 * Features:
 * - X-axis: Interaction number (1, 2, 3, ...)
 * - Y-axis: Overall evaluation score (0.0-1.0)
 * - Trend line showing actual scores
 * - Target line at 0.70 threshold
 * - Responsive design with Tremor styling
 *
 * Usage:
 *   import { LearningCurve } from '@/components/dashboard/learning-curve';
 *   <LearningCurve />
 *
 * See FUNCTIONAL.md section 4.3 for dashboard specifications.
 * See ARCHITECTURE.md section 4.2 for evaluation_metrics schema.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart } from '@tremor/react';

// Type for chart data points
interface ChartDataPoint {
  interaction: number;
  'Evaluation Score': number;
  'Target (0.70)': number;
}

/**
 * LearningCurve component
 *
 * Fetches evaluation metrics on mount and displays them as a line chart.
 * Shows learning improvement by plotting overall scores sequentially.
 *
 * Chart Configuration:
 * - Index: 'interaction' (X-axis)
 * - Categories: ['Evaluation Score', 'Target (0.70)']
 * - Colors: ['blue', 'gray']
 * - Value formatter: 2 decimal places
 *
 * @returns React component displaying learning curve chart
 */
export function LearningCurve() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches evaluation metrics and transforms them into chart data format
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all evaluation metrics from API route
        const response = await fetch('/api/dashboard/evaluations');
        if (!response.ok) {
          throw new Error('Failed to fetch evaluations');
        }

        const { evaluations } = await response.json();

        // Transform metrics into chart data points
        const data: ChartDataPoint[] = evaluations.map((metric: any, index: number) => ({
          interaction: index + 1, // 1-indexed interaction numbers
          'Evaluation Score': metric.overall_score,
          'Target (0.70)': 0.7, // Constant target line
        }));

        setChartData(data);
      } catch (err) {
        console.error('Failed to fetch evaluation metrics:', err);
        setError('Unable to load learning curve data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Custom value formatter for Y-axis labels and tooltips
   * Displays scores with 2 decimal places
   */
  const valueFormatter = (value: number): string => {
    return value.toFixed(2);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Curve</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading learning curve data...</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Curve</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      </Card>
    );
  }

  // Empty state (no evaluation data yet)
  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Curve</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            No evaluation data available yet. Start chatting to see learning improvement!
          </p>
        </div>
      </Card>
    );
  }

  // Calculate improvement statistics
  const firstTenAvg =
    chartData.length >= 10
      ? chartData
          .slice(0, 10)
          .reduce((sum, d) => sum + d['Evaluation Score'], 0) / 10
      : null;

  const lastTenAvg =
    chartData.length >= 10
      ? chartData
          .slice(-10)
          .reduce((sum, d) => sum + d['Evaluation Score'], 0) / 10
      : null;

  const improvementPercent =
    firstTenAvg && lastTenAvg
      ? ((lastTenAvg - firstTenAvg) / firstTenAvg) * 100
      : null;

  // Data visualization state
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Learning Curve</h3>
        {firstTenAvg && lastTenAvg && improvementPercent !== null && (
          <p className="text-sm text-muted-foreground mt-1">
            Interactions 1-10: {firstTenAvg.toFixed(2)} avg • Last 10:{' '}
            {lastTenAvg.toFixed(2)} avg
            {improvementPercent > 0 && (
              <span className="text-green-600 font-medium">
                {' '}
                (+{improvementPercent.toFixed(1)}%)
              </span>
            )}
            {improvementPercent < 0 && (
              <span className="text-orange-600 font-medium">
                {' '}
                ({improvementPercent.toFixed(1)}%)
              </span>
            )}
          </p>
        )}
      </div>

      <LineChart
        className="h-64"
        data={chartData}
        index="interaction"
        categories={['Evaluation Score', 'Target (0.70)']}
        colors={['blue', 'gray']}
        valueFormatter={valueFormatter}
        yAxisWidth={48}
        showAnimation={true}
        showLegend={true}
        showGridLines={true}
        showXAxis={true}
        showYAxis={true}
        minValue={0}
        maxValue={1}
      />

      <div className="mt-4 text-xs text-muted-foreground">
        <p>
          Total interactions: {chartData.length} • Target score: 0.70 • Current
          avg:{' '}
          {(
            chartData.reduce((sum, d) => sum + d['Evaluation Score'], 0) /
            chartData.length
          ).toFixed(2)}
        </p>
      </div>
    </Card>
  );
}

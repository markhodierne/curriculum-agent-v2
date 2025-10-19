/**
 * Dashboard Page - Learning Analytics
 *
 * Main dashboard page that assembles all dashboard components to display
 * learning metrics and interaction history for the Oak Curriculum Agent.
 *
 * Components Rendered:
 * - Learning Curve Chart: Shows evaluation score improvement over time
 * - Stats Cards: Display total interactions, average confidence, memories created
 * - Interactions Table: Last 20 interactions with sortable columns and details
 * - Pattern Library: Discovered query patterns from Neo4j
 *
 * Features:
 * - Back to Chat navigation button
 * - Manual refresh button to reload all data
 * - Responsive layout with Tailwind styling
 * - Full-height page with proper spacing
 *
 * Usage:
 *   Navigate to /dashboard from chat page or home page
 *
 * See: FUNCTIONAL.md section 3.3, ARCHITECTURE.md section 3
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { LearningCurve } from '@/components/dashboard/learning-curve';
import { StatsCards } from '@/components/dashboard/stats-cards';
import InteractionsTable from '@/components/dashboard/interactions-table';
import { PatternLibrary } from '@/components/dashboard/pattern-library';

/**
 * Dashboard Page Component
 *
 * Displays comprehensive learning analytics for the Oak Curriculum Agent.
 * All components fetch their own data on mount, so this page acts as a
 * layout wrapper with navigation controls.
 *
 * Layout Structure:
 * 1. Header with back button and title
 * 2. Manual refresh button
 * 3. Learning Curve chart (full width)
 * 4. Stats Cards (3-column grid)
 * 5. Interactions Table (full width)
 * 6. Pattern Library (full width)
 *
 * @returns Dashboard page with all analytics components
 */
export default function DashboardPage(): React.ReactElement {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  /**
   * Navigates back to chat page
   */
  function handleBackToChat(): void {
    router.push('/chat');
  }

  /**
   * Triggers manual refresh of all dashboard components
   *
   * Increments refreshKey to force remount of all child components,
   * causing them to re-fetch their data from Supabase/Neo4j.
   */
  function handleRefresh(): void {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with back button and title */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToChat}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-bold text-foreground">
              Learning Analytics Dashboard
            </h1>
          </div>

          {/* Manual refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main content area with all dashboard components */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="space-y-8" key={refreshKey}>
          {/* Learning Curve Chart - Shows improvement over time */}
          <section>
            <LearningCurve />
          </section>

          {/* Stats Cards - Three key metrics */}
          <section>
            <StatsCards />
          </section>

          {/* Interactions Table - Last 20 interactions with details */}
          <section>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Interactions
              </h2>
              <InteractionsTable />
            </div>
          </section>

          {/* Pattern Library - Discovered query patterns */}
          <section>
            <PatternLibrary />
          </section>
        </div>
      </main>

      {/* Footer with metadata */}
      <footer className="border-t bg-muted/50 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center">
            Dashboard shows learning metrics from evaluation and memory systems.
            Data refreshes on page load or manual refresh.
          </p>
        </div>
      </footer>
    </div>
  );
}

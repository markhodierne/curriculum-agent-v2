/**
 * Dashboard Stats API Route
 * Provides aggregated statistics for the dashboard
 */

import { NextResponse } from 'next/server';
import { getMemoryStats, countInteractions } from '@/lib/database/queries';

export async function GET() {
  try {
    const [memoryStats, interactionCount] = await Promise.all([
      getMemoryStats(),
      countInteractions(),
    ]);

    return NextResponse.json({
      totalInteractions: interactionCount,
      avgConfidence: memoryStats?.avg_confidence ?? 0,
      totalMemories: memoryStats?.total_memories ?? 0,
      avgOverallScore: memoryStats?.avg_overall_score ?? 0,
      totalPatterns: memoryStats?.total_patterns ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to load statistics' },
      { status: 500 }
    );
  }
}

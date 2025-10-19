/**
 * Dashboard Evaluations API Route
 * Provides evaluation metrics for the learning curve chart
 */

import { NextResponse } from 'next/server';
import { getAllEvaluationMetrics } from '@/lib/database/queries';

export async function GET() {
  try {
    const evaluations = await getAllEvaluationMetrics();

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Failed to fetch evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to load evaluations' },
      { status: 500 }
    );
  }
}

/**
 * Feedback API Route
 * Handles user feedback (thumbs up/down, grounded checkbox, notes) for chat interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createFeedback,
  updateFeedback,
  getFeedbackByInteractionId,
  getRecentInteractions,
} from '@/lib/database/queries';

/**
 * Helper to check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * GET /api/feedback?interactionId=xxx
 * Retrieves existing feedback for an interaction
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const interactionId = searchParams.get('interactionId');

    if (!interactionId) {
      return NextResponse.json(
        { error: 'interactionId is required' },
        { status: 400 }
      );
    }

    const feedback = await getFeedbackByInteractionId(interactionId);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Failed to get feedback:', error);
    return NextResponse.json(
      { error: 'Failed to load feedback' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 * Creates or updates feedback for an interaction
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { interactionId, feedbackId, thumbsUp, note } = body;

    if (!interactionId) {
      return NextResponse.json(
        { error: 'interactionId is required' },
        { status: 400 }
      );
    }

    // MVP WORKAROUND: If interactionId is not a valid UUID (it's an AI SDK message ID),
    // look up the most recent interaction and use that UUID instead.
    // TODO: Add message_id column to interactions table for proper mapping
    if (!isValidUUID(interactionId)) {
      console.log(`⚠️ Received non-UUID message ID: ${interactionId}, looking up most recent interaction...`);
      const recentInteractions = await getRecentInteractions(1);
      if (recentInteractions.length > 0) {
        interactionId = recentInteractions[0].id;
        console.log(`   ✅ Using interaction UUID: ${interactionId}`);
      } else {
        return NextResponse.json(
          { error: 'No interactions found' },
          { status: 404 }
        );
      }
    }

    let result;

    if (feedbackId) {
      // Update existing feedback
      await updateFeedback(feedbackId, {
        thumbsUp,
        note,
      });
      result = { feedbackId, updated: true };
    } else {
      // Create new feedback
      try {
        const newFeedbackId = await createFeedback({
          interactionId,
          thumbsUp,
          note,
        });
        result = { feedbackId: newFeedbackId, created: true };
      } catch (err: any) {
        console.error('Feedback creation error:', err);
        console.error('Error message:', err.message);
        console.error('Error details:', JSON.stringify(err, null, 2));

        // Check if error is due to foreign key constraint (interaction doesn't exist yet)
        if (err.message?.includes('violates foreign key constraint') ||
            err.message?.includes('insert or update on table "feedback"') ||
            err.message?.includes('foreign key') ||
            err.code === '23503') { // PostgreSQL foreign key violation code
          // Interaction hasn't been saved yet - return 202 (Accepted) to retry later
          console.log('🔄 Interaction not ready, returning 202 for retry');
          return NextResponse.json(
            { error: 'Interaction not ready yet', retry: true },
            { status: 202 }
          );
        }
        throw err;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

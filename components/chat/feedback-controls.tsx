/**
 * Feedback Controls Component
 *
 * User feedback controls for chat assistant messages.
 * Allows users to provide thumbs up/down, grounding assessment, and optional notes.
 *
 * Features:
 * - Thumbs up/down buttons (mutually exclusive)
 * - "Well grounded?" checkbox
 * - "Add note" button that reveals textarea (max 500 chars)
 * - Auto-saves to Supabase on interaction
 *
 * Usage:
 *   <FeedbackControls messageId={interactionId} />
 *
 * References:
 * - FUNCTIONAL.md section 4.2.D: Feedback control specifications
 * - ARCHITECTURE.md section 4.2: Supabase feedback table schema
 * - Task 4: Database queries (createFeedback, updateFeedback)
 */

'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

/**
 * Props for FeedbackControls component
 */
interface FeedbackControlsProps {
  /** UUID of the interaction (message) to provide feedback for */
  messageId: string;
}

/**
 * Feedback state interface
 */
interface FeedbackState {
  feedbackId: string | null;
  thumbsUp: boolean | null;
  wellGrounded: boolean | null;
  note: string;
  showNoteInput: boolean;
}

/**
 * Feedback Controls Component
 *
 * Renders interactive feedback controls for a chat message.
 * Saves feedback to Supabase on every interaction.
 *
 * @param props.messageId - UUID of the interaction
 */
export default function FeedbackControls({ messageId }: FeedbackControlsProps) {
  const [state, setState] = useState<FeedbackState>({
    feedbackId: null,
    thumbsUp: null,
    wellGrounded: null,
    note: '',
    showNoteInput: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load existing feedback on mount via API route
   */
  useEffect(() => {
    async function loadFeedback(): Promise<void> {
      try {
        const response = await fetch(`/api/feedback?interactionId=${messageId}`);

        // Gracefully handle 404 (interaction not created yet) or 500 errors
        if (!response.ok) {
          if (response.status === 404 || response.status === 500) {
            // Interaction hasn't been saved yet - this is normal during streaming
            return;
          }
          throw new Error('Failed to fetch feedback');
        }

        const { feedback } = await response.json();
        if (feedback) {
          setState({
            feedbackId: feedback.id,
            thumbsUp: feedback.thumbs_up,
            wellGrounded: feedback.well_grounded,
            note: feedback.note || '',
            showNoteInput: !!feedback.note,
          });
        }
      } catch (err) {
        // Silently fail - don't show errors for missing interactions
        // The interaction will be created asynchronously after streaming completes
      }
    }

    loadFeedback();
  }, [messageId]);

  /**
   * Saves feedback via API route (create or update)
   * Retries if interaction hasn't been saved yet
   */
  async function saveFeedback(updates: Partial<FeedbackState>, retryCount = 0): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const newState = { ...state, ...updates };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: messageId,
          feedbackId: state.feedbackId,
          thumbsUp: newState.thumbsUp,
          wellGrounded: newState.wellGrounded,
          note: newState.note || null,
        }),
      });

      if (response.status === 202) {
        // Interaction not ready yet - retry after 1 second (max 5 retries = 5 seconds)
        if (retryCount < 5) {
          setTimeout(() => {
            saveFeedback(updates, retryCount + 1);
          }, 1000);
          return;
        } else {
          setError('Please wait a moment and try again.');
          setIsSaving(false);
          return;
        }
      }

      if (!response.ok) {
        // Log the actual error for debugging
        const errorText = await response.text();
        console.error('Feedback save failed:', response.status, errorText);
        throw new Error(`Failed to save feedback: ${response.status}`);
      }

      const result = await response.json();

      // Update state with feedback ID if newly created
      if (result.created && result.feedbackId) {
        setState((prev) => ({ ...prev, feedbackId: result.feedbackId, ...updates }));
      } else {
        setState((prev) => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
      setError('Failed to save feedback. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Handles thumbs up button click
   */
  function handleThumbsUp(): void {
    const newValue = state.thumbsUp === true ? null : true;
    saveFeedback({ thumbsUp: newValue });
  }

  /**
   * Handles thumbs down button click
   */
  function handleThumbsDown(): void {
    const newValue = state.thumbsUp === false ? null : false;
    saveFeedback({ thumbsUp: newValue });
  }

  /**
   * Handles "Well grounded?" checkbox toggle
   */
  function handleWellGroundedChange(checked: boolean): void {
    saveFeedback({ wellGrounded: checked });
  }

  /**
   * Handles note textarea change
   */
  function handleNoteChange(value: string): void {
    // Enforce 500 character limit
    const truncated = value.slice(0, 500);
    setState((prev) => ({ ...prev, note: truncated }));
  }

  /**
   * Handles note textarea blur (save to database)
   */
  function handleNoteBlur(): void {
    saveFeedback({ note: state.note });
  }

  /**
   * Toggles note input visibility
   */
  function handleToggleNoteInput(): void {
    setState((prev) => ({ ...prev, showNoteInput: !prev.showNoteInput }));
  }

  return (
    <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-gray-200">
      {/* Feedback buttons row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Thumbs up/down */}
        <div className="flex items-center gap-1">
          <Button
            variant={state.thumbsUp === true ? 'default' : 'outline'}
            size="sm"
            onClick={handleThumbsUp}
            disabled={isSaving}
            className="h-8 w-8 p-0"
            aria-label="Thumbs up"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant={state.thumbsUp === false ? 'default' : 'outline'}
            size="sm"
            onClick={handleThumbsDown}
            disabled={isSaving}
            className="h-8 w-8 p-0"
            aria-label="Thumbs down"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Well grounded checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`grounded-${messageId}`}
            checked={state.wellGrounded === true}
            onCheckedChange={handleWellGroundedChange}
            disabled={isSaving}
          />
          <label
            htmlFor={`grounded-${messageId}`}
            className="text-sm font-medium cursor-pointer select-none"
          >
            Well grounded?
          </label>
        </div>

        {/* Add note button */}
        <Button
          variant={state.showNoteInput ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleNoteInput}
          disabled={isSaving}
          className="h-8"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Add note
        </Button>

        {/* Error message */}
        {error && (
          <span className="text-sm text-red-600 ml-2">{error}</span>
        )}
      </div>

      {/* Note textarea (conditionally rendered) */}
      {state.showNoteInput && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="What could be improved?"
            value={state.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            onBlur={handleNoteBlur}
            disabled={isSaving}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {state.note.length}/500 characters
            </span>
            {isSaving && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

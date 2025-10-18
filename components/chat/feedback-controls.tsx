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
import {
  createFeedback,
  updateFeedback,
  getFeedbackByInteractionId,
} from '@/lib/database/queries';

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
   * Load existing feedback on mount
   */
  useEffect(() => {
    async function loadFeedback(): Promise<void> {
      try {
        const existing = await getFeedbackByInteractionId(messageId);
        if (existing) {
          setState({
            feedbackId: existing.id,
            thumbsUp: existing.thumbs_up,
            wellGrounded: existing.well_grounded,
            note: existing.note || '',
            showNoteInput: !!existing.note,
          });
        }
      } catch (err) {
        console.error('Failed to load feedback:', err);
        // Don't show error to user - just log it
      }
    }

    loadFeedback();
  }, [messageId]);

  /**
   * Saves feedback to Supabase (create or update)
   */
  async function saveFeedback(updates: Partial<FeedbackState>): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const newState = { ...state, ...updates };

      if (state.feedbackId) {
        // Update existing feedback
        await updateFeedback(state.feedbackId, {
          interactionId: messageId,
          thumbsUp: newState.thumbsUp,
          wellGrounded: newState.wellGrounded,
          note: newState.note || null,
        });
      } else {
        // Create new feedback
        const feedbackId = await createFeedback({
          interactionId: messageId,
          thumbsUp: newState.thumbsUp,
          wellGrounded: newState.wellGrounded,
          note: newState.note || null,
        });
        setState((prev) => ({ ...prev, feedbackId }));
      }

      setState((prev) => ({ ...prev, ...updates }));
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

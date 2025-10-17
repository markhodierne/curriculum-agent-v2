/**
 * Reflection Agent - Async Interaction Evaluation
 *
 * This Inngest function implements the Reflection Agent, which acts as an
 * "LLM-as-judge" to evaluate the quality of Query Agent interactions.
 *
 * Workflow:
 * 1. Triggered by `interaction.complete` event from Query Agent
 * 2. Evaluates interaction on 5-dimension rubric using GPT-4o
 * 3. Calculates weighted overall score
 * 4. Saves evaluation metrics to Supabase
 * 5. Emits `reflection.complete` event to trigger Learning Agent
 *
 * Rubric Dimensions (0.0-1.0):
 * - Grounding (30%): Claims supported by graph evidence
 * - Accuracy (30%): Information correct per curriculum
 * - Completeness (20%): Fully answers the question
 * - Pedagogy (10%): Appropriate curriculum context
 * - Clarity (10%): Well-structured and clear
 *
 * Performance Target: Complete within 30s of interaction
 *
 * Error Handling: If evaluation fails after 3 retries, uses default scores
 * to avoid blocking the learning pipeline. Logs errors for debugging.
 *
 * @see ARCHITECTURE.md Section 6.2 (Reflection Agent)
 * @see FUNCTIONAL.md Section 4.4 (Three-Agent System)
 * @see CLAUDE.md (Inngest Integration, Error Handling)
 *
 * @module lib/inngest/functions/reflection
 */

import { inngest } from '@/lib/inngest/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { EvaluationSchema, type Evaluation } from '@/lib/types/evaluation';
import { buildEvaluationPrompt } from '@/lib/agents/prompts/reflection-prompt';
import { createEvaluationMetrics } from '@/lib/database/queries';

/**
 * Returns default evaluation scores for fallback scenarios
 *
 * Used when LLM evaluation fails after retries. Provides neutral scores
 * (0.5) to avoid blocking the learning pipeline while indicating that
 * automatic evaluation was unsuccessful.
 *
 * @returns Default evaluation with neutral scores
 */
function getDefaultEvaluation(): Evaluation {
  return {
    grounding: 0.5,
    accuracy: 0.5,
    completeness: 0.5,
    pedagogy: 0.5,
    clarity: 0.5,
    overall: 0.5,
    strengths: [],
    weaknesses: ['Automatic evaluation failed, using default scores'],
    suggestions: ['Review interaction manually to assess quality'],
  };
}

/**
 * Reflection Agent Inngest Function
 *
 * Listens for `interaction.complete` events and evaluates interaction quality
 * using an LLM-as-judge approach. Produces structured evaluation scores that
 * guide the learning process.
 *
 * Configuration:
 * - ID: 'reflection-agent'
 * - Retries: 3 attempts with exponential backoff
 * - onFailure: Emits event with default scores to continue pipeline
 *
 * Steps:
 * 1. evaluate-interaction: Call GPT-4o with evaluation rubric
 * 2. calculate-overall-score: Compute weighted average
 * 3. save-evaluation: Store metrics in Supabase
 * 4. trigger-learning: Emit event for Learning Agent
 *
 * @example
 * ```typescript
 * // This function is automatically triggered by events
 * // Registered in app/api/inngest/route.ts
 *
 * // Query Agent emits event:
 * await inngest.send({
 *   name: 'interaction.complete',
 *   data: { interactionId, query, answer, ... }
 * });
 *
 * // Reflection function processes asynchronously
 * // Then emits reflection.complete for Learning Agent
 * ```
 */
export const reflectionFunction = inngest.createFunction(
  {
    id: 'reflection-agent',
    name: 'Reflection Agent - Evaluate Interaction',
    retries: 3,
    onFailure: async ({ error, event, step }) => {
      // Log failure for debugging
      console.error('Reflection Agent failed after 3 retries:', error);
      console.error('Event data:', JSON.stringify(event.data, null, 2));

      // Continue pipeline with default scores to avoid blocking learning
      await step.sendEvent('emit-default-evaluation', {
        name: 'reflection.complete',
        data: {
          ...event.data,
          evaluation: getDefaultEvaluation(),
        },
      });

      console.log('Emitted reflection.complete with default scores');
    },
  },
  { event: 'interaction.complete' },
  async ({ event, step }) => {
    console.log(`Reflection Agent starting for interaction: ${event.data.interactionId}`);

    // Step 1: Evaluate using LLM-as-judge
    const evaluation = await step.run('evaluate-interaction', async () => {
      try {
        const prompt = buildEvaluationPrompt(
          event.data.query,
          event.data.answer,
          event.data.cypherQueries,
          event.data.graphResults
        );

        console.log('Calling GPT-4o for evaluation...');

        const result = await generateObject({
          model: openai('gpt-4o'),
          schema: EvaluationSchema,
          prompt,
        });

        console.log('Evaluation complete:', {
          grounding: result.object.grounding,
          accuracy: result.object.accuracy,
          overall: result.object.overall,
        });

        return result.object;
      } catch (error) {
        console.error('Evaluation failed in step, using defaults:', error);
        // Return defaults instead of throwing to avoid step retry
        return getDefaultEvaluation();
      }
    });

    // Step 2: Calculate overall score (weighted average)
    const overallScore = await step.run('calculate-overall-score', async () => {
      const weighted =
        evaluation.grounding * 0.30 +
        evaluation.accuracy * 0.30 +
        evaluation.completeness * 0.20 +
        evaluation.pedagogy * 0.10 +
        evaluation.clarity * 0.10;

      console.log(`Calculated overall score: ${weighted.toFixed(3)}`);

      return weighted;
    });

    // Step 3: Save to Supabase
    await step.run('save-evaluation', async () => {
      try {
        const evaluationId = await createEvaluationMetrics({
          interactionId: event.data.interactionId,
          groundingScore: evaluation.grounding,
          accuracyScore: evaluation.accuracy,
          completenessScore: evaluation.completeness,
          pedagogyScore: evaluation.pedagogy,
          clarityScore: evaluation.clarity,
          overallScore: overallScore,
          evaluatorNotes: JSON.stringify({
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            suggestions: evaluation.suggestions,
          }),
        });

        console.log(`Evaluation saved to Supabase: ${evaluationId}`);

        return evaluationId;
      } catch (error) {
        console.error('Failed to save evaluation to Supabase:', error);
        // Don't throw - evaluation still succeeded, just logging failed
        // Learning Agent can still use the evaluation from event data
        return null;
      }
    });

    // Step 4: Emit event for Learning Agent
    await step.sendEvent('trigger-learning', {
      name: 'reflection.complete',
      data: {
        ...event.data,
        evaluation: {
          ...evaluation,
          overall: overallScore,
        },
      },
    });

    console.log(`Reflection complete. Emitted reflection.complete event. Overall: ${overallScore.toFixed(3)}`);

    return {
      success: true,
      overallScore,
      evaluation,
    };
  }
);

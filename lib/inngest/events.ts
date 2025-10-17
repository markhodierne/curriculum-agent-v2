/**
 * Inngest Event Type Definitions
 *
 * Defines TypeScript types for events used in the three-agent learning loop:
 * - `interaction.complete`: Emitted by Query Agent after responding to user
 * - `reflection.complete`: Emitted by Reflection Agent after evaluating interaction
 *
 * These types ensure type safety across the async event-driven workflow.
 *
 * @see ARCHITECTURE.md Section 1.2 (Three-Agent Flow)
 * @see CLAUDE.md (Inngest Integration)
 */

import type { Evaluation } from '@/lib/types/evaluation';

/**
 * Event emitted by Query Agent when user interaction completes
 *
 * Triggers: Reflection Agent (async)
 *
 * Contains all data needed for evaluation:
 * - User's original query
 * - Agent's final answer
 * - Cypher queries executed
 * - Graph results retrieved
 * - Citation node IDs used as evidence
 * - Overall confidence score
 * - Interaction metadata
 */
export interface InteractionCompleteEvent {
  name: 'interaction.complete';
  data: {
    /** UUID of the interaction record in Supabase */
    interactionId: string;

    /** User's original question */
    query: string;

    /** Agent's final answer text */
    answer: string;

    /** Model used for this interaction (e.g., 'gpt-4o') */
    model: string;

    /** Temperature setting (0.0-1.0) */
    temperature: number;

    /** Array of Cypher queries executed by agent */
    cypherQueries: string[];

    /** Raw results returned from Neo4j for each query */
    graphResults: Record<string, any>[];

    /** Node IDs cited in the answer (e.g., ['Y3-F-001', 'Y3-F-002']) */
    evidenceNodeIds: string[];

    /** Overall confidence score for the answer (0.0-1.0) */
    confidence: number;

    /** Percentage of claims with valid citations (0.0-1.0) */
    groundingRate: number;

    /** Number of agent steps taken (tool calls) */
    stepCount: number;

    /** Response latency in milliseconds */
    latencyMs: number;

    /** IDs of memories retrieved and used as few-shot examples */
    memoriesUsed: string[];

    /** Timestamp when interaction occurred */
    timestamp: Date;
  };
}

/**
 * Event emitted by Reflection Agent after evaluating an interaction
 *
 * Triggers: Learning Agent (async)
 *
 * Contains all data from interaction.complete plus evaluation scores.
 * This enables Learning Agent to create high-quality memory nodes.
 */
export interface ReflectionCompleteEvent {
  name: 'reflection.complete';
  data: {
    /** UUID of the interaction record in Supabase */
    interactionId: string;

    /** User's original question */
    query: string;

    /** Agent's final answer text */
    answer: string;

    /** Model used for this interaction */
    model: string;

    /** Temperature setting */
    temperature: number;

    /** Array of Cypher queries executed */
    cypherQueries: string[];

    /** Raw graph results */
    graphResults: Record<string, any>[];

    /** Node IDs cited as evidence */
    evidenceNodeIds: string[];

    /** Overall confidence score */
    confidence: number;

    /** Grounding rate */
    groundingRate: number;

    /** Number of agent steps */
    stepCount: number;

    /** Response latency */
    latencyMs: number;

    /** IDs of memories used */
    memoriesUsed: string[];

    /** Original timestamp */
    timestamp: Date;

    /**
     * Evaluation scores from Reflection Agent
     *
     * 5-dimension rubric:
     * - grounding: Claims supported by graph evidence (30% weight)
     * - accuracy: Information correct per curriculum (30% weight)
     * - completeness: Fully answers the question (20% weight)
     * - pedagogy: Appropriate curriculum context (10% weight)
     * - clarity: Well-structured and clear (10% weight)
     * - overall: Weighted average of above
     *
     * Plus qualitative feedback (strengths, weaknesses, suggestions)
     */
    evaluation: Evaluation;
  };
}

/**
 * Union type of all Inngest events in the system
 *
 * Use this type when handling multiple event types or
 * registering event handlers that accept any event.
 */
export type InngestEvent = InteractionCompleteEvent | ReflectionCompleteEvent;

/**
 * Type guard to check if an event is InteractionCompleteEvent
 */
export function isInteractionCompleteEvent(
  event: InngestEvent
): event is InteractionCompleteEvent {
  return event.name === 'interaction.complete';
}

/**
 * Type guard to check if an event is ReflectionCompleteEvent
 */
export function isReflectionCompleteEvent(
  event: InngestEvent
): event is ReflectionCompleteEvent {
  return event.name === 'reflection.complete';
}

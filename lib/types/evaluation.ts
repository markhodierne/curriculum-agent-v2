import { z } from 'zod';

/**
 * Zod schema for structured evaluation output from the Reflection Agent
 * Used with AI SDK generateObject() for type-safe LLM responses
 */
export const EvaluationSchema = z.object({
  /** Grounding score: How well claims are supported by graph evidence (0.0-1.0, 30% weight) */
  grounding: z.number().min(0).max(1),
  /** Accuracy score: Correctness of information per curriculum (0.0-1.0, 30% weight) */
  accuracy: z.number().min(0).max(1),
  /** Completeness score: How fully the question was answered (0.0-1.0, 20% weight) */
  completeness: z.number().min(0).max(1),
  /** Pedagogy score: Appropriateness of pedagogical framing (0.0-1.0, 10% weight) */
  pedagogy: z.number().min(0).max(1),
  /** Clarity score: How clear and well-structured the answer is (0.0-1.0, 10% weight) */
  clarity: z.number().min(0).max(1),
  /** Overall weighted score (0.0-1.0) */
  overall: z.number().min(0).max(1),
  /** List of strengths identified in the interaction */
  strengths: z.array(z.string()),
  /** List of weaknesses identified in the interaction */
  weaknesses: z.array(z.string()),
  /** List of suggestions for improvement */
  suggestions: z.array(z.string()),
});

/**
 * TypeScript type inferred from EvaluationSchema
 * Represents the structured evaluation output from the Reflection Agent
 */
export type Evaluation = z.infer<typeof EvaluationSchema>;

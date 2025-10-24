import type { CoreMessage } from 'ai';

/**
 * Context passed to agents for processing user queries
 */
export interface AgentContext {
  /** Array of conversation messages in AI SDK format */
  messages: CoreMessage[];
  /** LLM model identifier (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-5') */
  model: string;
  /** Temperature for response generation (0.0-1.0) */
  temperature: number;
  /** Maximum tokens to generate */
  maxTokens: number;
}

/**
 * Result returned by the Query Agent after processing a user query
 */
export interface QueryAgentResult {
  /** Generated answer text */
  answer: string;
  /** Overall confidence score (0.0-1.0) */
  confidence: number;
  /** Cypher queries executed during answer generation */
  cypherQueries: string[];
  /** Number of agent steps taken */
  stepCount: number;
  /** Total response latency in milliseconds */
  latencyMs: number;
}

/**
 * Memory node representing a past interaction stored in Neo4j
 * Used for few-shot learning and continuous improvement
 */
export interface Memory {
  /** Unique identifier (UUID) */
  id: string;
  /** Memory type - always 'episodic' in Phase 1 */
  type: 'episodic';
  /** Original user query text */
  userQuery: string;
  /** Agent's final answer text */
  finalAnswer: string;
  /** Array of Cypher queries executed */
  cypherUsed: string[];
  /** Overall confidence score (0.0-1.0) */
  confidenceOverall: number;
  /** Grounding evaluation score (0.0-1.0) */
  groundingScore: number;
  /** Accuracy evaluation score (0.0-1.0) */
  accuracyScore: number;
  /** Completeness evaluation score (0.0-1.0) */
  completenessScore: number;
  /** Pedagogy evaluation score (0.0-1.0) */
  pedagogyScore: number;
  /** Clarity evaluation score (0.0-1.0) */
  clarityScore: number;
  /** Weighted overall evaluation score (0.0-1.0) */
  overallScore: number;
  /** LLM-as-judge feedback and notes */
  evaluatorNotes: string;
  /** Embedding vector for similarity search (1536 dimensions) */
  embedding: number[];
  /** IDs of memories used as few-shot examples for this interaction */
  memoriesUsed: string[];
  /** Timestamp when memory was created */
  createdAt: Date;
}

/**
 * Query pattern representing a learned Cypher query strategy
 * Extracted from high-quality interactions (score > 0.8)
 */
export interface QueryPattern {
  /** Unique identifier (UUID) */
  id: string;
  /** Pattern name (e.g., 'objectives_by_year') */
  name: string;
  /** Human-readable description of the pattern */
  description: string;
  /** Parameterized Cypher query template */
  cypherTemplate: string;
  /** Number of times pattern was used successfully */
  successCount: number;
  /** Number of times pattern failed */
  failureCount: number;
}

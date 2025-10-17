/**
 * OpenAI Embeddings Service
 *
 * Provides embedding generation for memory retrieval and similarity search.
 * Uses text-embedding-3-small model (1536 dimensions) for cost-effective,
 * high-quality vector representations.
 *
 * @module lib/memory/embeddings
 */

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Generates a 1536-dimensional embedding vector for the given text
 *
 * This function uses OpenAI's text-embedding-3-small model to create
 * vector representations of text for similarity search in Neo4j.
 *
 * Usage:
 * ```typescript
 * const embedding = await generateEmbedding("What fractions do Year 3 students learn?");
 * // Returns: [0.0123, -0.0456, 0.0789, ...] (1536 dimensions)
 * ```
 *
 * @param text - The text to embed (user query, memory content, etc.)
 * @returns Promise resolving to a 1536-dimensional float array
 * @throws Error if OpenAI API call fails or API key is missing
 *
 * @see ARCHITECTURE.md section 2.2 for model specifications
 * @see CLAUDE.md for error handling patterns
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Validate API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. ' +
        'Please configure it in .env.local'
      );
    }

    // Generate embedding using AI SDK
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    });

    // Validate embedding dimensions
    if (embedding.length !== 1536) {
      throw new Error(
        `Expected 1536-dimensional embedding, got ${embedding.length} dimensions`
      );
    }

    return embedding;
  } catch (error) {
    // Log error for debugging
    console.error('Embedding generation failed:', {
      error: error instanceof Error ? error.message : String(error),
      textLength: text?.length || 0,
      textPreview: text?.substring(0, 100) || '',
    });

    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }

    throw new Error('Failed to generate embedding: Unknown error');
  }
}

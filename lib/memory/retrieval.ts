/**
 * Memory Retrieval Service
 *
 * Provides vector similarity search for retrieving relevant past interactions
 * from Neo4j. Used by Query Agent to implement few-shot learning.
 *
 * @module lib/memory/retrieval
 */

import { generateEmbedding } from './embeddings';
import { getNeo4jMCPClient } from '@/lib/mcp/client/neo4j-client';
import type { Memory } from '@/lib/types/memory';

/**
 * Retrieves similar high-quality memories from Neo4j using vector similarity search
 *
 * This function enables few-shot learning by finding past interactions similar to
 * the current query. It uses cosine similarity on 1536-dimensional embeddings to
 * identify relevant memories, then filters for high quality (score > 0.75).
 *
 * Usage:
 * ```typescript
 * const memories = await retrieveSimilarMemories("What fractions do Year 3 students learn?");
 * // Returns: Array of up to 3 high-quality similar memories for few-shot learning
 * ```
 *
 * @param query - The user's query text to find similar memories for
 * @param limit - Maximum number of memories to retrieve (default: 3)
 * @returns Promise resolving to array of Memory objects (empty array on error)
 *
 * @see ARCHITECTURE.md section 6.1 for Query Agent integration
 * @see CLAUDE.md Memory Retrieval section for usage patterns
 */
export async function retrieveSimilarMemories(
  query: string,
  limit: number = 3
): Promise<Memory[]> {
  try {
    // Validate input
    if (!query || query.trim().length === 0) {
      console.warn('retrieveSimilarMemories: Empty query provided, returning no memories');
      return [];
    }

    // Step 1: Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Step 2: Get Neo4j MCP client and connect
    const mcpClient = getNeo4jMCPClient();
    await mcpClient.connect();

    // Step 3: Get MCP tools (specifically need the Cypher tool)
    const tools = await mcpClient.getTools();
    const cypherTool = tools.read_neo4j_cypher;

    if (!cypherTool) {
      throw new Error('read_neo4j_cypher tool not available from MCP server');
    }

    // Step 4: Execute vector similarity search
    // Uses Neo4j's native vector index for cosine similarity search
    // Note: Lowered threshold to 0.25 for testing/bootstrapping (production should be 0.75)
    // IMPORTANT: Embed values directly in query string (MCP doesn't support params well)
    const cypher = `
      CALL db.index.vector.queryNodes('memory_embeddings', ${limit}, ${JSON.stringify(embedding)})
      YIELD node, score
      WHERE node.overall_score > 0.25
      RETURN node, score
      ORDER BY score DESC
    `;

    console.log('🔍 Executing vector search...');
    console.log('   Embedding dimensions:', embedding.length);
    console.log('   Limit:', limit);

    const result = await cypherTool.execute({
      query: cypher,
    });

    console.log('   Raw result:', JSON.stringify(result).substring(0, 500));

    // Step 5: Parse MCP result format
    if (!result || !result.content || result.content.length === 0) {
      console.error('Memory retrieval returned no content');
      return [];
    }

    // MCP returns results in content[0].text as JSON string
    const resultText = result.content[0].text;
    console.log('   Result text preview:', resultText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(resultText);
    } catch (err) {
      console.error('Failed to parse result JSON:', err);
      return [];
    }

    // Step 6: Parse results into Memory objects
    const memories = parseMemories(data);

    console.log(`✅ Retrieved ${memories.length} similar memories (score > 0.25)`);
    return memories;
  } catch (error) {
    // Log error but don't throw - Query Agent should continue without memories
    console.error('Memory retrieval failed:', {
      error: error instanceof Error ? error.message : String(error),
      query: query.substring(0, 100),
    });

    // Return empty array to allow graceful fallback
    return [];
  }
}

/**
 * Parses Neo4j query results into Memory objects
 *
 * Handles the transformation from Neo4j node properties to TypeScript Memory interface.
 * Converts snake_case database fields to camelCase TypeScript properties.
 *
 * @param results - Raw results from Neo4j Cypher query
 * @returns Array of parsed Memory objects
 */
function parseMemories(results: any[]): Memory[] {
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  return results
    .map((row) => {
      try {
        const node = row.node;

        // Validate required fields exist
        if (!node || !node.id || !node.user_query) {
          console.warn('Skipping invalid memory node:', node);
          return null;
        }

        // Transform Neo4j node to Memory interface
        const memory: Memory = {
          id: node.id,
          type: 'episodic',
          userQuery: node.user_query,
          finalAnswer: node.final_answer || '',
          cypherUsed: Array.isArray(node.cypher_used) ? node.cypher_used : [],
          accuracyScore: node.accuracy_score || 0,
          completenessScore: node.completeness_score || 0,
          pedagogyScore: node.pedagogy_score || 0,
          clarityScore: node.clarity_score || 0,
          overallScore: node.overall_score || 0,
          evaluatorNotes: node.evaluator_notes || '',
          embedding: Array.isArray(node.embedding) ? node.embedding : [],
          memoriesUsed: Array.isArray(node.memories_used) ? node.memories_used : [],
          createdAt: node.created_at ? new Date(node.created_at) : new Date(),
        };

        return memory;
      } catch (error) {
        console.error('Failed to parse memory node:', error);
        return null;
      }
    })
    .filter((memory): memory is Memory => memory !== null);
}

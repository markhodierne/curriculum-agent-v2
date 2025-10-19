/**
 * Learning Agent - Async Memory Creation and Pattern Extraction
 *
 * This Inngest function implements the Learning Agent, which creates persistent
 * memories from evaluated interactions and extracts successful patterns for
 * future use in few-shot learning.
 *
 * Workflow:
 * 1. Triggered by `reflection.complete` event from Reflection Agent
 * 2. Generates embedding for the user query
 * 3. Creates :Memory node in Neo4j with all evaluation scores
 * 4. Links memory to evidence nodes via :USED_EVIDENCE relationships
 * 5. Extracts :QueryPattern if overall score > 0.8
 * 6. Finds and links similar memories via :SIMILAR_TO relationships
 * 7. Updates cached memory statistics in Supabase
 *
 * Memory Node Properties:
 * - Query text and embedding (for retrieval)
 * - Answer text and Cypher queries used
 * - All 5 evaluation scores + overall score
 * - Evaluator feedback notes
 * - Timestamp metadata
 *
 * Learning Mechanism:
 * High-quality memories (score > 0.75) are retrieved as few-shot examples
 * by the Query Agent, enabling it to learn from successful past interactions.
 *
 * Performance Target: Complete within 30s of reflection
 *
 * Error Handling: Uses granular step.run() for independent retry of each
 * operation. Non-critical steps (pattern extraction, similar memory linking)
 * don't fail the entire function if they error.
 *
 * @see ARCHITECTURE.md Section 6.3 (Learning Agent)
 * @see FUNCTIONAL.md Section 4.4 (Three-Agent System)
 * @see CLAUDE.md (Inngest Integration, Error Handling)
 *
 * @module lib/inngest/functions/learning
 */

import { inngest } from '@/lib/inngest/client';
import { generateEmbedding } from '@/lib/memory/embeddings';
import { updateMemoryStats } from '@/lib/database/queries';
import { getNeo4jMCPClient } from '@/lib/mcp/client/neo4j-client';

/**
 * Hashes a Cypher query to identify its structural pattern
 *
 * Extracts the MATCH pattern from a Cypher query and normalizes it to
 * a pattern name for tracking successful query structures.
 *
 * Strategy:
 * - Extracts MATCH clause from query
 * - Removes property filters (e.g., {year: 3} → empty)
 * - Normalizes whitespace to underscores
 * - Converts to lowercase for consistency
 *
 * Examples:
 * - "MATCH (o:Objective {year: 3})" → "o:objective"
 * - "MATCH (o:Objective)-[:PART_OF]->(s:Strand)" → "o:objective-[:part_of]->s:strand"
 *
 * @param cypher - Cypher query string to analyze
 * @returns Pattern name for tracking (e.g., "o:objective")
 */
function hashCypherPattern(cypher: string): string {
  try {
    // Extract MATCH pattern (case-insensitive)
    const matchRegex = /MATCH\s+\(([^)]+)\)/i;
    const match = cypher.match(matchRegex);

    if (!match || !match[1]) {
      return 'unknown_pattern';
    }

    // Get the pattern and normalize
    const pattern = match[1]
      .replace(/\{[^}]+\}/g, '') // Remove property filters
      .replace(/\s+/g, '_') // Replace whitespace with underscores
      .toLowerCase()
      .trim();

    return pattern || 'unknown_pattern';
  } catch (error) {
    console.error('Error hashing Cypher pattern:', error);
    return 'unknown_pattern';
  }
}

/**
 * Learning Agent Inngest Function
 *
 * Listens for `reflection.complete` events and creates persistent memories
 * in Neo4j for future retrieval by the Query Agent. This is the core learning
 * mechanism that enables the agent to improve over time.
 *
 * Configuration:
 * - ID: 'learning-agent'
 * - Retries: 3 attempts with exponential backoff
 * - No onFailure handler (failures logged but don't block)
 *
 * Steps:
 * 1. generate-embedding: Create embedding for query text
 * 2. create-memory-node: Write :Memory node to Neo4j
 * 3. link-evidence: Connect memory to cited nodes
 * 4. extract-pattern: Create :QueryPattern if high quality (score > 0.8)
 * 5. link-similar-memories: Find and link similar past memories
 * 6. update-stats: Update cached statistics in Supabase
 *
 * Non-critical Steps:
 * - Pattern extraction (step 4): Optional, doesn't fail if error
 * - Similar memory linking (step 5): Optional, doesn't fail if error
 *
 * @example
 * ```typescript
 * // This function is automatically triggered by events
 * // Registered in app/api/inngest/route.ts
 *
 * // Reflection Agent emits event:
 * await inngest.send({
 *   name: 'reflection.complete',
 *   data: { interactionId, query, evaluation, ... }
 * });
 *
 * // Learning function processes asynchronously
 * // Creates memory available for next Query Agent call
 * ```
 */
export const learningFunction = inngest.createFunction(
  {
    id: 'learning-agent',
    name: 'Learning Agent - Create Memory',
    retries: 3,
  },
  { event: 'reflection.complete' },
  async ({ event, step }) => {
    console.log(`Learning Agent starting for interaction: ${event.data.interactionId}`);
    console.log(`Evaluation overall score: ${event.data.evaluation.overall.toFixed(3)}`);

    // Step 1: Generate embedding for query
    const embedding = await step.run('generate-embedding', async () => {
      try {
        console.log('Generating embedding for query...');
        const embeddingVector = await generateEmbedding(event.data.query);
        console.log(`Embedding generated: ${embeddingVector.length} dimensions`);
        return embeddingVector;
      } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error; // Critical step - fail if embedding fails
      }
    });

    // Step 2: Create :Memory node in Neo4j
    const memoryId = await step.run('create-memory-node', async () => {
      try {
        console.log('Creating :Memory node in Neo4j...');

        const mcpClient = getNeo4jMCPClient();
        await mcpClient.connect();
        const tools = await mcpClient.getTools();

        console.log('Available MCP tools:', Object.keys(tools));

        // Get the write-enabled Cypher tool (not read-only)
        const cypherTool = tools.write_neo4j_cypher || tools.read_neo4j_cypher;

        if (!cypherTool) {
          throw new Error('No Cypher execution tool available from MCP');
        }

        console.log('Using tool:', cypherTool === tools.write_neo4j_cypher ? 'write_neo4j_cypher' : 'read_neo4j_cypher');

        // Prepare data for Cypher query
        // Note: MCP write_neo4j_cypher tool only accepts 'query' parameter, not 'parameters'
        // So we need to escape and embed the values directly in the Cypher query
        const escapeString = (str: string) => str.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const escapeArray = (arr: string[]) => JSON.stringify(arr).replace(/'/g, "\\'");

        const evaluatorNotes = JSON.stringify({
          strengths: event.data.evaluation.strengths,
          weaknesses: event.data.evaluation.weaknesses,
          suggestions: event.data.evaluation.suggestions,
        }).replace(/'/g, "\\'").replace(/\n/g, "\\n");

        // Generate a unique ID for the memory node
        const memoryNodeId = `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create memory node with all properties (values embedded directly)
        // Note: write_neo4j_cypher returns stats, not query results, so we use a known ID
        const cypher = `
          CREATE (m:Memory {
            id: '${memoryNodeId}',
            type: 'episodic',
            user_query: '${escapeString(event.data.query)}',
            final_answer: '${escapeString(event.data.answer)}',
            cypher_used: ${escapeArray(event.data.cypherQueries)},
            confidence_overall: ${event.data.confidence},
            grounding_score: ${event.data.evaluation.grounding},
            accuracy_score: ${event.data.evaluation.accuracy},
            completeness_score: ${event.data.evaluation.completeness},
            pedagogy_score: ${event.data.evaluation.pedagogy},
            clarity_score: ${event.data.evaluation.clarity},
            overall_score: ${event.data.evaluation.overall},
            evaluator_notes: '${evaluatorNotes}',
            embedding: ${JSON.stringify(embedding)},
            memories_used: ${JSON.stringify(event.data.memoriesUsed || [])},
            created_at: datetime(),
            updated_at: datetime()
          })
        `;

        // Execute Cypher query (only 'query' parameter, no 'parameters')
        const result = await cypherTool.execute({
          query: cypher,
        });

        // Check for errors
        if (result && result.content && result.content.length > 0) {
          const resultText = result.content[0].text;
          console.log('MCP tool result text:', resultText.substring(0, 200));

          // Check if it's an error message
          if (resultText.startsWith('Error')) {
            console.error('MCP tool returned error:', resultText);
            throw new Error(`Neo4j MCP error: ${resultText}`);
          }

          const data = JSON.parse(resultText);
          // write_neo4j_cypher returns stats like: {nodes_created: 1, properties_set: 17}
          if (data.nodes_created === 1) {
            console.log(`Memory node created with ID: ${memoryNodeId}`);
            console.log('Creation stats:', data);
            return memoryNodeId;
          } else {
            console.error('Unexpected creation result:', data);
            throw new Error('Memory node creation failed - no nodes created');
          }
        } else {
          console.error('Memory creation result:', JSON.stringify(result, null, 2));
          throw new Error('Memory creation returned unexpected format');
        }
      } catch (error) {
        console.error('Failed to create memory node:', error);
        throw error; // Critical step - fail if memory creation fails
      }
    });

    // Step 3: Link to evidence nodes
    await step.run('link-evidence', async () => {
      try {
        if (!event.data.evidenceNodeIds || event.data.evidenceNodeIds.length === 0) {
          console.log('No evidence nodes to link, skipping...');
          return { linked: 0 };
        }

        console.log(`Linking ${event.data.evidenceNodeIds.length} evidence nodes...`);

        const mcpClient = getNeo4jMCPClient();
        await mcpClient.connect();
        const tools = await mcpClient.getTools();
        const cypherTool = tools.write_neo4j_cypher || tools.read_neo4j_cypher;

        if (!cypherTool) {
          throw new Error('No Cypher execution tool available from MCP');
        }

        const evidenceIds = event.data.evidenceNodeIds.map((id: string) => `'${id}'`).join(', ');

        const cypher = `
          MATCH (m:Memory {id: '${memoryId}'})
          UNWIND [${evidenceIds}] as nodeId
          MATCH (n) WHERE n.id = nodeId
          CREATE (m)-[:USED_EVIDENCE]->(n)
          RETURN count(*) as linkedCount
        `;

        const result = await cypherTool.execute({
          query: cypher,
        });

        let linkedCount = 0;
        if (result && result.content && result.content.length > 0) {
          const data = JSON.parse(result.content[0].text);
          linkedCount = data[0]?.linkedCount || 0;
        }
        console.log(`Linked ${linkedCount} evidence nodes`);

        return { linked: linkedCount };
      } catch (error) {
        console.error('Failed to link evidence nodes:', error);
        throw error; // Critical step - fail if linking fails
      }
    });

    // Step 4: Extract pattern if high quality (score > 0.8)
    await step.run('extract-pattern', async () => {
      try {
        if (event.data.evaluation.overall <= 0.8) {
          console.log(`Score ${event.data.evaluation.overall.toFixed(3)} ≤ 0.8, skipping pattern extraction`);
          return { extracted: false, reason: 'score_too_low' };
        }

        if (!event.data.cypherQueries || event.data.cypherQueries.length === 0) {
          console.log('No Cypher queries to extract pattern from');
          return { extracted: false, reason: 'no_queries' };
        }

        console.log('Extracting query pattern for high-quality interaction...');

        const mcpClient = getNeo4jMCPClient();
        await mcpClient.connect();
        const tools = await mcpClient.getTools();
        const cypherTool = tools.write_neo4j_cypher || tools.read_neo4j_cypher;

        if (!cypherTool) {
          throw new Error('No Cypher execution tool available from MCP');
        }

        // Extract pattern from first Cypher query
        const firstQuery = event.data.cypherQueries[0];
        const patternName = hashCypherPattern(firstQuery);

        console.log(`Pattern identified: ${patternName}`);

        const escapeString = (str: string) => str.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const description = `Pattern for query type: ${event.data.query.substring(0, 100)}...`;

        const cypher = `
          MERGE (p:QueryPattern {name: '${patternName}'})
          ON CREATE SET
            p.id = randomUUID(),
            p.description = '${escapeString(description)}',
            p.cypher_template = '${escapeString(firstQuery)}',
            p.success_count = 1,
            p.failure_count = 0,
            p.created_at = datetime(),
            p.updated_at = datetime()
          ON MATCH SET
            p.success_count = p.success_count + 1,
            p.updated_at = datetime()
          WITH p
          MATCH (m:Memory {id: '${memoryId}'})
          MERGE (m)-[:APPLIED_PATTERN]->(p)
          RETURN p.id as patternId, p.success_count as successCount
        `;

        const result = await cypherTool.execute({
          query: cypher,
        });

        if (result && result.content && result.content.length > 0) {
          const data = JSON.parse(result.content[0].text);
          if (data && data.length > 0) {
            const patternId = data[0].patternId;
            const successCount = data[0].successCount;
            console.log(`Pattern ${patternName} updated (ID: ${patternId}, uses: ${successCount})`);
            return { extracted: true, patternId, patternName, successCount };
          }
        }

        return { extracted: false, reason: 'query_failed' };
      } catch (error) {
        // Non-critical step - log but don't fail
        console.error('Failed to extract pattern (non-critical):', error);
        return { extracted: false, reason: 'error', error: String(error) };
      }
    });

    // Step 5: Link similar memories (for future optimization)
    await step.run('link-similar-memories', async () => {
      try {
        console.log('Finding similar memories via vector search...');

        const mcpClient = getNeo4jMCPClient();
        await mcpClient.connect();
        const tools = await mcpClient.getTools();
        const cypherTool = tools.write_neo4j_cypher || tools.read_neo4j_cypher;

        if (!cypherTool) {
          throw new Error('No Cypher execution tool available from MCP');
        }

        // Find top 5 similar memories with similarity > 0.8
        const cypher = `
          MATCH (m:Memory {id: '${memoryId}'})
          CALL db.index.vector.queryNodes('memory_embeddings', 5, m.embedding)
          YIELD node, score
          WHERE node.id <> '${memoryId}' AND score > 0.8
          WITH m, node, score
          MERGE (m)-[r:SIMILAR_TO]->(node)
          ON CREATE SET r.similarity = score, r.created_at = datetime()
          RETURN count(*) as linkedCount
        `;

        const result = await cypherTool.execute({
          query: cypher,
        });

        let linkedCount = 0;
        if (result && result.content && result.content.length > 0) {
          const data = JSON.parse(result.content[0].text);
          linkedCount = data[0]?.linkedCount || 0;
        }
        console.log(`Linked ${linkedCount} similar memories`);

        return { linked: linkedCount };
      } catch (error) {
        // Non-critical step - log but don't fail
        console.error('Failed to link similar memories (non-critical):', error);
        return { linked: 0, reason: 'error', error: String(error) };
      }
    });

    // Step 6: Update stats cache in Supabase
    await step.run('update-stats', async () => {
      try {
        console.log('Updating memory statistics cache...');

        const mcpClient = getNeo4jMCPClient();
        await mcpClient.connect();
        const tools = await mcpClient.getTools();
        const cypherTool = tools.read_neo4j_cypher;

        if (!cypherTool) {
          throw new Error('No Cypher execution tool available from MCP');
        }

        // Query Neo4j for current stats
        const cypher = `
          MATCH (m:Memory)
          WITH count(m) as memoryCount, avg(m.confidence_overall) as avgConfidence, avg(m.overall_score) as avgScore
          MATCH (p:QueryPattern)
          RETURN memoryCount, avgConfidence, avgScore, count(p) as patternCount
        `;

        const result = await cypherTool.execute({
          query: cypher,
        });

        if (result && result.content && result.content.length > 0) {
          const data = JSON.parse(result.content[0].text);
          if (data && data.length > 0) {
            const stats = data[0];

            await updateMemoryStats({
              totalMemories: stats.memoryCount || 0,
              avgConfidence: stats.avgConfidence || 0,
              avgOverallScore: stats.avgScore || 0,
              totalPatterns: stats.patternCount || 0,
            });

            console.log('Memory stats updated in Supabase:', {
              memories: stats.memoryCount,
              patterns: stats.patternCount,
            });

            return {
              updated: true,
              totalMemories: stats.memoryCount,
              totalPatterns: stats.patternCount,
            };
          }
        }

        console.warn('Stats query returned no data');
        return { updated: false, reason: 'no_data' };
      } catch (error) {
        // Non-critical step - log but don't fail
        console.error('Failed to update stats cache (non-critical):', error);
        return { updated: false, reason: 'error', error: String(error) };
      }
    });

    console.log(`Learning Agent complete. Memory ID: ${memoryId}`);

    return {
      success: true,
      memoryId,
      interactionId: event.data.interactionId,
      overallScore: event.data.evaluation.overall,
    };
  }
);

/**
 * Query Agent API Route - Main Chat Endpoint
 *
 * This endpoint implements the user-facing Query Agent that:
 * 1. Retrieves similar high-quality memories for few-shot learning
 * 2. Pre-fetches Neo4j schema via MCP
 * 3. Builds system prompt with schema + memory examples
 * 4. Streams response using AI SDK with Neo4j tools
 * 5. Emits `interaction.complete` event (non-blocking) for async learning
 *
 * Performance Targets:
 * - p50 latency: ≤2s
 * - p95 latency: ≤4s
 * - Cypher success rate: ≥85%
 *
 * @see ARCHITECTURE.md Section 6.1 (Query Agent Implementation)
 * @see FUNCTIONAL.md Section 4.4 (Three-Agent System)
 * @see CLAUDE.md (AI SDK v5 Patterns, Error Handling)
 */

import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { NextRequest } from 'next/server';
import { retrieveSimilarMemories } from '@/lib/memory/retrieval';
import { buildQueryPrompt } from '@/lib/agents/prompts/query-prompt';
import { getNeo4jMCPClient } from '@/lib/mcp';
import { getInngestClient } from '@/lib/inngest/client';
import { createInteraction } from '@/lib/database/queries';

/**
 * POST /api/chat - Stream chat responses using Query Agent
 *
 * Request Body:
 * - messages: CoreMessage[] - Conversation history (AI SDK format)
 * - model: string - LLM model to use ('gpt-4o' | 'gpt-4o-mini' | 'gpt-5')
 * - temperature: number - Sampling temperature (0.0-1.0, default 0.3)
 * - maxTokens: number - Maximum tokens in response (500-4000, default 2000)
 *
 * Response: Server-Sent Events (SSE) stream compatible with AI SDK useChat hook
 *
 * Error Handling: Never exposes raw errors to users. Returns graceful fallback messages.
 *
 * @param req - Next.js request object
 * @returns StreamResponse - AI SDK data stream response
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const { messages, model, temperature } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Please provide a valid message to continue the conversation.',
        }),
        {
          status: 200, // Don't expose 400 errors to users
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract latest user message for memory retrieval
    const latestMessage = messages[messages.length - 1];
    const userQuery =
      typeof latestMessage.content === 'string'
        ? latestMessage.content
        : JSON.stringify(latestMessage.content);

    console.log('🔍 Query Agent processing:', {
      query: userQuery.substring(0, 100),
      model: model || 'gpt-4o',
      messageCount: messages.length,
    });

    // 2. Retrieve similar high-quality memories for few-shot learning
    console.log('🧠 Retrieving similar memories...');
    const memories = await retrieveSimilarMemories(userQuery, 3);
    console.log(`   ✅ Retrieved ${memories.length} memories`);

    // 3. Initialize Neo4j MCP client and pre-fetch schema
    console.log('🔧 Initializing Neo4j MCP client...');
    const mcpClient = getNeo4jMCPClient();
    await mcpClient.connect();

    const allTools = await mcpClient.getTools();
    console.log(`   ✅ Retrieved ${Object.keys(allTools).length} MCP tools`);

    if (!allTools.get_neo4j_schema) {
      throw new Error('get_neo4j_schema tool not found in MCP tools');
    }

    console.log('📊 Pre-fetching Neo4j schema...');
    const schemaResult = await allTools.get_neo4j_schema.execute({});
    const schema = JSON.parse(schemaResult.content[0].text);
    console.log('   ✅ Schema pre-fetched successfully');

    // 4. Build system prompt with schema + few-shot examples
    const systemPrompt = buildQueryPrompt(schema, memories);

    // 5. Expose only read_neo4j_cypher tool (read-only access for Query Agent)
    const cypherTool = {
      read_neo4j_cypher: {
        ...allTools.read_neo4j_cypher,
        // Wrap tool to log usage
        execute: async (args: any) => {
          console.log(`\n🔧 Tool called: read_neo4j_cypher`);
          console.log(`   Query:`, args.query?.substring(0, 200));
          const result = await allTools.read_neo4j_cypher.execute(args);
          console.log(`   ✅ Tool execution complete`);
          return result;
        },
      },
    };

    // Track interaction metadata for event emission
    const interactionMetadata: {
      cypherQueries: string[];
      graphResults: Record<string, any>[];
      stepCount: number;
    } = {
      cypherQueries: [],
      graphResults: [],
      stepCount: 0,
    };

    // 6. Stream response using AI SDK
    console.log('🤖 Streaming Query Agent response...');
    const result = await streamText({
      model: openai(model || 'gpt-4o'),
      system: systemPrompt,
      messages: messages as CoreMessage[],
      tools: cypherTool,
      temperature: temperature ?? 0.3,

      // Track tool calls for event emission
      onStepFinish: ({ toolCalls, toolResults }) => {
        interactionMetadata.stepCount++;

        // Extract Cypher queries from tool calls
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            if (toolCall.toolName === 'read_neo4j_cypher') {
              try {
                // Type assertion for MCP tool call args
                const args = (toolCall as any).args;
                if (args && typeof args === 'object' && args.query) {
                  interactionMetadata.cypherQueries.push(args.query);
                }
              } catch (err) {
                console.error('Error extracting tool call args:', err);
              }
            }
          }
        }

        // Extract graph results from tool results
        if (toolResults && toolResults.length > 0) {
          for (const toolResult of toolResults) {
            try {
              const resultData = (toolResult as any).result;
              if (resultData && typeof resultData === 'object') {
                interactionMetadata.graphResults.push(resultData);
              }
            } catch (err) {
              console.error('Error extracting tool result:', err);
            }
          }
        }
      },
    });

    // 7. Emit interaction.complete event (non-blocking)
    // Note: This runs after streaming completes, doesn't block the stream response
    (async () => {
      try {
        // Wait for full response text
        const fullResponse = await result.text;
        const latencyMs = Date.now() - startTime;

        // Extract evidence node IDs from final text (citations in [Node-ID] format)
        const citationMatches = fullResponse.match(/\[([^\]]+)\]/g) || [];
        const evidenceNodeIds = citationMatches.map((match: string) =>
          match.replace(/\[|\]/g, '')
        );

        // Calculate confidence and grounding (simplified for Phase 1)
        const confidence = 0.85; // TODO: Extract from agent's response
        const groundingRate =
          interactionMetadata.cypherQueries.length > 0
            ? Math.min(evidenceNodeIds.length / 10, 1.0)
            : 0.0;

        // Save interaction to Supabase
        const interactionId = await createInteraction({
          userQuery: userQuery,
          finalAnswer: fullResponse,
          modelUsed: model || 'gpt-4o',
          temperature: temperature ?? 0.3,
          confidenceOverall: confidence,
          groundingRate: groundingRate,
          cypherQueries: interactionMetadata.cypherQueries.map((q) => ({
            query: q,
          })),
          toolCalls: [],
          latencyMs: latencyMs,
          stepCount: interactionMetadata.stepCount,
        });

        // Emit event to Inngest (triggers Reflection Agent)
        const inngest = getInngestClient();
        await inngest.send({
          name: 'interaction.complete',
          data: {
            interactionId: interactionId,
            query: userQuery,
            answer: fullResponse,
            model: model || 'gpt-4o',
            temperature: temperature ?? 0.3,
            cypherQueries: interactionMetadata.cypherQueries,
            graphResults: interactionMetadata.graphResults,
            evidenceNodeIds: evidenceNodeIds,
            confidence: confidence,
            groundingRate: groundingRate,
            stepCount: interactionMetadata.stepCount,
            latencyMs: latencyMs,
            memoriesUsed: memories.map((m) => m.id),
            timestamp: new Date(),
          },
        });

        console.log('✅ Interaction.complete event emitted:', interactionId);
      } catch (error) {
        // Don't throw - event emission is non-blocking
        console.error('❌ Failed to emit interaction.complete event:', error);
      }
    })();

    // Return streaming response (compatible with AI SDK useChat hook)
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('💥 Query Agent API error:', error);

    // Graceful fallback - never expose raw errors to users
    return new Response(
      JSON.stringify({
        error:
          "I apologize, I'm having trouble accessing the curriculum data right now. Please try again in a moment.",
      }),
      {
        status: 200, // Keep 200 to avoid client-side error alerts
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

import { buildOakCurriculumPrompt } from "@/components/agent/oak-curriculum-prompt";
import { getNeo4jMCPClient } from "@/lib/mcp";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    const modelMessages = convertToModelMessages(messages);

    // Initialize Neo4j MCP client
    console.log("🚀 Initializing Neo4j MCP client...");
    const neo4jClient = getNeo4jMCPClient();
    await neo4jClient.connect();

    // Retrieve all Neo4j tools
    const allTools = await neo4jClient.getTools();
    console.log(
      `🔧 Retrieved ${Object.keys(allTools).length} Neo4j MCP tools`
    );

    // Pre-fetch schema using get_neo4j_schema tool
    console.log("📊 Pre-fetching Neo4j schema...");
    console.log("   Available tools:", Object.keys(allTools));

    if (!allTools.get_neo4j_schema) {
      throw new Error("get_neo4j_schema tool not found in MCP tools");
    }

    const schemaResult = await allTools.get_neo4j_schema.execute({});
    console.log("   Schema result type:", typeof schemaResult);
    console.log("   Schema result:", JSON.stringify(schemaResult, null, 2).substring(0, 500));

    const schema = JSON.parse(schemaResult.content[0].text);
    console.log("✅ Schema pre-fetched successfully");

    // Build system prompt with injected schema
    const systemPrompt = buildOakCurriculumPrompt(schema);

    // Expose only read_neo4j_cypher tool to GPT-5 (read-only access)
    const exposedTools = {
      read_neo4j_cypher: allTools.read_neo4j_cypher,
    };

    // Wrap tools to log when they are called
    const wrappedTools = Object.fromEntries(
      Object.entries(exposedTools).map(([toolName, toolDef]) => [
        toolName,
        {
          ...toolDef,
          execute: async (args: any) => {
            console.log(`\n🔧 Tool called: ${toolName}`);
            console.log(`   Input:`, JSON.stringify(args, null, 2));
            const result = await toolDef.execute(args);
            console.log(`   ✅ Tool execution complete`);
            return result;
          },
        },
      ])
    );

    console.log("🤖 Streaming Oak Curriculum Agent response...");

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: modelMessages,
      tools: wrappedTools,
      stopWhen: stepCountIs(10),
      // providerOptions: {
      //   openai: {
      //     reasoning_effort: "low",
      //     textVerbosity: "medium",
      //     reasoningSummary: "detailed",
      //   },
      // },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Oak Curriculum Agent API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}

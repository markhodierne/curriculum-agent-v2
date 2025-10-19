/**
 * Dashboard Patterns API Route
 * Provides query patterns from Neo4j for the pattern library
 */

import { NextResponse } from 'next/server';
import { getNeo4jMCPClient } from '@/lib/mcp';

export async function GET() {
  try {
    const mcpClient = getNeo4jMCPClient();
    await mcpClient.connect();
    const tools = await mcpClient.getTools();

    const cypherTool = tools.read_neo4j_cypher;
    if (!cypherTool) {
      throw new Error('Cypher tool not available');
    }

    // Query for all QueryPattern nodes
    const cypher = `
      MATCH (p:QueryPattern)
      RETURN p.id as id, p.name as name, p.description as description,
             p.success_count as successCount, p.failure_count as failureCount,
             p.cypher_template as cypherTemplate
      ORDER BY (p.success_count + p.failure_count) DESC
      LIMIT 20
    `;

    const result = await cypherTool.execute({ query: cypher });

    let patterns = [];
    if (result && result.content && result.content.length > 0) {
      const data = JSON.parse(result.content[0].text);
      patterns = data.map((pattern: any) => ({
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        successCount: pattern.successCount || 0,
        failureCount: pattern.failureCount || 0,
        totalUsage: (pattern.successCount || 0) + (pattern.failureCount || 0),
        successRate:
          (pattern.successCount || 0) + (pattern.failureCount || 0) > 0
            ? ((pattern.successCount || 0) / ((pattern.successCount || 0) + (pattern.failureCount || 0))) * 100
            : 0,
      }));
    }

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('Failed to fetch patterns:', error);
    return NextResponse.json(
      { error: 'Failed to load patterns' },
      { status: 500 }
    );
  }
}

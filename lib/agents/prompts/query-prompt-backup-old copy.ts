/**
 * Query Agent System Prompt Builder
 *
 * Builds the system prompt for the Query Agent with:
 * - Neo4j graph schema (pre-fetched, stays in context)
 * - Few-shot examples from similar high-quality past interactions
 * - Instructions for multi-turn tool calling and Cypher generation
 *
 * See ARCHITECTURE.md section 6.1 for implementation details.
 * See CLAUDE.md for AI SDK patterns and best practices.
 */

import type { Memory } from '@/lib/types/memory';

/**
 * Builds the system prompt for the Query Agent
 *
 * This prompt instructs the agent on:
 * - How to query the Neo4j curriculum graph using read_neo4j_cypher tool
 * - Multi-turn tool calling strategy (can call tool multiple times)
 * - Cypher query generation best practices
 *
 * The schema is pre-fetched once per conversation and stays in the prompt.
 * Memories are retrieved per query to provide relevant few-shot examples.
 *
 * @param schema - Neo4j graph schema from get_neo4j_schema MCP tool (JSON object)
 * @param memories - Array of similar high-quality past interactions (score > 0.75)
 * @returns Complete system prompt string for Query Agent
 *
 * @example
 * ```typescript
 * // In API route
 * const schema = await fetchSchemaViaMCP();
 * const memories = await retrieveSimilarMemories(userQuery);
 * const systemPrompt = buildQueryPrompt(schema, memories);
 *
 * const result = streamText({
 *   model: openai('gpt-4o'),
 *   system: systemPrompt,
 *   messages,
 *   tools: { read_neo4j_cypher: cypherTool },
 * });
 * ```
 */
export function buildQueryPrompt(
  schema: Record<string, any>,
  memories: Memory[]
): string {
  // Format schema section (skip if empty - for subsequent messages in conversation)
  const hasSchema = schema && Object.keys(schema).length > 0;
  const schemaSection = hasSchema
    ? formatSchema(schema)
    : '(Schema was provided in the initial system message and persists throughout this conversation)';

  const fewShotSection = formatFewShotExamples(memories);

  return `You are an expert curriculum assistant with access to the UK National Curriculum knowledge graph stored in Neo4j.

# Critical Rule

**ONLY answer based on data retrieved from the graph.** Never use your training data for curriculum content. If the graph returns no results, say so.

# Your Capabilities

- **Query the graph**: Use the \`read_neo4j_cypher\` tool to execute read-only Cypher queries
- **Multi-turn exploration**: You can call the tool multiple times to explore different parts of the graph
- **Evidence-based answers**: Always ground your answers in graph data - never hallucinate

# Neo4j Graph Schema

The curriculum knowledge graph has the following structure:

${schemaSection}

**Important**: This schema is already loaded - you do NOT need to fetch it. Use it as reference for writing Cypher queries.

# Similar Past Successful Interactions

Learn from these high-quality interactions to guide your approach:

${fewShotSection}

# Instructions

Follow this process for every user query:

## 1. Analyze the Question
- Understand what the user is asking
- Identify which parts of the graph schema are relevant
- Consider which node types and relationships to query

## 2. Generate Cypher Queries
- Write read-only Cypher queries to retrieve relevant data
- Use MATCH patterns that align with the schema
- Filter with WHERE clauses for precise results
- Return only the data needed to answer the question
- Keep queries simple and focused

**Cypher Best Practices**:
- **CRITICAL**: When querying Year nodes, ALWAYS use \`yearSlug\` (e.g., 'year-3', 'year-5') NOT \`yearTitle\`
  - Example: \`MATCH (y:Year {yearSlug: 'year-3'})\` ✅
  - WRONG: \`MATCH (y:Year {yearTitle: 'Year 3'})\` ❌
- Use parameterized queries when filtering (e.g., \`WHERE unit.unitTitle CONTAINS $term\`)
- Leverage relationships according to the schema (e.g., \`:HAS_UNIT_OFFERING\`, \`:HAS_UNIT\`)
- Use RETURN to get specific properties (e.g., \`RETURN unit.unitTitle, unit.unitDescription\`)
- Order results when appropriate (e.g., \`ORDER BY unit.unitTitle\`)
- Limit results if querying broad categories (e.g., \`LIMIT 20\`)

**Common Query Patterns**:
- **Find units for a year**: \`MATCH (y:Year {yearSlug: 'year-3'})-[:HAS_UNIT_OFFERING]->(uo:Unitoffering)-[:HAS_UNIT]->(u:Unit)\`
- **Filter units by topic**: \`WHERE toLower(u.unitTitle) CONTAINS 'fraction'\`
- **Get unit details**: \`RETURN u.unitTitle, u.unitDescription, u.unitId\`
- **Find lessons in a unit**: \`MATCH (u:Unit)-[:HAS_UNITVARIANT]->(uv:Unitvariant)-[:HAS_LESSON]->(l:Lesson)\`

## 3. Execute Queries (Multi-Turn)
- Call \`read_neo4j_cypher\` tool with your Cypher query
- **You can call it multiple times** if you need to explore different angles
- Review the results before generating your answer
- If results are insufficient, refine your query and try again

## 4. Synthesize Answer
- Use ONLY the data returned from your queries
- Structure your answer clearly for educators/curriculum designers
- Provide complete, accurate information based on the graph results

# Quality Standards

**Always prioritize**:
- ✅ **Accuracy** over completeness - if you're unsure, say so
- ✅ **Evidence** over assumptions - ground every claim in graph data
- ✅ **Clarity** over complexity - explain in accessible language
- ✅ **Honesty** about limitations - admit when the graph doesn't contain the answer

**Never**:
- ❌ Hallucinate facts not in the graph
- ❌ Make claims without evidence from your queries
- ❌ Guess properties or relationships
- ❌ Return raw Cypher or technical errors to users

# Example Response Format

\`\`\`
[Answer to user's question in clear, structured format]

Provide organized, well-structured information based on your query results.
Include relevant details like unit titles, descriptions, year groups, and relationships between curriculum elements.
\`\`\`

Remember: You are a trusted curriculum assistant. Educators rely on your accuracy. When in doubt, query the graph again or ask the user to clarify their question.`;
}

/**
 * Formats Neo4j schema into human-readable text for the system prompt
 *
 * @param schema - Neo4j schema object from get_neo4j_schema tool
 * @returns Formatted schema description
 */
function formatSchema(schema: Record<string, any>): string {
  // Handle empty schema
  if (!schema || Object.keys(schema).length === 0) {
    return 'Schema information not available. Explore the graph carefully using Cypher queries.';
  }

  const sections: string[] = [];

  // Format node labels
  if (schema.node_labels || schema.nodeLabels) {
    const labels = schema.node_labels || schema.nodeLabels;
    sections.push('**Node Types**:');

    if (Array.isArray(labels)) {
      labels.forEach((label: any) => {
        if (typeof label === 'string') {
          sections.push(`- \`:${label}\``);
        } else if (label.label) {
          const props = label.properties
            ? `\n  Properties: ${label.properties.join(', ')}`
            : '';
          sections.push(`- \`:${label.label}\`${props}`);
        }
      });
    }
    sections.push('');
  }

  // Format relationship types
  if (schema.relationship_types || schema.relationshipTypes) {
    const rels = schema.relationship_types || schema.relationshipTypes;
    sections.push('**Relationship Types**:');

    if (Array.isArray(rels)) {
      rels.forEach((rel: any) => {
        if (typeof rel === 'string') {
          sections.push(`- \`:${rel}\``);
        } else if (rel.type) {
          const pattern = rel.pattern || '';
          sections.push(`- \`:${rel.type}\` ${pattern}`);
        }
      });
    }
    sections.push('');
  }

  // If schema is just a string or has a simple structure
  if (sections.length === 0) {
    if (typeof schema === 'string') {
      return schema;
    }
    // Fallback: JSON stringify for any other structure
    return '```json\n' + JSON.stringify(schema, null, 2) + '\n```';
  }

  return sections.join('\n');
}

/**
 * Formats memories as few-shot examples for the system prompt
 *
 * Shows successful past interactions to guide the agent's approach.
 * Each example includes the query, Cypher used, answer snippet, and why it worked.
 *
 * @param memories - Array of high-quality memories (score > 0.75)
 * @returns Formatted few-shot examples
 */
function formatFewShotExamples(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'No similar past interactions available yet. This is a new type of query - approach it carefully by exploring the graph schema.';
  }

  const examples = memories.map((memory, index) => {
    // Format the Cypher query (use first one if multiple)
    const cypherQuery = memory.cypherUsed.length > 0
      ? memory.cypherUsed[0]
      : 'No Cypher query recorded';

    // Truncate answer to first 200 characters for brevity
    const answerSnippet = memory.finalAnswer.length > 200
      ? memory.finalAnswer.substring(0, 200) + '...'
      : memory.finalAnswer;

    // Parse evaluator notes if they're JSON stringified
    let evaluatorNotes = memory.evaluatorNotes;
    try {
      const parsed = JSON.parse(memory.evaluatorNotes);
      if (parsed.strengths && Array.isArray(parsed.strengths)) {
        evaluatorNotes = `Strengths: ${parsed.strengths.join(', ')}`;
      }
    } catch {
      // Keep original if not JSON
    }

    return `## Example ${index + 1} (Quality Score: ${memory.overallScore.toFixed(2)})

**User Query**: "${memory.userQuery}"

**Cypher Used**:
\`\`\`cypher
${cypherQuery}
\`\`\`

**Answer** (excerpt):
"${answerSnippet}"

**Why This Worked**: ${evaluatorNotes}

**Key Takeaways**:
- Accuracy: ${memory.accuracyScore.toFixed(2)}
- Completeness: ${memory.completenessScore.toFixed(2)}
- Overall Score: ${memory.overallScore.toFixed(2)}
`;
  });

  return examples.join('\n---\n\n');
}

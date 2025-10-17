/**
 * Query Agent System Prompt Builder
 *
 * Builds the system prompt for the Query Agent with:
 * - Neo4j graph schema (pre-fetched, stays in context)
 * - Few-shot examples from similar high-quality past interactions
 * - Instructions for multi-turn tool calling, confidence scoring, and citations
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
 * - Confidence score assignment guidelines (0.0-1.0)
 * - Citation format using [Node-ID]
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
  const schemaSection = formatSchema(schema);
  const fewShotSection = formatFewShotExamples(memories);

  return `You are an expert curriculum assistant with access to the UK National Curriculum knowledge graph stored in Neo4j.

# Your Capabilities

- **Query the graph**: Use the \`read_neo4j_cypher\` tool to execute read-only Cypher queries
- **Multi-turn exploration**: You can call the tool multiple times to explore different parts of the graph
- **Evidence-based answers**: Always ground your answers in graph data - never hallucinate
- **Confidence scoring**: Provide confidence scores (0.0-1.0) for each claim based on evidence strength
- **Citations**: Cite specific graph nodes using [Node-ID] format for every claim

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
- Use parameterized queries when filtering (e.g., \`WHERE o.year = $year\`)
- Leverage relationships like \`:PART_OF\`, \`:REQUIRES\`, \`:TEACHES\`
- Use RETURN to get specific properties (e.g., \`RETURN o.title, o.description\`)
- Order results when appropriate (e.g., \`ORDER BY o.year\`)
- Limit results if querying broad categories (e.g., \`LIMIT 20\`)

## 3. Execute Queries (Multi-Turn)
- Call \`read_neo4j_cypher\` tool with your Cypher query
- **You can call it multiple times** if you need to explore different angles
- Review the results before generating your answer
- If results are insufficient, refine your query and try again

## 4. Synthesize Answer
- Use ONLY the data returned from your queries
- Structure your answer clearly for educators/curriculum designers
- Cite every claim with [Node-ID] format

## 5. Assign Confidence Scores

For each claim in your answer, assign a confidence score based on evidence strength:

**Confidence Guidelines**:
- **0.90-1.00** (★★★★★): Direct graph match
  - Example: Node property directly states the fact
  - The claim is a direct quote or paraphrase of graph data

- **0.75-0.89** (★★★★☆): Inferred from relationship
  - Example: Following a relationship like \`:PART_OF\` or \`:REQUIRES\`
  - The claim is strongly supported by graph structure

- **0.60-0.74** (★★★☆☆): Synthesized from multiple nodes
  - Example: Combining information from 2-3 related nodes
  - The claim requires logical inference across nodes

- **0.40-0.59** (★★☆☆☆): Weak support
  - Example: Partial information, missing key details
  - The claim has some graph support but gaps exist

- **0.00-0.39** (★☆☆☆☆): No clear support
  - **Avoid making such claims** - ask user to rephrase instead
  - If you must make a low-confidence claim, clearly state the uncertainty

## 6. Format Citations

Use this exact format for every citation:

\`\`\`
[Node-ID]
\`\`\`

Examples:
- "Year 3 students learn unit fractions [Y3-F-001]"
- "Objectives are organized into strands [S-MATH-01]"
- "Fractions build on place value concepts [C-NUM-05]"

**Citation Rules**:
- Cite the specific node ID from your Cypher query results
- Place citations immediately after the claim they support
- Use multiple citations if a claim is supported by multiple nodes
- Never invent node IDs - only use IDs from your query results

# Quality Standards

**Always prioritize**:
- ✅ **Accuracy** over completeness - if you're unsure, say so
- ✅ **Evidence** over assumptions - ground every claim in graph data
- ✅ **Clarity** over complexity - explain in accessible language
- ✅ **Honesty** about limitations - admit when the graph doesn't contain the answer

**Never**:
- ❌ Hallucinate facts not in the graph
- ❌ Make claims without citations
- ❌ Guess node IDs or relationships
- ❌ Return raw Cypher or technical errors to users

# Example Response Format

\`\`\`
[Answer to user's question in clear, structured format]

**Claim 1**: [Statement with citation [Node-ID] ★★★★★ 0.95]

**Claim 2**: [Statement with citation [Node-ID] ★★★★☆ 0.82]

**Claim 3**: [Statement with citations [Node-ID-1] [Node-ID-2] ★★★☆☆ 0.68]

**Overall confidence**: [Average confidence across all claims]
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
- Confidence: ${memory.confidenceOverall.toFixed(2)}
- Grounding: ${memory.groundingScore.toFixed(2)}
- Accuracy: ${memory.accuracyScore.toFixed(2)}
`;
  });

  return examples.join('\n---\n\n');
}

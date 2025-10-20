/**
 * Reset Learning Data Script
 *
 * **PURPOSE**: Resets all learning data (memories, evaluations, interactions) while
 * preserving the curriculum graph in Neo4j. Used for testing and development.
 *
 * **DANGER**: This script is DESTRUCTIVE and will permanently delete:
 * - All Neo4j :Memory and :QueryPattern nodes
 * - All Supabase interactions, feedback, and evaluation records
 * - All learning relationships in the graph
 *
 * **PRESERVES**: The curriculum knowledge graph (Objectives, Strands, Concepts, etc.)
 *
 * **SAFETY MEASURES**:
 * - Only runs in development (NODE_ENV !== 'production')
 * - Requires explicit confirmation flag: --confirm
 * - Performs dry run by default (--dry-run)
 * - Shows preview of what will be deleted
 *
 * Usage:
 * ```bash
 * # Dry run (shows what will be deleted, doesn't delete)
 * pnpm reset-learning --dry-run
 *
 * # Actually delete (requires confirmation)
 * pnpm reset-learning --confirm
 *
 * # Reset everything with confirmation
 * pnpm reset-learning --confirm --force
 * ```
 *
 * @see CLAUDE.md for development workflow guidelines
 */

import { getNeo4jMCPClient } from '../lib/mcp';
import { getSupabaseClient } from '../lib/database/supabase';

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Parse command line arguments
 */
function parseArgs(): { dryRun: boolean; confirm: boolean; force: boolean } {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    confirm: args.includes('--confirm'),
    force: args.includes('--force'),
  };
}

/**
 * Safety check: Ensure we're not in production
 */
function checkEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    console.error(`${colors.red}${colors.bold}❌ ERROR: Cannot run reset script in production!${colors.reset}`);
    console.error(`${colors.red}   This script is for development and testing only.${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}🔍 Environment check: ${colors.green}${process.env.NODE_ENV || 'development'}${colors.reset}`);
}

/**
 * Count learning data in Neo4j (for preview)
 */
async function countNeo4jLearningData(): Promise<{
  memories: number;
  patterns: number;
  relationships: number;
}> {
  const mcpClient = getNeo4jMCPClient();
  await mcpClient.connect();
  const tools = await mcpClient.getTools();
  const cypherTool = tools.read_neo4j_cypher;

  if (!cypherTool) {
    throw new Error('read_neo4j_cypher tool not available');
  }

  // Count each type independently to avoid zero results when one type is missing
  const memoryCypher = `MATCH (m:Memory) RETURN count(m) as count`;
  const patternCypher = `MATCH (p:QueryPattern) RETURN count(p) as count`;
  const relationshipCypher = `
    MATCH ()-[r]->()
    WHERE type(r) IN ['USED_EVIDENCE', 'APPLIED_PATTERN', 'SIMILAR_TO']
    RETURN count(r) as count
  `;

  const memoryResult = await cypherTool.execute({ query: memoryCypher });
  const patternResult = await cypherTool.execute({ query: patternCypher });
  const relationshipResult = await cypherTool.execute({ query: relationshipCypher });

  const memoryData = JSON.parse(memoryResult.content[0].text);
  const patternData = JSON.parse(patternResult.content[0].text);
  const relationshipData = JSON.parse(relationshipResult.content[0].text);

  return {
    memories: memoryData[0]?.count || 0,
    patterns: patternData[0]?.count || 0,
    relationships: relationshipData[0]?.count || 0,
  };
}

/**
 * Count records in Supabase (for preview)
 */
async function countSupabaseData(): Promise<{
  interactions: number;
  feedback: number;
  evaluations: number;
}> {
  const supabase = getSupabaseClient();

  const [interactionsResult, feedbackResult, evaluationsResult] = await Promise.all([
    supabase.from('interactions').select('*', { count: 'exact', head: true }),
    supabase.from('feedback').select('*', { count: 'exact', head: true }),
    supabase.from('evaluation_metrics').select('*', { count: 'exact', head: true }),
  ]);

  return {
    interactions: interactionsResult.count || 0,
    feedback: feedbackResult.count || 0,
    evaluations: evaluationsResult.count || 0,
  };
}

/**
 * Delete all learning data from Neo4j
 */
async function resetNeo4jLearningData(): Promise<void> {
  console.log(`\n${colors.cyan}🗑️  Deleting Neo4j learning data...${colors.reset}`);

  const mcpClient = getNeo4jMCPClient();
  await mcpClient.connect();
  const tools = await mcpClient.getTools();
  const cypherTool = tools.write_neo4j_cypher || tools.read_neo4j_cypher;

  if (!cypherTool) {
    throw new Error('No Cypher execution tool available');
  }

  // Delete in correct order (relationships first, then nodes)
  const deletionSteps = [
    {
      name: 'Delete learning relationships',
      cypher: `
        MATCH ()-[r:USED_EVIDENCE|APPLIED_PATTERN|SIMILAR_TO]->()
        DELETE r
        RETURN count(r) as deletedCount
      `,
    },
    {
      name: 'Delete Memory nodes',
      cypher: `
        MATCH (m:Memory)
        DELETE m
        RETURN count(m) as deletedCount
      `,
    },
    {
      name: 'Delete QueryPattern nodes',
      cypher: `
        MATCH (p:QueryPattern)
        DELETE p
        RETURN count(p) as deletedCount
      `,
    },
  ];

  for (const step of deletionSteps) {
    const result = await cypherTool.execute({ query: step.cypher });
    const data = JSON.parse(result.content[0].text);
    const count = data[0]?.deletedCount || 0;
    console.log(`   ${colors.green}✓${colors.reset} ${step.name}: ${colors.yellow}${count}${colors.reset} deleted`);
  }
}

/**
 * Delete all learning data from Supabase
 */
async function resetSupabaseData(): Promise<void> {
  console.log(`\n${colors.cyan}🗑️  Deleting Supabase data...${colors.reset}`);

  const supabase = getSupabaseClient();

  // Delete in correct order (foreign key constraints)
  const deletionSteps = [
    { name: 'evaluation_metrics', table: 'evaluation_metrics' },
    { name: 'feedback', table: 'feedback' },
    { name: 'interactions', table: 'interactions' },
  ];

  for (const step of deletionSteps) {
    const { error, count } = await supabase
      .from(step.table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible UUID)

    if (error) {
      throw new Error(`Failed to delete from ${step.table}: ${error.message}`);
    }

    console.log(`   ${colors.green}✓${colors.reset} ${step.name}: ${colors.yellow}${count || 0}${colors.reset} deleted`);
  }

  // Reset memory_stats to defaults
  const { error: statsError } = await supabase.from('memory_stats').upsert({
    id: 1,
    total_memories: 0,
    avg_confidence: 0.0,
    avg_overall_score: 0.0,
    total_patterns: 0,
    last_updated: new Date().toISOString(),
  });

  if (statsError) {
    throw new Error(`Failed to reset memory_stats: ${statsError.message}`);
  }

  console.log(`   ${colors.green}✓${colors.reset} memory_stats: ${colors.yellow}reset to defaults${colors.reset}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = parseArgs();

  console.log(`\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   🔄 Oak Curriculum Agent - Reset Learning Data${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Safety check
  checkEnvironment();

  // Show what will be deleted
  console.log(`\n${colors.blue}📊 Counting current learning data...${colors.reset}`);

  const [neo4jCounts, supabaseCounts] = await Promise.all([
    countNeo4jLearningData(),
    countSupabaseData(),
  ]);

  console.log(`\n${colors.bold}Neo4j Learning Data:${colors.reset}`);
  console.log(`   Memory nodes: ${colors.yellow}${neo4jCounts.memories}${colors.reset}`);
  console.log(`   QueryPattern nodes: ${colors.yellow}${neo4jCounts.patterns}${colors.reset}`);
  console.log(`   Learning relationships: ${colors.yellow}${neo4jCounts.relationships}${colors.reset}`);

  console.log(`\n${colors.bold}Supabase Analytics Data:${colors.reset}`);
  console.log(`   Interactions: ${colors.yellow}${supabaseCounts.interactions}${colors.reset}`);
  console.log(`   Feedback records: ${colors.yellow}${supabaseCounts.feedback}${colors.reset}`);
  console.log(`   Evaluation metrics: ${colors.yellow}${supabaseCounts.evaluations}${colors.reset}`);

  const totalRecords =
    neo4jCounts.memories +
    neo4jCounts.patterns +
    neo4jCounts.relationships +
    supabaseCounts.interactions +
    supabaseCounts.feedback +
    supabaseCounts.evaluations;

  console.log(`\n${colors.bold}Total records to delete: ${colors.red}${totalRecords}${colors.reset}`);

  // Handle dry run
  if (args.dryRun) {
    console.log(`\n${colors.yellow}${colors.bold}🔍 DRY RUN MODE${colors.reset}`);
    console.log(`${colors.yellow}   No data will be deleted.${colors.reset}`);
    console.log(`${colors.yellow}   Use --confirm to actually delete data.${colors.reset}`);
    return;
  }

  // Check for confirmation
  if (!args.confirm) {
    console.log(`\n${colors.red}${colors.bold}❌ CONFIRMATION REQUIRED${colors.reset}`);
    console.log(`${colors.red}   This will permanently delete ${totalRecords} records.${colors.reset}`);
    console.log(`${colors.red}   Use --confirm flag to proceed.${colors.reset}`);
    console.log(`\n${colors.yellow}   Example: pnpm reset-learning --confirm${colors.reset}`);
    return;
  }

  // Final warning
  console.log(`\n${colors.red}${colors.bold}⚠️  WARNING: DESTRUCTIVE OPERATION${colors.reset}`);
  console.log(`${colors.red}   About to delete ${totalRecords} learning records.${colors.reset}`);
  console.log(`${colors.red}   This action cannot be undone!${colors.reset}`);

  if (!args.force) {
    console.log(`\n${colors.yellow}Waiting 5 seconds before proceeding...${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to cancel.${colors.reset}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Execute deletion
  try {
    await resetNeo4jLearningData();
    await resetSupabaseData();

    console.log(`\n${colors.green}${colors.bold}✅ SUCCESS: All learning data has been reset!${colors.reset}`);
    console.log(`${colors.green}   The curriculum graph in Neo4j has been preserved.${colors.reset}`);
    console.log(`${colors.green}   You can now test the learning loop from a clean slate.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}❌ ERROR: Reset failed${colors.reset}`);
    console.error(`${colors.red}   ${error instanceof Error ? error.message : String(error)}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the script
main()
  .catch((error) => {
    console.error(`\n${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
    process.exit(1);
  })
  .finally(() => {
    // Force exit to close MCP connection
    process.exit(0);
  });

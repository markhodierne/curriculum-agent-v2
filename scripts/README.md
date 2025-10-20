# Development Scripts

Utility scripts for development, testing, and maintenance.

---

## Reset Learning Data

**Script**: `reset-learning-data.ts`
**Command**: `pnpm reset-learning`

### Purpose

Resets all learning data (memories, evaluations, interactions) while preserving the curriculum knowledge graph. Use this to:

- Start fresh during development
- Test the learning loop from a clean slate
- Prepare for demos
- Reset after failed experiments

### What Gets Deleted

**Neo4j Learning Data**:
- `:Memory` nodes (learned interactions)
- `:QueryPattern` nodes (extracted patterns)
- `:USED_EVIDENCE` relationships
- `:APPLIED_PATTERN` relationships
- `:SIMILAR_TO` relationships

**Supabase Analytics**:
- `interactions` table (all records)
- `feedback` table (all records)
- `evaluation_metrics` table (all records)
- `memory_stats` table (reset to defaults)

### What Gets Preserved

**Neo4j Curriculum Graph** (UNCHANGED):
- `:Objective` nodes
- `:Strand` nodes
- `:Concept` nodes
- `:YearGroup` nodes
- `:Subject` nodes
- All curriculum relationships (`:PART_OF`, `:REQUIRES`, `:TEACHES`, etc.)

---

## Usage

### 1. Dry Run (Preview Only)

Shows what will be deleted without actually deleting anything:

```bash
pnpm reset-learning -- --dry-run
```

**Example Output**:
```
═══════════════════════════════════════════════════════════
   🔄 Oak Curriculum Agent - Reset Learning Data
═══════════════════════════════════════════════════════════

🔍 Environment check: development

📊 Counting current learning data...

Neo4j Learning Data:
   Memory nodes: 47
   QueryPattern nodes: 12
   Learning relationships: 103

Supabase Analytics Data:
   Interactions: 52
   Feedback records: 18
   Evaluation metrics: 47

Total records to delete: 279

🔍 DRY RUN MODE
   No data will be deleted.
   Use --confirm to actually delete data.
```

### 2. Reset with Confirmation

Actually deletes the data (requires explicit `--confirm` flag):

```bash
pnpm reset-learning -- --confirm
```

**Safety Features**:
- 5-second countdown before deletion (press Ctrl+C to cancel)
- Shows preview of what will be deleted
- Only runs in development (blocks production)
- Requires explicit confirmation flag

**Example Output**:
```
⚠️  WARNING: DESTRUCTIVE OPERATION
   About to delete 279 learning records.
   This action cannot be undone!

Waiting 5 seconds before proceeding...
Press Ctrl+C to cancel.

🗑️  Deleting Neo4j learning data...
   ✓ Delete learning relationships: 103 deleted
   ✓ Delete Memory nodes: 47 deleted
   ✓ Delete QueryPattern nodes: 12 deleted

🗑️  Deleting Supabase data...
   ✓ evaluation_metrics: 47 deleted
   ✓ feedback: 18 deleted
   ✓ interactions: 52 deleted
   ✓ memory_stats: reset to defaults

✅ SUCCESS: All learning data has been reset!
   The curriculum graph in Neo4j has been preserved.
   You can now test the learning loop from a clean slate.
```

### 3. Force Reset (No Countdown)

Skip the 5-second countdown (for automation):

```bash
pnpm reset-learning -- --confirm --force
```

---

## Safety Measures

### Environment Protection

- ✅ **Only runs in development**: Blocks execution if `NODE_ENV=production`
- ✅ **Explicit confirmation required**: Must use `--confirm` flag
- ✅ **Dry run by default**: Preview before deletion
- ✅ **Countdown warning**: 5-second grace period (unless `--force`)
- ✅ **Detailed preview**: Shows exactly what will be deleted

### Example: Production Protection

```bash
# In production environment
export NODE_ENV=production
pnpm reset-learning --confirm

# Output:
# ❌ ERROR: Cannot run reset script in production!
#    This script is for development and testing only.
```

---

## Common Use Cases

### Before Demo

```bash
# Preview what will be deleted
pnpm reset-learning -- --dry-run

# Reset everything
pnpm reset-learning -- --confirm
```

### Daily Development

```bash
# Quick reset (no countdown)
pnpm reset-learning -- --confirm --force
```

### Testing Learning Loop

```bash
# 1. Reset data
pnpm reset-learning -- --confirm --force

# 2. Run dev server
pnpm dev

# 3. Test queries and verify learning
# 4. Check dashboard for metrics
# 5. Repeat as needed
```

---

## Troubleshooting

### Error: "Cannot run reset script in production"

**Cause**: `NODE_ENV=production` is set
**Solution**: Only run this script in development. Unset `NODE_ENV` or set to `development`.

### Error: "CONFIRMATION REQUIRED"

**Cause**: Forgot to add `--confirm` flag
**Solution**: Add `--confirm` to actually delete data:

```bash
pnpm reset-learning -- --confirm
```

### Error: "MCP client connection failed"

**Cause**: Neo4j MCP server not accessible
**Solution**: Check that `NEO4J_MCP_URL` is set correctly in `.env.local` and the server is running.

### Error: "Supabase connection failed"

**Cause**: Supabase credentials invalid
**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

---

## Advanced Usage

### Custom Deletion (Manual Cypher)

If you need to delete specific memories only:

```cypher
// Delete memories with score < 0.5
MATCH (m:Memory)
WHERE m.overall_score < 0.5
DETACH DELETE m
```

### Backup Before Reset

```bash
# Export Neo4j data first (if needed)
# Then reset
pnpm reset-learning -- --confirm
```

---

## Technical Details

### Deletion Order

The script deletes in this order to respect foreign key constraints:

**Neo4j**:
1. Learning relationships (`:USED_EVIDENCE`, `:APPLIED_PATTERN`, `:SIMILAR_TO`)
2. `:Memory` nodes
3. `:QueryPattern` nodes

**Supabase**:
1. `evaluation_metrics` (references `interactions`)
2. `feedback` (references `interactions`)
3. `interactions` (parent table)
4. `memory_stats` (reset to defaults)

### Verification

After reset, verify with:

```bash
# Check Neo4j
# Should show 0 Memory and QueryPattern nodes, curriculum graph intact

# Check Supabase
# Should show 0 interactions, feedback, evaluations
```

---

## See Also

- `CLAUDE.md` - Development standards and workflow
- `ARCHITECTURE.md` - System architecture and data flow
- `FUNCTIONAL.md` - Feature specifications
- `lib/database/schema.ts` - Database table definitions
- `lib/mcp/client/neo4j-client.ts` - Neo4j connection code

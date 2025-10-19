# Neo4j Schema Setup - Curriculum Agent v2

**Purpose**: This document contains all Cypher commands needed to configure Neo4j AuraDB for the Oak Curriculum Agent Phase 1 MVP.

**When to run**: Before testing the learning loop (Task 29), as these indexes are required for memory retrieval and dashboard queries.

**References**:
- Architecture: `ARCHITECTURE.md` section 4.1 (Neo4j Schema)
- Memory Retrieval: `lib/memory/retrieval.ts` (requires vector index)
- Learning Agent: `lib/inngest/functions/learning.ts` (requires all indexes)

---

## Prerequisites

1. **Neo4j AuraDB Instance**: Existing instance with UK National Curriculum data
2. **Access**: Write permissions enabled on Neo4j MCP server
3. **Neo4j Browser**: Open https://console.neo4j.io and connect to your database
4. **Version**: Neo4j 5.x with vector index support

---

## 1. Vector Index for Memory Embeddings

### Purpose
Enables fast similarity search for few-shot learning. The Query Agent retrieves 3 similar high-quality past interactions before each query to learn from successful patterns.

### Command

```cypher
CREATE VECTOR INDEX memory_embeddings IF NOT EXISTS
FOR (m:Memory)
ON m.embedding
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
}
```

### Details
- **Index name**: `memory_embeddings`
- **Node label**: `:Memory`
- **Property**: `embedding` (float array)
- **Dimensions**: 1536 (matches OpenAI `text-embedding-3-small` model)
- **Similarity function**: `cosine` (best for normalized embeddings)
- **Usage**: Called via `db.index.vector.queryNodes()` in `lib/memory/retrieval.ts`

### Verification

```cypher
SHOW INDEXES
YIELD name, type, labelsOrTypes, properties, options
WHERE name = 'memory_embeddings'
RETURN name, type, labelsOrTypes, properties, options
```

**Expected output**:
```
name: "memory_embeddings"
type: "VECTOR"
labelsOrTypes: ["Memory"]
properties: ["embedding"]
options: {indexConfig: {vector.dimensions: 1536, vector.similarity_function: "cosine"}}
```

### Test Query (After First Memory Created)

```cypher
// Create a test embedding (1536 zeros for demonstration)
WITH range(0, 1535) AS indices
WITH [i IN indices | 0.0] AS testEmbedding

// Query the vector index
CALL db.index.vector.queryNodes('memory_embeddings', 3, testEmbedding)
YIELD node, score
RETURN node.id, node.user_query, score
LIMIT 3
```

**Expected result**: Should return up to 3 Memory nodes with similarity scores (0.0-1.0)

---

## 2. Property Index: Memory.created_at

### Purpose
Optimizes dashboard queries that sort or filter by interaction timestamp. Used by `components/dashboard/interactions-table.tsx` and learning curve chart.

### Command

```cypher
CREATE INDEX memory_created_at_index IF NOT EXISTS
FOR (m:Memory)
ON (m.created_at)
```

### Details
- **Index name**: `memory_created_at_index` (auto-generated if not specified)
- **Node label**: `:Memory`
- **Property**: `created_at` (datetime)
- **Use case**: Chronological sorting, time-range queries

### Verification

```cypher
SHOW INDEXES
YIELD name, type, labelsOrTypes, properties
WHERE 'Memory' IN labelsOrTypes AND 'created_at' IN properties
RETURN name, type, properties
```

### Test Query

```cypher
// Find recent memories (last 20, sorted by date)
MATCH (m:Memory)
RETURN m.id, m.user_query, m.created_at
ORDER BY m.created_at DESC
LIMIT 20
```

**Expected result**: Should use index (fast query, no full scan)

---

## 3. Property Index: Memory.overall_score

### Purpose
Optimizes memory retrieval quality filtering. The `retrieveSimilarMemories()` function only retrieves memories with `overall_score > 0.75` to ensure high-quality few-shot examples.

### Command

```cypher
CREATE INDEX memory_overall_score_index IF NOT EXISTS
FOR (m:Memory)
ON (m.overall_score)
```

### Details
- **Index name**: `memory_overall_score_index`
- **Node label**: `:Memory`
- **Property**: `overall_score` (float, 0.0-1.0)
- **Use case**: Quality filtering, dashboard stats

### Verification

```cypher
SHOW INDEXES
YIELD name, type, labelsOrTypes, properties
WHERE 'Memory' IN labelsOrTypes AND 'overall_score' IN properties
RETURN name, type, properties
```

### Test Query

```cypher
// Find high-quality memories (score > 0.75)
MATCH (m:Memory)
WHERE m.overall_score > 0.75
RETURN m.id, m.user_query, m.overall_score
ORDER BY m.overall_score DESC
LIMIT 10
```

**Expected result**: Should use index (fast WHERE clause evaluation)

---

## 4. Unique Constraint: QueryPattern.name

### Purpose
Ensures pattern names are unique and enables efficient `MERGE` operations in the Learning Agent. Prevents duplicate patterns from being created.

### Command

```cypher
CREATE CONSTRAINT query_pattern_name_unique IF NOT EXISTS
FOR (p:QueryPattern)
REQUIRE p.name IS UNIQUE
```

### Details
- **Constraint name**: `query_pattern_name_unique`
- **Node label**: `:QueryPattern`
- **Property**: `name` (string)
- **Effect**: Automatically creates an index on `name` property
- **Use case**: Pattern extraction via `MERGE` in `lib/inngest/functions/learning.ts`

### Verification

```cypher
SHOW CONSTRAINTS
YIELD name, type, labelsOrTypes, properties
WHERE name = 'query_pattern_name_unique'
RETURN name, type, labelsOrTypes, properties
```

**Expected output**:
```
name: "query_pattern_name_unique"
type: "UNIQUENESS"
labelsOrTypes: ["QueryPattern"]
properties: ["name"]
```

### Test Query

```cypher
// Try to create duplicate pattern (should fail after first)
MERGE (p:QueryPattern {name: 'test_pattern'})
ON CREATE SET
  p.id = randomUUID(),
  p.description = 'Test pattern for verification',
  p.cypher_template = 'MATCH (n) RETURN n',
  p.success_count = 0,
  p.failure_count = 0,
  p.created_at = datetime()
ON MATCH SET
  p.success_count = p.success_count + 1
RETURN p.name, p.success_count
```

**Expected result**: First run creates node, subsequent runs increment success_count (no duplicates)

**Cleanup**:
```cypher
MATCH (p:QueryPattern {name: 'test_pattern'})
DELETE p
```

---

## Complete Setup Script

Run all commands in sequence in Neo4j Browser:

```cypher
// 1. Vector Index for Memory Embeddings
CREATE VECTOR INDEX memory_embeddings IF NOT EXISTS
FOR (m:Memory)
ON m.embedding
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};

// 2. Property Index: Memory.created_at
CREATE INDEX memory_created_at_index IF NOT EXISTS
FOR (m:Memory)
ON (m.created_at);

// 3. Property Index: Memory.overall_score
CREATE INDEX memory_overall_score_index IF NOT EXISTS
FOR (m:Memory)
ON (m.overall_score);

// 4. Unique Constraint: QueryPattern.name
CREATE CONSTRAINT query_pattern_name_unique IF NOT EXISTS
FOR (p:QueryPattern)
REQUIRE p.name IS UNIQUE;
```

---

## Verification Checklist

After running all commands, verify setup:

```cypher
// Check all indexes and constraints
SHOW INDEXES
YIELD name, type, labelsOrTypes, properties
WHERE 'Memory' IN labelsOrTypes OR 'QueryPattern' IN labelsOrTypes
RETURN name, type, labelsOrTypes, properties
ORDER BY labelsOrTypes, name;

SHOW CONSTRAINTS
YIELD name, type, labelsOrTypes, properties
RETURN name, type, labelsOrTypes, properties;
```

**Expected results**:
- ✅ 1 vector index: `memory_embeddings` on `Memory.embedding`
- ✅ 2 property indexes: `memory_created_at_index`, `memory_overall_score_index`
- ✅ 1 unique constraint: `query_pattern_name_unique` on `QueryPattern.name`
- ✅ Total: 4 indexes/constraints

---

## Performance Impact

### Before Indexes
- ❌ Memory retrieval: Full node scan on every query (slow, O(n))
- ❌ Dashboard queries: Table scans for sorting/filtering
- ❌ Pattern extraction: No uniqueness guarantee, potential duplicates

### After Indexes
- ✅ Memory retrieval: Vector index lookup (fast, O(log n))
- ✅ Dashboard queries: Indexed sorting/filtering
- ✅ Pattern extraction: Guaranteed uniqueness, efficient MERGE

**Performance targets** (FUNCTIONAL.md section 7.1):
- Query Agent p95: ≤4s
- Dashboard load: ≤3s
- Memory retrieval contributes <500ms with indexes

---

## Troubleshooting

### Issue: "Index already exists"
**Cause**: Index was created previously
**Solution**: Safe to ignore, `IF NOT EXISTS` prevents errors

### Issue: "Constraint validation failed"
**Cause**: Duplicate QueryPattern.name values already exist
**Solution**: Find and merge duplicates before creating constraint:
```cypher
// Find duplicate pattern names
MATCH (p:QueryPattern)
WITH p.name AS name, collect(p) AS patterns
WHERE size(patterns) > 1
RETURN name, size(patterns) AS count
```

### Issue: "Vector index not found" error in retrieval
**Cause**: Index name mismatch or not created
**Solution**: Verify index name matches exactly `'memory_embeddings'`

### Issue: Slow memory retrieval despite index
**Cause**: Vector index still building (async operation)
**Solution**: Wait 1-2 minutes for index population
```cypher
// Check index state
CALL db.index.vector.queryNodes('memory_embeddings', 1, [0.0])
// If error, index is not ready
```

---

## Cleanup (Development Only)

**WARNING**: Only run in development/testing. DO NOT run in production.

```cypher
// Drop all Phase 1 indexes and constraints
DROP INDEX memory_embeddings IF EXISTS;
DROP INDEX memory_created_at_index IF EXISTS;
DROP INDEX memory_overall_score_index IF EXISTS;
DROP CONSTRAINT query_pattern_name_unique IF EXISTS;
```

---

## Integration Points

These indexes support:

1. **Memory Retrieval** (`lib/memory/retrieval.ts`):
   - Uses `memory_embeddings` for vector search
   - Uses `memory_overall_score_index` for quality filtering

2. **Learning Agent** (`lib/inngest/functions/learning.ts`):
   - Uses `query_pattern_name_unique` for MERGE operations
   - Uses `memory_created_at_index` for stats calculation

3. **Dashboard** (`components/dashboard/*`):
   - Uses `memory_created_at_index` for chronological sorting
   - Uses `memory_overall_score_index` for learning curve chart

4. **Query Agent** (`app/api/chat/route.ts`):
   - Indirectly uses all indexes via memory retrieval

---

## Next Steps

After running this setup:

1. ✅ **Task 27**: Set up Supabase tables
2. ✅ **Task 28**: Configure environment variables
3. ✅ **Task 29**: Run end-to-end integration tests
4. ✅ **Verify learning loop**: Check that memories are created and retrieved

---

**Document Status**: Ready for Testing
**Last Updated**: 2025-10-19
**Created for**: Task 26 - Neo4j Schema Setup
**Testing**: Run commands in Neo4j Browser, verify with checklist above

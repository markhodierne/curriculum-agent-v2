# Testing Guide - Task 13 Learning Agent

This guide walks you through testing the complete three-agent learning loop to verify the agent is learning from interactions.

## Prerequisites Checklist

Before testing, ensure you have:

- [ ] **Environment variables set** in `.env.local`:
  - `OPENAI_API_KEY` - For GPT models
  - `NEO4J_MCP_URL` - For Neo4j MCP server
  - `NEXT_PUBLIC_SUPABASE_URL` - For analytics
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For Supabase client
  - `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations
  - `INNGEST_EVENT_KEY` - For event emission
  - `INNGEST_SIGNING_KEY` - For webhook verification

- [ ] **Neo4j vector index created** (run in Neo4j Browser):
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

- [ ] **Supabase tables created** (see `lib/database/schema.ts` for SQL)

- [ ] **Inngest dev server running** (optional for local testing):
  ```bash
  npx inngest-cli@latest dev
  ```

---

## Step-by-Step Testing Process

### Step 1: Start Development Server

```bash
cd /Users/markhodierne/projects-2/curriculum-agent-v2
pnpm dev
```

Expected output:
```
▲ Next.js 15.5.6 (Turbopack)
- Local:        http://localhost:3000
```

### Step 2: Update Chat Component to Use New Endpoint

**Option A: Quick Test (Temporary)**

Open your browser to `http://localhost:3000` and open the browser console.

In `components/chat/chat-assistant.tsx`, update line 159:
```typescript
// Change from:
const { messages: rawMessages, status, sendMessage } = useChat({
  transport: api ? new DefaultChatTransport({ api }) : undefined,
});

// To:
const { messages: rawMessages, status, sendMessage } = useChat({
  api: api || '/api/chat',  // Use new endpoint by default
});
```

**Option B: Update Page to Pass API Prop**

Open `app/page.tsx` and ensure ChatAssistant is called with:
```typescript
<ChatAssistant api="/api/chat" /> 
```

### Step 3: First Interaction (Baseline - No Memory)

1. Navigate to `http://localhost:3000`
2. Ask: **"What fractions do Year 3 students learn?"**
3. **Observe**:
   - Response streams in real-time
   -  : "🔧 read_neo4j_cypher..."
   - Response includes citations like `[Y3-F-001]`

4. **Check console logs** (browser DevTools):
   ```
   🔍 Query Agent processing: { query: "What fractions...", model: "gpt-4o" }
   🧠 Retrieving similar memories...
      ✅ Retrieved 0 memories  ← No memories yet!
   🔧 Initializing Neo4j MCP client...
   📊 Pre-fetching Neo4j schema...
   🤖 Streaming Query Agent response...
   ```

5. **Check server logs** (terminal):
   ```
   🔧 Tool called: read_neo4j_cypher
      Query: MATCH (o:Objective {year: 3})...
      ✅ Tool execution complete
   ✅ Interaction.complete event emitted: <uuid>
   ```

### Step 4: Verify Event Pipeline (Background Processing)

**Check Inngest Dashboard:**
1. Go to `https://app.inngest.com` (or `http://localhost:8288` if running locally)
2. Navigate to "Functions" → "reflection-agent"
3. You should see:
   - ✅ **Event received**: `interaction.complete`
   - ✅ **Status**: Running or Completed
   - ✅ **Steps**:
     - `evaluate-interaction` - Reflection Agent scoring
     - `calculate-overall-score` - Weighted average
     - `save-evaluation` - Supabase write
     - `trigger-learning` - Emit `reflection.complete`

4. Navigate to "Functions" → "learning-agent"
5. You should see:
   - ✅ **Event received**: `reflection.complete`
   - ✅ **Status**: Running or Completed
   - ✅ **Steps**:
     - `generate-embedding` - Create vector
     - `create-memory-node` - Write to Neo4j
     - `link-evidence` - Connect citations
     - `extract-pattern` - If score > 0.8
     - `link-similar-memories` - Vector search
     - `update-stats` - Cache update

**Expected timeline:**
- Query response: ~2-4 seconds
- Reflection: ~15-30 seconds
- Learning: ~15-30 seconds
- **Total**: ~30-60 seconds for memory creation

### Step 5: Verify Memory Creation in Neo4j

Open Neo4j Browser and run:

```cypher
// Check for Memory node
MATCH (m:Memory)
RETURN m
ORDER BY m.created_at DESC
LIMIT 1
```

**Expected result:**
- 1 node with properties:
  - `user_query`: "What fractions do Year 3 students learn?"
  - `final_answer`: "Year 3 students learn..."
  - `cypher_used`: Array of Cypher queries
  - `embedding`: Array of 1536 floats
  - `grounding_score`, `accuracy_score`, etc.
  - `overall_score`: 0.0-1.0

```cypher
// Check for Evidence links
MATCH (m:Memory)
WITH m
ORDER BY m.created_at DESC
LIMIT 1
MATCH (m)-[:USED_EVIDENCE]->(evidence)
RETURN m.user_query AS user_query, collect(evidence.id) AS citations;
```

**Expected result:**
- Evidence nodes linked (e.g., `['Y3-F-001', 'Y3-F-002']`)

### Step 6: Second Interaction (Should Use Memory!)

**Wait 60 seconds** to ensure memory is fully created, then ask a **similar question**:

**Ask**: "What fraction concepts are taught in Year 3?"

**Observe console logs:**
```
🧠 Retrieving similar memories...
   ✅ Retrieved 1 memories  ← Memory retrieved!
```

**This is the learning happening!**

The agent will:
1. Find your previous interaction via vector similarity
2. Inject it as a few-shot example in the system prompt
3. Use similar Cypher patterns
4. Produce a better, more consistent answer

### Step 7: Verify Learning Improvement

Compare the two responses:

**First interaction:**
- No memories used
- Agent explores graph from scratch
- May use different Cypher patterns

**Second interaction:**
- Uses 1 memory as example
- Follows proven Cypher pattern
- Faster, more consistent response

**Check evaluation scores in Supabase:**

```sql
SELECT
  user_query,
  grounding_score,
  accuracy_score,
  overall_score,
  created_at
FROM evaluation_metrics
ORDER BY created_at DESC
LIMIT 2;
```

**Expected**: Second interaction should have similar or better scores (not guaranteed, but trend over time).

### Step 8: Test with 5-10 More Interactions

Ask varied curriculum questions:
- "What math concepts are taught in Year 4?"
- "Compare Year 3 and Year 5 fraction objectives"
- "What are the prerequisite concepts for algebra?"
- "What strands exist in the curriculum?"
- "How many objectives are there for Year 6 math?"

**After each question:**
1. Check console: Memory count should increase (0 → 1 → 2 → 3)
2. Check Neo4j: New Memory nodes created
3. Check Inngest: Events processing successfully

### Step 9: Verify Pattern Extraction

After asking 5+ high-quality questions (overall_score > 0.8), check for patterns:

```cypher
MATCH (p:QueryPattern)
RETURN p.name, p.success_count, p.cypher_template
ORDER BY p.success_count DESC
```

**Expected**: Patterns like:
- `objectives_by_year` (used X times)
- `strand_relationships` (used Y times)

### Step 10: Verify Supabase Data Pipeline

**Check interactions table:**
```sql
SELECT COUNT(*) as total_interactions FROM interactions;
```

**Check evaluation metrics:**
```sql
SELECT
  AVG(overall_score) as avg_score,
  AVG(grounding_score) as avg_grounding,
  COUNT(*) as total_evaluations
FROM evaluation_metrics;
```

**Check memory stats cache:**
```sql
SELECT * FROM memory_stats;
```

Expected fields:
- `total_memories`: Should match Neo4j count
- `avg_overall_score`: Average quality
- `last_updated`: Recent timestamp

---

## Troubleshooting

### Issue: "Retrieved 0 memories" every time

**Possible causes:**
1. **Vector index not created** in Neo4j
   - Solution: Run the CREATE VECTOR INDEX command above
2. **Embedding generation failing**
   - Check: `OPENAI_API_KEY` is set
   - Check console for embedding errors
3. **Memory not created yet**
   - Wait 60 seconds after first query
   - Check Inngest dashboard for failures

### Issue: Inngest events not processing

**Possible causes:**
1. **Environment variables missing**
   - Check: `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set
2. **Webhook not registered**
   - Go to Inngest dashboard → Settings → Webhooks
   - Ensure `https://your-app.vercel.app/api/inngest` is registered (or local tunnel)
3. **Local development**
   - Run: `npx inngest-cli@latest dev` in a separate terminal

### Issue: MCP connection errors

**Possible causes:**
1. **NEO4J_MCP_URL incorrect**
   - Verify URL is accessible: `curl https://neo4j-mcp-server-...`
2. **Neo4j database down**
   - Check Neo4j AuraDB console
3. **Network issues**
   - Try pinging the MCP server

### Issue: Supabase write errors

**Possible causes:**
1. **Tables not created**
   - Run SQL from `lib/database/schema.ts`
2. **Service role key incorrect**
   - Check: `SUPABASE_SERVICE_ROLE_KEY` has write permissions
3. **Row-level security blocking**
   - Disable RLS for Phase 1: `ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;`

---

## Success Criteria

✅ **Minimum viable learning loop**:
- [ ] First query: 0 memories retrieved
- [ ] Memory created in Neo4j within 60 seconds
- [ ] Second similar query: 1 memory retrieved
- [ ] Agent uses memory as few-shot example
- [ ] Evaluation scores saved to Supabase
- [ ] Pattern extracted (if score > 0.8)

✅ **Observable improvement** (after 10+ interactions):
- [ ] Memory retrieval working consistently
- [ ] Avg overall_score trending upward
- [ ] Query patterns discovered (2+ patterns)
- [ ] Responses more consistent for similar questions

---

## Next Steps After Successful Testing

Once learning is verified:
1. **Delete old endpoint**: Remove `app/api/oak-curriculum-agent/route.ts`
2. **Move to Task 14**: Implement home page UI with model selector
3. **Optional**: Add dashboard (Tasks 21-25) to visualize learning curve

---

## Quick Debugging Commands

**Neo4j:**
```cypher
// Count memories
MATCH (m:Memory) RETURN count(m) as total_memories;

// Latest memory
MATCH (m:Memory) RETURN m ORDER BY m.created_at DESC LIMIT 1;

// Memory with evidence
MATCH (m:Memory)-[:USED_EVIDENCE]->(e)
RETURN m.user_query, collect(e.id) as evidence
ORDER BY m.created_at DESC LIMIT 1;

// Patterns
MATCH (p:QueryPattern) RETURN p ORDER BY p.success_count DESC;

// Delete all memories (CAUTION: For testing only)
MATCH (m:Memory) DETACH DELETE m;
```

**Supabase:**
```sql
-- Latest interactions
SELECT * FROM interactions ORDER BY created_at DESC LIMIT 5;

-- Latest evaluations
SELECT * FROM evaluation_metrics ORDER BY created_at DESC LIMIT 5;

-- Learning curve data
SELECT
  ROW_NUMBER() OVER (ORDER BY created_at) as interaction_num,
  overall_score,
  created_at
FROM evaluation_metrics
ORDER BY created_at;
```

**Server logs:**
```bash
# Tail logs in development
pnpm dev | grep -E "(🧠|🔧|✅|❌)"
```

---

**Last Updated**: 2025-10-18
**Status**: Ready for Testing

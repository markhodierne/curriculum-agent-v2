# Quick Start - Test Learning Agent (5 Minutes)

## TL;DR - Fastest Path to See Learning

### 1. Quick Fix (Make Frontend Use New Endpoint)

Open `components/chat/chat-assistant.tsx` line 159 and change:

```typescript
// FROM:
const { messages: rawMessages, status, sendMessage } = useChat({
  transport: api ? new DefaultChatTransport({ api }) : undefined,
});

// TO:
const { messages: rawMessages, status, sendMessage } = useChat({
  api: '/api/chat',  // Now uses new learning endpoint!
});
```

### 2. Start Server

```bash
pnpm dev
```

### 3. First Query (No Memory)

Open http://localhost:3000 and ask:
> "What fractions do Year 3 students learn?"

**Check browser console** - you should see:
```
🧠 Retrieving similar memories...
   ✅ Retrieved 0 memories  ← No memories yet!
```

### 4. Wait 60 Seconds

The background agents are creating a memory:
- Reflection Agent evaluates the interaction
- Learning Agent creates a Memory node in Neo4j

### 5. Second Query (Uses Memory!)

Ask a similar question:
> "What fraction concepts are taught in Year 3?"

**Check browser console** - you should see:
```
🧠 Retrieving similar memories...
   ✅ Retrieved 1 memories  ← LEARNING! 🎉
```

## That's It! The Agent is Learning!

The agent just:
1. Retrieved your previous interaction from Neo4j (vector similarity)
2. Injected it as a few-shot example in the system prompt
3. Used the proven Cypher pattern to answer faster

---

## Verify It's Working (Optional)

### Check Neo4j Memory Node

Open Neo4j Browser and run:
```cypher
MATCH (m:Memory)
RETURN m
ORDER BY m.created_at DESC
LIMIT 1
```

You should see:
- `user_query`: "What fractions do Year 3..."
- `embedding`: [1536 floats]
- `overall_score`: 0.X
- `cypher_used`: [Cypher queries]

### Check Inngest Dashboard

Go to https://app.inngest.com:
- Functions → `reflection-agent` → Should show completed run
- Functions → `learning-agent` → Should show completed run

---

## What Happens Next?

Keep asking questions! After 5-10 interactions:
- Memory retrieval becomes more accurate
- Agent learns common Cypher patterns
- Responses become faster and more consistent
- Overall scores trend upward

**See `TESTING-GUIDE.md` for detailed testing scenarios and troubleshooting.**

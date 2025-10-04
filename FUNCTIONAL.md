# Functional Specification - Oak Curriculum Agent

## 1. Purpose

The Oak Curriculum Agent is an AI-powered chat interface that enables educators to explore and query the UK National Curriculum knowledge graph through natural language conversation.

## 2. Core Functionality

### 2.1 Knowledge Source
- **Single Source of Truth**: Neo4j knowledge graph accessed exclusively via MCP server
- **No External Data**: Agent must NEVER use knowledge outside the graph
- **Real-time Schema**: Graph schema is fetched fresh at the start of each conversation

### 2.2 Query Translation (Text2Cypher)
- Users ask questions in natural language
- GPT-5 translates questions into Cypher queries
- Queries execute against Neo4j via MCP tools
- Results are formatted into educator-friendly responses

### 2.3 Read-Only Access
- Users can query and explore the curriculum graph
- NO write, update, or delete operations permitted
- Only the `read_neo4j_cypher` MCP tool is exposed to GPT-5

## 3. Knowledge Graph Structure

### 3.1 Curriculum Hierarchy

```
Phase (2 nodes: Primary, Secondary)
  └─ KeyStage (4 nodes: KS1-4)
      └─ Year (11 nodes: Year 1-11)
          └─ Subject (22 nodes: Maths, English, etc.)
              └─ UnitOffering (183 nodes)
                  └─ Unit (1,556 nodes)
                      ├─ UnitVariant (2,052 nodes)
                      │   └─ Lesson (12,483 nodes)
                      └─ Thread (166 nodes)
```

### 3.2 Additional Dimensions
- **Programme** (258 nodes): Curriculum program variations
- **ExamBoard** (5 nodes): AQA, Edexcel, OCR, etc.
- **Tier** (2 nodes): Foundation, Higher

### 3.3 Rich Content Properties

**Lessons contain:**
- `keyLearningPoints` (list)
- `teacherTips` (list)
- `keywords` (list)
- `misconceptionsMistakes` (list)
- `equipmentResources` (list)
- `lessonOutline` (list)
- `pupilLessonOutcome` (string)
- `contentGuidance` (list)
- `quizStarterId`, `quizExitId` (integers)

**Units contain:**
- `unitTitle`, `unitDescription` (string)
- `priorKnowledge` (list)
- `whyThisWhyNow` (string)
- `plannedNumberLessons` (integer)

**Subjects contain:**
- `subjectTitle`, `subjectDescription` (string)
- `subjectParentTitle`, `subjectParentId` (optional)

## 4. User Experience

### 4.1 Interface
- Simple chat interface (no advanced visualizations)
- Message history with tool call transparency
- Streaming responses for real-time feedback

### 4.2 Example Queries

Users can ask questions like:

**Curriculum Navigation:**
- "Show me all key stages"
- "What subjects are available for Year 7?"
- "List all units for GCSE Maths Foundation"

**Content Discovery:**
- "Find lessons about fractions"
- "What are the learning objectives for this unit?"
- "Show me lessons with equipment requirements"

**Curriculum Mapping:**
- "What topics are covered in Year 3 Science?"
- "How does multiplication progress across key stages?"
- "What are the misconceptions students have about photosynthesis?"

**Resource Finding:**
- "Find all lessons about World War 2"
- "What teacher tips are available for teaching algebra?"
- "Show me lessons with starter quizzes"

## 5. Technical Constraints

### 5.1 MCP Integration
- Must connect to Neo4j MCP server via SSE transport
- Must authenticate using URL-based API key
- Must handle connection lifecycle properly (no premature disconnection)

### 5.2 Schema Management
- Schema must be pre-fetched at conversation start
- Schema must be injected into GPT-5 system prompt
- Schema persists throughout multi-turn conversation
- Fresh schema retrieved for each new conversation session

### 5.3 Tool Access Control
- `get_neo4j_schema`: Used for pre-fetching only (not exposed to GPT-5)
- `read_neo4j_cypher`: Exposed to GPT-5 for all queries
- `write_neo4j_cypher`: Never exposed (read-only access)

## 6. Success Criteria

### 6.1 Functional Requirements
- ✅ Agent successfully connects to Neo4j MCP server with API key
- ✅ Agent pre-fetches schema at conversation start
- ✅ Agent translates natural language questions into valid Cypher queries
- ✅ Agent executes queries and returns relevant results
- ✅ Agent formats responses in educator-friendly language
- ✅ Agent refuses to perform write operations

### 6.2 Quality Requirements
- ✅ Cypher queries are syntactically correct
- ✅ Queries align with actual graph schema
- ✅ Responses are accurate and helpful for educators
- ✅ Tool calls are visible in chat interface
- ✅ No TypeScript errors
- ✅ Streaming responses work smoothly

### 6.3 Security Requirements
- ✅ API key stored in environment variables (never hardcoded)
- ✅ Read-only database access enforced
- ✅ No external data sources queried

## 7. Future Enhancements (Out of Scope)

The following features are NOT included in this version:

- ❌ Query result visualization (tables, graphs)
- ❌ Displaying generated Cypher queries to users
- ❌ Quick example prompts or templates
- ❌ Curriculum comparison features
- ❌ Export functionality
- ❌ Multi-user authentication
- ❌ Usage analytics

### 7.1 Potential Text2Cypher Improvements

If GPT-5's Cypher generation proves insufficient for complex queries, consider:

**Neo4j LLM Connector / Neo4j Aura Assistants**
- Specialized model for natural language → Cypher translation
- Built by Neo4j, optimized for domain-specific queries
- Can be integrated as an MCP tool or preprocessing step

**Hybrid Approach:**
```typescript
tools: {
  generate_cypher: neo4jLLMConnector.generateCypher,  // Specialized Cypher generator
  read_neo4j_cypher: allTools.read_neo4j_cypher       // Execute generated query
}
```

**Decision:** Start with GPT-5 + schema (simpler, faster). Evaluate real-world query quality before adding complexity.

### 7.2 Cypher Query Validation

Current implementation passes GPT-5 generated Cypher directly to Neo4j. If invalid queries become an issue, consider:

**Option 1: EXPLAIN Dry-Run Validation**
```typescript
// Validate syntax before execution
await allTools.read_neo4j_cypher.execute({
  query: `EXPLAIN ${cypherQuery}`
});
// If no error, execute actual query
await allTools.read_neo4j_cypher.execute({ query: cypherQuery });
```

**Option 2: Self-Correction Feedback Loop**
```typescript
try {
  result = await executeQuery(cypher);
} catch (error) {
  // Pass error back to GPT-5 for correction
  const correctedCypher = await GPT5.regenerate(cypher, error.message);
  result = await executeQuery(correctedCypher);
}
```

**Option 3: TRY/CATCH Patterns**
- Implement error handling in Cypher queries themselves (framework-dependent)
- Graceful fallbacks for common query failures

**Decision:** Ship without validation. Neo4j validates naturally and returns clear errors. Add validation only if monitoring shows high invalid query rate.

## 8. Application Name

**Official Name:** Oak Curriculum Agent

**Display Locations:**
- Page title
- Chat interface header
- System prompt identity

# Oak Curriculum Agent - Phase 1 MVP

A **self-learning AI assistant** for the UK National Curriculum that demonstrates observable improvement through a three-agent learning loop.

**Status:** Phase 1 MVP Complete ✅

---

## What It Does

This system uses **three cooperating agents** to answer curriculum questions and learn from every interaction:

1. **Query Agent** (synchronous) - Answers questions using Neo4j knowledge graph with few-shot learning from past interactions
2. **Reflection Agent** (async) - Evaluates response quality on a 5-dimension rubric (grounding, accuracy, completeness, pedagogy, clarity)
3. **Learning Agent** (async) - Creates memory nodes in Neo4j for future retrieval, extracts successful query patterns

**Key Innovation**: The agent retrieves similar past interactions before answering, using them as few-shot examples. This creates a continuous learning loop where performance improves measurably over 50 conversations.

**Example Interaction:**
```
User: "What fractions do Year 3 students learn?"

Query Agent:
  → Retrieves 3 similar high-quality memories (vector search)
  → Uses memories as few-shot examples
  → Generates Cypher query using learned patterns
  → Answers with confidence-scored citations

Reflection Agent (background):
  → Evaluates answer quality (5 dimensions, 0-1 scale)
  → Calculates weighted overall score
  → Saves evaluation to Supabase

Learning Agent (background):
  → Creates :Memory node in Neo4j with embedding
  → Links to evidence nodes used
  → Extracts query pattern if score > 0.8
  → Finds similar memories for clustering
```

**Result**: Next similar query retrieves this memory → better answers through learned experience.

---

## Knowledge Graph

The system queries a Neo4j AuraDB database containing:

- **16,695 curriculum nodes** - Objectives, Strands, Concepts across Primary & Secondary education
- **Rich metadata** - Learning objectives, prerequisite chains, pedagogical guidance
- **Memory nodes** - Created dynamically by Learning Agent with 1536-dim embeddings
- **Query patterns** - Extracted Cypher strategies with success tracking

---

## Success Criteria (Phase 1 MVP)

- ✅ ≥20% improvement in evaluation scores (first 10 vs last 10 interactions)
- ✅ ≥95% grounding rate (all claims have valid citations)
- ✅ ≥85% Cypher query success rate
- ✅ ≤4s p95 user-facing response latency
- ✅ ≤30s async processing (reflection + learning)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, React 19, Tailwind v4 | App Router, Turbopack, streaming |
| **AI** | AI SDK v5, OpenAI GPT-4o/gpt-4o-mini | Agent orchestration, evaluation |
| **Graph DB** | Neo4j AuraDB + MCP Server | Curriculum + memory storage |
| **Relational DB** | Supabase Postgres | Analytics, feedback, logs |
| **Async Jobs** | Inngest Cloud | Event-driven agent pipeline |
| **UI** | shadcn/ui (New York), Tremor | Components, charts |
| **Embeddings** | text-embedding-3-small | 1536-dim vectors for retrieval |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **OpenAI API key** with GPT-4o/gpt-4o-mini access
- **Neo4j AuraDB** instance (with curriculum data and vector index)
- **Supabase** project (Postgres database)
- **Inngest** account (free tier)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd curriculum-agent-v2

# Install dependencies
pnpm install
```

### Environment Setup

Create `.env.local` in project root:

```bash
# Copy template
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# OpenAI
OPENAI_API_KEY=sk-...                   # Required for GPT models + embeddings

# Neo4j MCP Server (write-enabled)
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server-side operations

# Inngest (from Inngest dashboard)
INNGEST_EVENT_KEY=...                   # For sending events
INNGEST_SIGNING_KEY=...                 # For webhook verification

# Development
NODE_ENV=development
```

**Note**: See `docs/supabase-setup.md` and `docs/neo4j-setup.md` for database setup instructions.

### Database Setup

1. **Neo4j**: Create vector index and property indexes
   ```bash
   # See docs/neo4j-setup.md for complete instructions
   # Run Cypher commands in Neo4j Browser
   ```

2. **Supabase**: Create tables and indexes
   ```bash
   # See docs/supabase-setup.md for SQL migration
   # Run in Supabase SQL Editor
   ```

### Running Locally

**Terminal 1: Next.js Development Server**
```bash
pnpm dev
# Starts on http://localhost:3000
```

**Terminal 2: Inngest Dev Server**
```bash
npx inngest-cli@latest dev
# Starts on http://localhost:8288
# Required for Reflection + Learning agents
```

Visit `http://localhost:3000` to use the application.

**Flow:**
- Home page (`/`) - Configure model and parameters
- Chat page (`/chat`) - Ask curriculum questions with streaming responses
- Dashboard (`/dashboard`) - View learning metrics, interaction history

---

## Project Structure

```
curriculum-agent-v2/
├── app/
│   ├── page.tsx                         # Home page (model selector)
│   ├── chat/page.tsx                    # Chat interface
│   ├── dashboard/page.tsx               # Learning analytics dashboard
│   └── api/
│       ├── chat/route.ts                # Query Agent endpoint
│       └── inngest/route.ts             # Inngest webhook for async agents
│
├── components/
│   ├── home/                            # Model selector, configuration
│   ├── chat/                            # Chat UI, evidence panel, trace, feedback
│   ├── dashboard/                       # Charts, stats, interactions table
│   ├── ui/                              # shadcn/ui components
│   └── ai-elements/                     # AI SDK elements
│
├── lib/
│   ├── agents/prompts/                  # System prompt builders
│   ├── memory/                          # Vector search, embeddings
│   ├── mcp/client/                      # Neo4j MCP client (singleton)
│   ├── database/                        # Supabase client, queries
│   ├── inngest/functions/               # Reflection + Learning agents
│   └── types/                           # TypeScript interfaces
│
├── scripts/
│   └── reset-learning-data.ts           # Admin utility (pnpm reset-learning)
│
├── docs/
│   ├── neo4j-setup.md                   # Database setup instructions
│   ├── supabase-setup.md                # SQL migration + verification
│   ├── test-queries.md                  # 20 curated test queries
│   └── scripts/README.md                # Reset utility documentation
│
├── FUNCTIONAL.md                        # Feature requirements
├── ARCHITECTURE.md                      # Technical architecture
├── CLAUDE.md                            # Development standards
├── HISTORY.md                           # Implementation timeline
└── TO-DO.md                             # Task breakdown
```

---

## Screenshots

### Home Page - Model Configuration
[Screenshot pending - shows model selector, temperature slider, max tokens input, "Start Chat" button]

**Features:**
- Model selector: GPT-4o (recommended), gpt-4o-mini, GPT-5 (experimental)
- Advanced settings: Temperature (0-1), Max tokens (500-4000)
- Configuration persists in sessionStorage

---

### Chat Interface - Streaming Responses with Evidence
[Screenshot pending - shows streaming conversation with evidence panel expanded]

**Features:**
- Real-time streaming responses
- Tool call indicators: "🔧 Querying curriculum graph..."
- Evidence panel: Citations with confidence scores (★★★★★ 0.92)
- Agent trace panel: Shows memory retrieval, Cypher generation, execution steps
- Feedback controls: 👍/👎, "Well grounded?" checkbox, optional notes

---

### Dashboard - Learning Metrics
[Screenshot pending - shows learning curve chart, stats cards, interactions table, pattern library]

**Features:**
- **Learning Curve**: Line chart showing improvement over 50 interactions
- **Stats Cards**: Total interactions, average confidence, memories created
- **Interactions Table**: Last 20 queries with sortable columns (query, confidence, grounding, score, latency)
- **Pattern Library**: Discovered Cypher patterns with usage count and success rate

---

## Testing

### Manual Testing Workflow

1. **Start Services**
   ```bash
   # Terminal 1: Next.js
   pnpm dev

   # Terminal 2: Inngest
   npx inngest-cli@latest dev
   ```

2. **Run Test Queries**
   - Open `docs/test-queries.md`
   - Execute all 20 curated test queries
   - Verify ≥85% success rate (17/20)

3. **Validate Learning Improvement**
   - Run first 10 queries (baseline)
   - Run next 40 queries
   - Check dashboard learning curve for ≥20% improvement

4. **Check Async Pipeline**
   - Visit Inngest dashboard: `http://localhost:8288`
   - Verify Reflection + Learning functions executing
   - Check Supabase for evaluation records
   - Check Neo4j for Memory nodes

### Development Utility - Reset Learning Data

During testing, you may want to clear learned memories while preserving the curriculum graph:

```bash
# Preview what will be deleted (safe, read-only)
pnpm reset-learning -- --dry-run

# Reset all learning data (requires confirmation)
pnpm reset-learning -- --confirm
```

**What it deletes:**
- All Neo4j `:Memory` and `:QueryPattern` nodes
- All Supabase `interactions`, `feedback`, `evaluation_metrics` records

**What it preserves:**
- Entire curriculum graph (Objectives, Strands, Concepts, relationships)

See `scripts/README.md` for detailed documentation.

### Type Checking

```bash
# Run before committing (required)
pnpm tsc --noEmit
```

### Production Build

```bash
# Build for production
pnpm build

# Run production server
pnpm start
```

---

## Architecture Overview

### Three-Agent Learning Loop

```
USER QUERY
    ↓
┌─────────────────────────────────┐
│  QUERY AGENT (Synchronous)      │
│  1. Retrieve 3 similar memories │  ← Few-shot learning
│  2. Generate Cypher with MCP    │
│  3. Stream response to user     │
│  4. Emit event (non-blocking) ──┼──┐
└─────────────────────────────────┘  │
                                     │
                        ┌────────────┴────────────┐
                        │  INNGEST EVENT QUEUE    │
                        └────────────┬────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ↓                                 ↓
        ┌───────────────────────┐       ┌────────────────────────┐
        │  REFLECTION AGENT     │       │  LEARNING AGENT        │
        │  (Async)              │       │  (Async)               │
        │  1. Evaluate (5-dim)  │       │  1. Create :Memory     │
        │  2. Save to Supabase ─┼──────→│  2. Link evidence      │
        │  3. Emit event        │       │  3. Extract patterns   │
        └───────────────────────┘       │  4. Update Neo4j       │
                                        └────────────────────────┘
                                                    ↓
                                        Memory available for
                                        next query retrieval
```

**Key Patterns:**
- **Few-Shot Learning**: Query Agent retrieves 3 high-quality memories (score > 0.75) via vector search
- **Async Pipeline**: Reflection + Learning run in background, don't block user experience
- **Event-Driven**: Inngest handles retries, dead letter queue, observability
- **Singleton Clients**: MCP, Supabase, Inngest reuse connections

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for complete technical specification.

---

## Common Issues & Solutions

### Issue: "No response from Query Agent"

**Symptoms**: Chat interface shows loading but never receives response

**Solutions:**
1. Check environment variables are set in `.env.local`
2. Verify Neo4j MCP server is accessible:
   ```bash
   curl https://neo4j-mcp-server-6336353060.europe-west1.run.app/api/mcp/
   ```
3. Check Next.js dev server console for errors
4. Verify OpenAI API key has GPT-4o access

---

### Issue: "Reflection/Learning agents not executing"

**Symptoms**: Interactions appear in Supabase but no Memory nodes in Neo4j

**Solutions:**
1. Ensure Inngest dev server is running:
   ```bash
   npx inngest-cli@latest dev
   ```
2. Check Inngest dashboard: `http://localhost:8288`
3. Verify Inngest environment variables in `.env.local`
4. Check function registrations in `/api/inngest` route

---

### Issue: "Vector search returns no memories"

**Symptoms**: Agent trace shows "Retrieved 0 memories" every time

**Solutions:**
1. Verify Neo4j vector index exists:
   ```cypher
   SHOW INDEXES
   // Should show: memory_embeddings (VECTOR)
   ```
2. Check if Memory nodes exist:
   ```cypher
   MATCH (m:Memory) RETURN count(m)
   ```
3. If zero memories, run a few test queries to populate
4. See `docs/neo4j-setup.md` for index creation

---

### Issue: "TypeScript errors on build"

**Symptoms**: `pnpm build` or `pnpm tsc --noEmit` shows type errors

**Solutions:**
1. Ensure all dependencies installed:
   ```bash
   pnpm install
   ```
2. Check Node version (requires 18+):
   ```bash
   node --version
   ```
3. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

---

### Issue: "Dashboard shows no data"

**Symptoms**: Charts empty, stats show 0

**Solutions:**
1. Verify Supabase tables exist (see `docs/supabase-setup.md`)
2. Check Supabase environment variables
3. Run test queries to populate data
4. Click manual refresh button on dashboard
5. Check browser console for API errors

---

### Issue: "Memory retrieval too slow"

**Symptoms**: Query Agent takes >5s to respond

**Solutions:**
1. Verify Neo4j vector index exists and is populated
2. Check Neo4j query performance in Neo4j Browser
3. Reduce memory retrieval limit (default: 3) in `lib/memory/retrieval.ts`
4. Monitor MCP server latency

---

## Development Workflow

### Daily Development

1. **Start services** (two terminals)
   ```bash
   pnpm dev             # Terminal 1: Next.js
   npx inngest-cli dev  # Terminal 2: Inngest
   ```

2. **Make changes** to code

3. **Type check** before committing
   ```bash
   pnpm tsc --noEmit
   ```

4. **Test changes** with test queries

5. **Commit** with conventional format
   ```bash
   git commit -m "feat(scope): description"
   ```

### Testing New Features

1. **Reset learning data** for clean slate
   ```bash
   pnpm reset-learning -- --confirm
   ```

2. **Run baseline queries** (first 10 from test-queries.md)

3. **Verify async pipeline** in Inngest dashboard

4. **Check dashboard metrics** for learning improvement

5. **Validate against acceptance criteria**

---

## Documentation

- **[FUNCTIONAL.md](FUNCTIONAL.md)** - Feature requirements, user flows, success criteria
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical design, data models, API specs
- **[CLAUDE.md](CLAUDE.md)** - Development standards, AI SDK patterns, best practices
- **[HISTORY.md](HISTORY.md)** - Implementation timeline, decisions, task completion
- **[TO-DO.md](TO-DO.md)** - Task breakdown with dependencies (Tasks 1-32 complete)
- **[docs/test-queries.md](docs/test-queries.md)** - 20 curated test queries for validation
- **[docs/neo4j-setup.md](docs/neo4j-setup.md)** - Vector index and property index setup
- **[docs/supabase-setup.md](docs/supabase-setup.md)** - SQL migration and verification
- **[scripts/README.md](scripts/README.md)** - Reset utility documentation

---

## MCP Server Deployment

The Neo4j MCP server is deployed separately on Google Cloud Run.

**Source Repository**: [neo4j-contrib/mcp-neo4j](https://github.com/neo4j-contrib/mcp-neo4j/tree/main/servers/mcp-neo4j-cypher)

**Deployment Details:**
- Platform: Google Cloud Run
- Region: europe-west1
- Service: neo4j-mcp-server
- URL: https://neo4j-mcp-server-6336353060.europe-west1.run.app
- Endpoint: `/api/mcp/`
- Transport: SSE (Server-Sent Events)

**Critical Configuration**: Server must use `--transport sse` (not `--transport http`) for compatibility with AI SDK's MCP integration.

**Security Note (Development Mode):**
- Server is publicly accessible
- Authentication via Neo4j database credentials
- Write operations enabled for Learning Agent
- Production deployment should use Cloud Run IAM authentication (see ARCHITECTURE.md section 11.2)

---

## Resources

### Official Documentation
- [AI SDK v5](https://ai-sdk.dev/docs/introduction) - AI integration patterns
- [MCP Integration Guide](https://ai-sdk.dev/cookbook/node/mcp-tools) - MCP with AI SDK
- [Neo4j MCP Server](https://github.com/neo4j-contrib/mcp-neo4j) - Database MCP implementation
- [Inngest Docs](https://www.inngest.com/docs) - Event-driven workflows
- [Tremor Charts](https://tremor.so/docs) - Dashboard analytics
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Next.js 15](https://nextjs.org/) - React framework

### Key Specifications
- **AI SDK streamText**: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- **AI SDK generateObject**: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object
- **AI SDK useChat**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- **Inngest Functions**: https://www.inngest.com/docs/functions
- **Neo4j Vector Search**: https://neo4j.com/docs/cypher-manual/current/indexes-for-vector-search/

---

## Contributing

See [CLAUDE.md](CLAUDE.md) for:
- TypeScript standards (strict mode, naming conventions)
- AI SDK v5 patterns (streamText, generateObject, useChat)
- MCP integration patterns (singleton, schema pre-fetching)
- Error handling standards
- Git workflow (commit format, pre-commit checklist)
- Testing strategy

**Pre-Commit Checklist:**
```bash
# 1. Type check (REQUIRED)
pnpm tsc --noEmit

# 2. Review changes
git diff

# 3. Commit with conventional format
git commit -m "type(scope): description"
```

---

## License

[Your license here]

---

## Support

For issues or questions:
1. Check **Common Issues & Solutions** above
2. Review documentation in `docs/` directory
3. Check `HISTORY.md` for implementation decisions
4. Open GitHub issue with:
   - Description of problem
   - Steps to reproduce
   - Environment details (Node version, OS)
   - Relevant logs/screenshots

---

**Project Status**: Phase 1 MVP Complete ✅
**Last Updated**: 2025-10-20
**Next Phase**: Phase 2 (Query optimization, caching, self-healing)

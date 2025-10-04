# Oak Curriculum Agent

An AI-powered chat interface for exploring the UK National Curriculum knowledge graph through natural language conversation.

**Status:** MVP development completed

## What It Does

Ask questions about the UK National Curriculum in plain English and get instant answers from a Neo4j knowledge graph containing:

- **16,695 curriculum nodes** - Phases, Key Stages, Years, Subjects, Units, Lessons
- **Rich content** - Learning objectives, teacher tips, misconceptions, resources
- **Complete structure** - Primary to Secondary education

**Example queries:**
- "What subjects are available for Year 7?"
- "Show me all lessons about fractions"
- "What are common misconceptions about photosynthesis?"
- "How does multiplication progress across key stages?"

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key (GPT-5 access)
- Access to Neo4j MCP server

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd curriculum-agent

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Configuration

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app
```

### Run

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

Visit `http://localhost:3000` and start asking questions!

## How It Works

1. **Natural language input** - Ask curriculum questions in plain English
2. **Text-to-Cypher translation** - GPT-5 converts your question to a Neo4j query
3. **Graph database query** - MCP server executes read-only Cypher queries
4. **Educator-friendly response** - Results formatted for teaching professionals

**Architecture:**
```
User → Next.js Chat UI → GPT-5 → Neo4j MCP Server → Neo4j AuraDB
                           ↓
                    Natural Language → Cypher
```

The agent pre-fetches the database schema and uses it to generate accurate Cypher queries. Only read operations are permitted - no data modification possible.

## Key Technologies

- **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui, AI Elements
- **AI:** OpenAI GPT-5, AI SDK 5
- **Database:** Neo4j AuraDB (via MCP)
- **Infrastructure:** Google Cloud Run (MCP server)

## Project Structure

```
curriculum-agent/
├── app/
│   ├── page.tsx                          # Main chat interface
│   └── api/oak-curriculum-agent/
│       └── route.ts                      # Agent API with MCP integration
├── components/
│   ├── chat/chat-assistant.tsx           # Chat UI
│   ├── agent/oak-curriculum-prompt.ts    # System prompt builder
│   └── ai-elements/                      # Vercel AI Elements
├── lib/mcp/client/
│   └── neo4j-client.ts                   # Neo4j MCP client (SSE)
└── Documentation files (*.md)
```

## Documentation

- **[FUNCTIONAL.md](FUNCTIONAL.md)** - Feature requirements and use cases
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical design and system architecture
- **[CLAUDE.md](CLAUDE.md)** - Development standards and patterns
- **[HISTORY.md](HISTORY.md)** - Implementation timeline and decisions
- **[TO-DO.md](TO-DO.md)** - Task breakdown and completion status

## MCP Server Deployment

The Neo4j MCP server is deployed separately on Google Cloud Run.

**Source:** [neo4j-contrib/mcp-neo4j](https://github.com/neo4j-contrib/mcp-neo4j/tree/main/servers/mcp-neo4j-cypher)

**Deployment repo:** `/Users/markhodierne/projects/oak/oak-knowledge-graph-neo4j-mcp-server`

**Critical configuration:** Server must use `--transport sse` (not `--transport http`) for compatibility with AI SDK's SSEClientTransport.

**Deployed to:**
- Platform: Google Cloud Run
- Region: europe-west1
- Service: neo4j-mcp-server
- URL: https://neo4j-mcp-server-6336353060.europe-west1.run.app
- Endpoint: `/api/mcp/`

## Security

**Current state (Development):**
- MCP server is publicly accessible
- Authentication via Neo4j database credentials
- Write operations blocked at application level (tool not exposed)

**Production recommendations:** See [ARCHITECTURE.md - Section 9](ARCHITECTURE.md#9-security-considerations) for Cloud Run IAM authentication options.

## Development

```bash
# Type check
pnpm tsc --noEmit

# Start dev server
pnpm dev
```

See [CLAUDE.md](CLAUDE.md) for development standards and best practices.

## Resources

- [AI SDK Documentation](https://ai-sdk.dev/) - AI integration toolkit
- [MCP Integration Guide](https://ai-sdk.dev/cookbook/node/mcp-tools) - MCP with AI SDK
- [Neo4j MCP Server](https://github.com/neo4j-contrib/mcp-neo4j) - Database MCP server
- [Next.js 15](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library

## License

[Your license here]

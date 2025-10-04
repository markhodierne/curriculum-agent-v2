# MCP Tools Agent

AI agent with Model Context Protocol (MCP) integration for dynamic tool retrieval. Built with Next.js 15, TypeScript, AI SDK 5, and Firecrawl MCP server.

## Features

- **MCP Integration**: Dynamic tool retrieval from external MCP servers
- **Firecrawl Tools**: Web scraping and crawling capabilities via Firecrawl MCP server
- **Streaming Responses**: Real-time streaming with GPT-5 and AI SDK
- **AI Elements UI**: Pre-built components for tool calls, reasoning, and sources
- **shadcn/ui Design System**: Clean, modern interface components
- **TypeScript**: Full type safety throughout the application

## What is MCP?

**Model Context Protocol (MCP)** allows AI agents to dynamically retrieve tools from external servers instead of hardcoding them. This enables:

- Flexible tool integration without code changes
- Access to third-party tool ecosystems
- Runtime tool discovery and configuration
- Easier maintenance and updates

Learn more: [AI SDK MCP Integration](https://ai-sdk.dev/cookbook/node/mcp-tools)

## Current MCP Server

This template uses the **Firecrawl MCP Server** for web scraping capabilities:

- **Server**: https://mcp.firecrawl.dev
- **Transport**: SSE (Server-Sent Events)
- **Documentation**: https://docs.firecrawl.dev/mcp-server
- **Tools**: Web scraping, crawling, and search

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment variables

Create a `.env.local` file with:

```bash
OPENAI_API_KEY=your_openai_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

**Get API Keys**:
- OpenAI: https://platform.openai.com/api-keys
- Firecrawl: https://firecrawl.dev

### 3. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the MCP Tools Agent.

## Architecture & Data Flow

```text
┌─────────────────────────┐         ┌──────────────────────────────┐         ┌─────────────────────────┐
│      Browser UI         │         │    Next.js API Route         │         │    Firecrawl MCP        │
│  ChatAssistant          │         │  /api/agent-with-mcp-tools   │         │  mcp.firecrawl.dev      │
│  - AI Elements          │         │  - MCP client connection     │         │  - Web scraping tools   │
│  - Tool display         │         │  - Dynamic tool retrieval    │         │  - SSE transport        │
│  - Streaming messages   │         │  - streamText() with tools   │         │                         │
└─────────────────────────┘         └──────────────────────────────┘         └─────────────────────────┘
           │                                      │                                      │
           │ 1) User sends message                │                                      │
           │─────────────────────────────────────>│                                      │
           │   POST { messages: [...] }           │                                      │
           │                                      │ 2) Connect to MCP server             │
           │                                      │─────────────────────────────────────>│
           │                                      │                                      │
           │                                      │ 3) Retrieve tools via MCP            │
           │                                      │<─────────────────────────────────────│
           │                                      │   { firecrawl_scrape, ... }          │
           │                                      │                                      │
           │                                      ├──> OpenAI GPT-5                      │
           │                                      │    streamText({ tools })             │
           │                                      │<── Streaming response                │
           │                                      │                                      │
           │                                      │ 4) Tool calls during stream          │
           │                                      │─────────────────────────────────────>│
           │                                      │<─────────────────────────────────────│
           │                                      │   Tool results                       │
           │ 5) Stream UI messages                │                                      │
           │<─────────────────────────────────────│                                      │
           │   { parts: [text, tool, ...] }       │                                      │
           │                                      │                                      │
           │ 6) Render tool calls & results       │                                      │
           │    with AI Elements                  │                                      │
           v                                      v                                      v
```

**Key Flow**:
1. User sends message via chat interface
2. API route connects to Firecrawl MCP server
3. MCP server returns available tools dynamically
4. GPT-5 streams response and can call MCP tools as needed
5. Tool calls and results are streamed to the UI
6. AI Elements components display tools, reasoning, and sources

## Adding Your Own MCP Server

To integrate a different MCP server:

### 1. Create MCP client

Create a new file in `/lib/mcp/client/your-mcp-client.ts`:

```typescript
import { experimental_createMCPClient } from "ai";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class YourMCPClient {
  private client: Awaited<ReturnType<typeof experimental_createMCPClient>> | null = null;
  private apiKey: string;
  private serverUrl: string;

  constructor(config: { apiKey: string; serverUrl?: string }) {
    this.apiKey = config.apiKey;
    this.serverUrl = config.serverUrl || "https://your-mcp-server.com/sse";
  }

  async connect(): Promise<void> {
    const transport = new SSEClientTransport(new URL(this.serverUrl));
    this.client = await experimental_createMCPClient({ transport });
  }

  async getTools(): Promise<Record<string, any>> {
    if (!this.client) await this.connect();
    return await this.client!.tools();
  }
}

let instance: YourMCPClient | null = null;

export function getYourMCPClient(apiKey?: string): YourMCPClient {
  if (!instance) {
    const key = apiKey || process.env.YOUR_MCP_API_KEY;
    if (!key) throw new Error("YOUR_MCP_API_KEY not found");
    instance = new YourMCPClient({ apiKey: key });
  }
  return instance;
}
```

### 2. Update API route

In `/app/api/agent-with-mcp-tools/route.ts`:

```typescript
import { getYourMCPClient } from "@/lib/mcp/client/your-mcp-client";

// Replace Firecrawl client with yours
const mcpClient = getYourMCPClient();
await mcpClient.connect();
const tools = await mcpClient.getTools();
```

### 3. Add environment variable

Add to `.env.local`:

```bash
YOUR_MCP_API_KEY=your_api_key_here
```

### 4. Update documentation

Update `CLAUDE.md` and this README with your MCP server details.

## Project Structure

```
curriculum-agent/
├── app/
│   ├── page.tsx                           # Main MCP Tools Agent page
│   ├── api/
│   │   └── agent-with-mcp-tools/
│   │       └── route.ts                   # API route with MCP integration
│   └── layout.tsx                         # Root layout with metadata
├── components/
│   ├── chat/
│   │   └── chat-assistant.tsx             # Chat UI with tool display
│   ├── ai-elements/                       # AI Elements components
│   │   ├── conversation.tsx
│   │   ├── message.tsx
│   │   ├── tool.tsx
│   │   └── ...
│   ├── agent/
│   │   └── web-scraper-prompt.ts          # System instructions
│   └── ui/                                # shadcn/ui components
├── lib/
│   ├── mcp/
│   │   └── client/
│   │       ├── firecrawl-client.ts        # Firecrawl MCP client
│   │       └── types.ts                   # MCP type definitions
│   └── utils.ts                           # Utility functions
├── types/                                 # TypeScript types
└── CLAUDE.md                              # Detailed architecture docs
```

## Development

### Run development server

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
pnpm start
```

### Type checking

```bash
pnpm tsc --noEmit
```

## Resources

- [AI SDK Documentation](https://ai-sdk.dev/) - AI integration toolkit
- [MCP Integration Guide](https://ai-sdk.dev/cookbook/node/mcp-tools) - How to use MCP with AI SDK
- [AI Elements](https://ai-sdk.dev/elements/overview) - Pre-built AI UI components
- [Next.js 15](https://nextjs.org/) - React framework
- [Firecrawl](https://firecrawl.dev) - Web scraping MCP server
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## Learn More

- See `CLAUDE.md` for detailed architecture documentation
- See `/lib/mcp/CLAUDE.md` for MCP implementation details
- See `/components/chat/claude.md` for chat component guidelines

## License

MIT

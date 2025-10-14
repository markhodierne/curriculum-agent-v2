# Implementation History

This document tracks the implementation of the Oak Curriculum Agent, an AI-powered interface for querying the UK National Curriculum knowledge graph stored in Neo4j.

## Overview

**What was built:** A Next.js chat application that connects to a Neo4j knowledge graph via MCP (Model Context Protocol), allowing educators to ask questions in natural language.

**Key components:**
- Next.js frontend with AI SDK chat interface
- MCP client for Neo4j database connectivity
- Custom Neo4j MCP server deployed to Google Cloud Run
- GPT-5 for natural language to Cypher query translation

---

## Session 1: Core Agent Implementation

### 1. Neo4j MCP Client (`lib/mcp/client/neo4j-client.ts`)

Created a client to connect to the Neo4j MCP server using Server-Sent Events (SSE) transport.

**Key features:**
- Singleton pattern for connection reuse
- SSE transport via `SSEClientTransport`
- Methods: `connect()`, `disconnect()`, `getTools()`, `isClientConnected()`
- Emoji-prefixed console logging for debugging
- Type-safe with `Record<string, any>` for MCP tools

**Configuration:**
- Endpoint: `${NEO4J_MCP_URL}/api/mcp/`
- No API key required (server uses Neo4j credentials)

### 2. System Prompt Builder (`components/agent/oak-curriculum-prompt.ts`)

Built a function that generates GPT-5 system prompts with the Neo4j schema dynamically injected.

**Includes:**
- Text-to-Cypher instructions
- Read-only constraints (prevents CREATE/SET/DELETE)
- Educator-focused response guidelines
- Neo4j schema in JSON format

### 3. API Route (`app/api/oak-curriculum-agent/route.ts`)

Implemented the main agent endpoint with schema pre-fetching.

**Flow:**
1. Connect to Neo4j MCP client
2. Pre-fetch database schema using `get_neo4j_schema` tool
3. Build system prompt with schema
4. Stream responses using `streamText()` with GPT-5
5. Expose only `read_neo4j_cypher` tool (read-only access)

**Security:** Only read operations allowed - write tools (`write_neo4j_cypher`) not exposed to GPT-5.

### 4. Environment Setup (`.env.local`)

```bash
OPENAI_API_KEY=sk-...
NEO4J_MCP_URL=https://neo4j-mcp-server-6336353060.europe-west1.run.app
```

---

## Session 2: MCP Server Deployment

### Problem: Connection Timeout

The Next.js client couldn't connect to the MCP server. Root cause: **transport mode mismatch**.

- **Issue:** Existing MCP server used `--transport http` (FastMCP's HTTP mode)
- **Incompatibility:** AI SDK's `SSEClientTransport` requires Server-Sent Events, not HTTP POST/JSON-RPC
- **Result:** Connection hung indefinitely

### Solution: Deploy MCP Server with SSE Transport

**MCP Server Details:**
- **Source:** `https://github.com/neo4j-contrib/mcp-neo4j/tree/main/servers/mcp-neo4j-cypher`
- **Deployment repo:** `/Users/markhodierne/projects/oak/oak-knowledge-graph-neo4j-mcp-server`
- **Package:** `mcp-neo4j-cypher` (installed via PyPI in Dockerfile)

**Key Configuration Change:**

Modified `mcp_server_start.sh`:
```bash
# Changed from:
--transport http

# To:
--transport sse
```

**Deployment:**
```bash
cd /Users/markhodierne/projects/oak/oak-knowledge-graph-neo4j-mcp-server

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _NEO4J_URI=neo4j+s://...,_NEO4J_USERNAME=neo4j,_NEO4J_PASSWORD=...
```

**Deployed to:**
- **Platform:** Google Cloud Run
- **Project:** `oak-ai-playground`
- **Region:** `europe-west1`
- **Service:** `neo4j-mcp-server`
- **URL:** `https://neo4j-mcp-server-6336353060.europe-west1.run.app`
- **Endpoint:** `/api/mcp/`

### How It Works

**Connection flow:**
1. Next.js API route creates `Neo4jMCPClient` singleton
2. Client connects via `SSEClientTransport` to Cloud Run endpoint
3. MCP server (FastMCP with SSE mode) accepts connection
4. Client retrieves three tools: `get_neo4j_schema`, `read_neo4j_cypher`, `write_neo4j_cypher`
5. Schema pre-fetched using `get_neo4j_schema`
6. Only `read_neo4j_cypher` exposed to GPT-5 (read-only access)

### Important Notes

**Transport Compatibility:**
- ✅ `--transport sse` works with `SSEClientTransport`
- ❌ `--transport http` does NOT work with `SSEClientTransport`

**URL Requirements:**
- ✅ Use regional URL: `neo4j-mcp-server-6336353060.europe-west1.run.app`
- ❌ Short URL causes "Invalid host header" errors

**Security:**
- MCP server is publicly accessible (development mode)
- Authentication via Neo4j database credentials only
- Write operations blocked at application level (tool not exposed)

---

## Session 3: Migration to HTTP Transport

### Problem: SSE Transport Deprecated

MCP protocol deprecated SSE transport in favor of HTTP transport.

**Changes required:**
- Update MCP client from `SSEClientTransport` to `StreamableHTTPClientTransport`
- MCP server already redeployed with HTTP transport

### Solution: Update Client to HTTP Transport

**Updated `lib/mcp/client/neo4j-client.ts`:**

```typescript
// Before:
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
const transport = new SSEClientTransport(new URL(this.serverUrl));

// After:
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const transport = new StreamableHTTPClientTransport(new URL(this.serverUrl));
```

**Endpoint:** Unchanged - `${NEO4J_MCP_URL}/api/mcp/`

**Additional Changes:**
- Updated page title from "Oak Curriculum Agent" to "Oak Curriculum Chat" (`app/page.tsx:16`)

**Status:** ✅ Complete - TypeScript passes, app functional with HTTP transport

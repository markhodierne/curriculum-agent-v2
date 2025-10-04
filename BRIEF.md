The repo contains a 'starter' codebase to build a chat agent application that utilizes an MCP server.
I have developed the MCP server and hosted it on Google Cloud Run at:
https://neo4j-mcp-server-6336353060.europe-west1.run.app

The application is the "Oak Curriculum Agent". The MCP provides access to a knowledge graph hosted on Neo4j AuraDB. The knowledge graph maps out a structure and resources that help schools to deliver the UK National Curriculum as specified by the Department for Education.

The LLM MUST use the MCP as its only source of content.

Help me to understand OAuth. Do I need to implement this between the app and the MCP server? Does anything need to be changed on GCP to enable this?

Ask me any other questions about this app so that we build a world class agent that explores the knowledge graph.
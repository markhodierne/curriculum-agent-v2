The repo contains a 'starter' codebase to build a chat agent application that utilizes an MCP server.
I have developed the MCP server and hosted it on Google Cloud Run at:
https://neo4j-mcp-server-6336353060.europe-west1.run.app

The application is the "Oak Curriculum Agent". The MCP provides access to a knowledge graph hosted on Neo4j AuraDB. The knowledge graph maps out a structure and resources that help schools to deliver the UK National Curriculum as specified by the Department for Education.

Currently, the application does a very poor job as an agent. The implementation is very basic.

Here are my ideas for this "v2":

1. Create a 'home page' where the user can select the implementation of the agent:
- Basic (this is the current implementation unchanged - it will serve as a baseline)
- 
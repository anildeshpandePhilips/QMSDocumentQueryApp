# Neo4j MCP Server Setup Guide

This guide helps you set up the Neo4j Model Context Protocol (MCP) server to integrate with Claude Desktop for your LLM-powered Neo4j Query App.

## 🔧 Prerequisites

- ✅ Neo4j Database running locally (bolt://localhost:7687)
- ✅ Claude Desktop installed
- ✅ Node.js v18+ installed

## 📦 Installation Options

### Option 1: Using the Published Package (Recommended)

The Neo4j MCP server is available as a published package. Use this configuration in your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher@0.2.4", "--transport", "stdio"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
```

### Option 2: Using the Alternative Package (Your Configuration)

Your configuration uses an alternative package:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "npx",
      "args": ["@alanse/mcp-neo4j-server"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
```

## 🛠️ Available MCP Tools

Once configured, you'll have access to these tools in Claude Desktop:

### 📊 Query Tools
- **`read-neo4j-cypher`** - Execute read-only Cypher queries
  - Input: `query` (string), `params` (optional dictionary)
  - Returns: Query results as JSON array

- **`write-neo4j-cypher`** - Execute write/update Cypher queries  
  - Input: `query` (string), `params` (optional dictionary)
  - Returns: Result summary with counters

### 🕸️ Schema Tools
- **`get-neo4j-schema`** - Get database schema information
  - No input required
  - Returns: Node labels, properties, and relationships

## 🔒 Security Configuration

For production use, consider:

1. **Read-only Role**: Create a dedicated read-only user for LLM queries
2. **Query Validation**: The MCP server should validate queries before execution
3. **Connection Security**: Use encrypted connections (neo4j+s://) for remote databases

## 🎯 Integration with Your Project

This MCP setup will enhance your project by:

1. **Direct Database Access**: Claude can directly query your Neo4j database
2. **Schema Awareness**: Claude can understand your graph structure
3. **Query Generation**: Claude can generate and validate Cypher queries
4. **Real-time Testing**: Test LLM-generated queries immediately

## 📍 Claude Desktop Config Location

Place your configuration in the appropriate location:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

## 🧪 Testing the Setup

After configuration:

1. Restart Claude Desktop
2. Start a new conversation
3. Ask Claude to: "Get the Neo4j database schema"
4. Claude should use the `get-neo4j-schema` tool automatically

## 🔄 Alternative Configurations

### With Namespace (Multiple Databases)
```json
{
  "mcpServers": {
    "neo4j-local": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher@0.2.4", "--namespace", "local"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
```

### Using Docker
```json
{
  "mcpServers": {
    "neo4j": {
      "command": "docker",
      "args": [
        "run", "--rm",
        "-e", "NEO4J_URI=bolt://host.docker.internal:7687",
        "-e", "NEO4J_USERNAME=neo4j", 
        "-e", "NEO4J_PASSWORD=password",
        "mcp/neo4j-cypher:latest"
      ]
    }
  }
}
```

## 🎯 Next Steps

1. Configure Claude Desktop with your chosen option
2. Test the MCP connection
3. Begin Phase 1 of your project (Graph Schema Setup)
4. Use Claude's MCP tools to explore and validate your schema

This MCP integration will significantly accelerate your development process by providing direct database access and intelligent query generation capabilities.

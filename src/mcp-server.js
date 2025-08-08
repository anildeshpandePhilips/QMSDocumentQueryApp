import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import { LLMToCypherConverter } from "./llm-to-cypher.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

dotenv.config();

// Reuse existing drivers and converters
const neo = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

const llmConverter = new LLMToCypherConverter();
const server = new McpServer({ name: "qms-neo4j-ollama-mcp", version: "1.0.0" }, {
  capabilities: {
    tools: {}
  }
});

// Tool: neo4j.query (read-only, reusing existing validation)
server.registerTool(
  "neo4j.query",
  "Execute read-only Cypher queries against QMS Neo4j database",
  {
    type: "object",
    properties: {
      cypher: { type: "string", minLength: 1 },
      params: { type: "object", additionalProperties: true }
    },
    required: ["cypher"]
  },
  async ({ cypher, params = {} }) => {
    try {
      // Reuse existing security validation from llm-to-cypher.js
      const dangerousPatterns = /\b(CREATE|DELETE|SET|REMOVE|MERGE|DROP)\b/i;
      if (dangerousPatterns.test(cypher)) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Security violation: Only read-only queries are allowed",
              code: "SECURITY_VIOLATION"
            })
          }]
        };
      }

      if (!cypher.toLowerCase().includes('return')) {
        return {
          isError: true,
          content: [{
            type: "text", 
            text: JSON.stringify({
              success: false,
              error: "Security violation: Query must include RETURN statement",
              code: "MISSING_RETURN"
            })
          }]
        };
      }

      console.log(`🔍 Executing Cypher via MCP: ${cypher}`);
      
      // Execute query using existing Neo4j driver
      const session = neo.session();
      try {
        const result = await session.run(cypher, params);
        const records = result.records.map(record => {
          const obj = {};
          record.keys.forEach(key => {
            const value = record.get(key);
            // Handle Neo4j types (same logic as existing server.js)
            if (value && typeof value === 'object' && value.properties) {
              obj[key] = value.properties;
            } else if (value && typeof value === 'object' && value.low !== undefined) {
              obj[key] = value.toNumber ? value.toNumber() : value.low;
            } else {
              obj[key] = value;
            }
          });
          return obj;
        });

        console.log(`✅ MCP Neo4j query successful: ${records.length} records`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: records,
              count: records.length,
              cypher: cypher,
              executionTime: result.summary.resultAvailableAfter.toNumber() + 
                           result.summary.resultConsumedAfter.toNumber(),
              timestamp: new Date().toISOString()
            })
          }]
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error('❌ MCP Neo4j query failed:', error.message);
      return {
        isError: true,
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
            cypher: cypher,
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
  }
);

// Tool: ollama.generate (reusing existing LLM converter)
server.registerTool(
  "ollama.generate",
  "Convert natural language queries to Cypher using Ollama LLM with QMS schema context",
  {
    type: "object",
    properties: {
      query: { type: "string", minLength: 1 }
    },
    required: ["query"]
  },
  async ({ query }) => {
    try {
      console.log(`🤖 Converting NL to Cypher via MCP: "${query}"`);
      
      // Reuse existing LLM converter
      const result = await llmConverter.convertToCypher(query);
      
      if (result.success) {
        console.log(`✅ MCP Cypher generation successful: ${result.cypher}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              cypher: result.cypher,
              query: query,
              duration: result.duration,
              timestamp: result.timestamp
            })
          }]
        };
      } else {
        console.error('❌ MCP Cypher generation failed:', result.error);
        return {
          isError: true,
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: result.error,
              query: query,
              duration: result.duration,
              timestamp: result.timestamp
            })
          }]
        };
      }
    } catch (error) {
      console.error('❌ MCP Ollama generation failed:', error.message);
      return {
        isError: true,
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
            query: query,
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
  }
);

// Streamable HTTP transport with sessions & CORS
const app = express();
app.use(express.json());

const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true,
  allowedHeaders: ["Content-Type", "mcp-session-id"] 
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'QMS MCP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    },
    tools: ['neo4j.query', 'ollama.generate']
  });
});

// Store active MCP transports by session ID
const transports = new Map();

app.all("/mcp", async (req, res) => {
  let sessionId = req.headers["mcp-session-id"];
  
  if (!sessionId) {
    sessionId = randomUUID();
    console.log(`🆔 New MCP session created: ${sessionId}`);
    res.setHeader("mcp-session-id", sessionId);
  }

  let transport = transports.get(sessionId);
  
  if (!transport) {
    transport = new StreamableHTTPServerTransport(res);
    transports.set(sessionId, transport);
    console.log(`🔗 New MCP transport created for session: ${sessionId}`);
    
    // Clean up transport when session ends
    transport.onclose = () => {
      transports.delete(sessionId);
      console.log(`🧹 MCP session cleaned up: ${sessionId}`);
    };
    
    // Connect the server to this transport (access underlying server)
    await server.server.connect(transport);
  }

  // Handle the MCP request
  try {
    await transport.handleRequest(req);
  } catch (error) {
    console.error('❌ MCP request handling error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'MCP request handling failed' });
    }
  }
});

// List active sessions endpoint (for debugging)
app.get('/sessions', (req, res) => {
  res.json({
    activeSessions: Array.from(transports.keys()),
    count: transports.size,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown (reusing existing pattern)
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down MCP server gracefully...');
  
  // Close all active transports
  for (const [sessionId, transport] of transports) {
    console.log(`🔌 Closing MCP session: ${sessionId}`);
    await transport.close();
  }
  
  // Close Neo4j driver
  await neo.close();
  console.log('✅ MCP server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down MCP server gracefully...');
  
  // Close all active transports
  for (const [sessionId, transport] of transports) {
    console.log(`🔌 Closing MCP session: ${sessionId}`);
    await transport.close();
  }
  
  // Close Neo4j driver
  await neo.close();
  console.log('✅ MCP server shutdown complete');
  process.exit(0);
});

const port = Number(process.env.MCP_PORT || 7400);
app.listen(port, () => {
  console.log('🚀 QMS MCP Server started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server: http://localhost:${port}`);
  console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📊 Sessions: http://localhost:${port}/sessions`);
  console.log('=' .repeat(50));
  console.log('🔧 Available Tools:');
  console.log('  📊 neo4j.query - Execute read-only Cypher queries');
  console.log('  🤖 ollama.generate - Convert natural language to Cypher');
  console.log('=' .repeat(50));
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`📡 Neo4j: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
  console.log(`🧠 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  console.log('=' .repeat(50));
});

export default app;

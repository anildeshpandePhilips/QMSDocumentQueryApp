# MCP Server Build Plan — Agent Task File

**Goal**: Implement a local MCP server (TypeScript) that enhances the existing QMS Document Query App. The MCP server will expose `neo4j.query` (read‑only) and `ollama.generate` tools, working alongside the current Express API and React frontend. This provides an alternative MCP-based query path while preserving the existing REST API.

---

## Phase 0 — Prereqs & Current Architecture Analysis

**Current Architecture (Working)**
- ✅ **Express API** (`src/server.js`) - Port 3001, handles `/ask` endpoint
- ✅ **React Frontend** (`client/`) - Port 5173, Vite-based TypeScript app  
- ✅ **LLM Integration** (`src/llm-to-cypher.js`) - Ollama llama3.2 for NL→Cypher
- ✅ **Neo4j Database** - Running on bolt://localhost:7687
- ✅ **Dependencies** - ES modules, Zod validation, CORS enabled

**Target Enhanced Layout** (preserve existing structure)

```
QMSDocumentQueryApp/ (workspace root)
├── src/
│   ├── server.js           # existing Express API (unchanged)
│   ├── llm-to-cypher.js    # existing LLM logic (reused)
│   └── mcp-server.js       # NEW: MCP server
├── client/                 # existing React app (enhanced)
├── docs/                   # existing docs
├── prompts/                # existing system prompts (reused)
└── package.json            # existing, add MCP deps
```

**Environment Variables** (update existing `.env`)

```
# Existing variables (keep as-is)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j  
NEO4J_PASSWORD=password
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2:3b

# New MCP variables
MCP_PORT=7400
MCP_ALLOWED_ORIGINS=http://localhost:5173
```

**Documentation Organization**
- All MCP-related documentation goes in `docs/features/mcp/` folder
- Phase completion documents: `PHASE_X_COMPLETE.md` in the mcp folder
- Implementation instructions remain in `mcp_implementation_instructions.md`
- Preserve existing `docs/` structure for non-MCP documentation

---

## Phase 1 — Add MCP Dependencies to Existing Package

**Update Root Package** (`package.json`)

Add MCP dependencies to your existing package.json:

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5", 
    "express": "^5.1.0",
    "neo4j-driver": "^5.24.0",
    "zod": "^3.22.4",
    "@modelcontextprotocol/sdk": "^0.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "typescript": "^5.4.5"
  }
}
```

**Add TypeScript Config** (`tsconfig.json`)

Create a TypeScript config for the MCP server:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022", 
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "client"]
}
```

**Installation Steps**

1. `npm install @modelcontextprotocol/sdk typescript`
2. Update scripts in package.json:
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "node --watch src/server.js", 
     "mcp": "node --watch src/mcp-server.js",
     "build:mcp": "tsc src/mcp-server.ts --outDir dist",
     "test": "node src/test-llm-cypher.js",
     "test:api": "node src/test-api.js",
     "test:e2e": "node test-e2e.js",
     "llm": "node src/llm-to-cypher.js",
     "client": "cd client && npm run dev",
     "client:build": "cd client && npm run build"
   }
   ```

---

## Phase 2 — Implement MCP Server Using Existing Components

**Create** `src/mcp-server.js` (reusing your existing LLM logic)

```javascript
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
const server = new McpServer({ name: "qms-neo4j-ollama-mcp", version: "1.0.0" });

// Tool: neo4j.query (read-only, reusing existing validation)
server.registerTool(
  "neo4j.query",
  {
    title: "Execute read-only Cypher query",
    description: "Run MATCH/RETURN Cypher queries against QMS Neo4j database",
    inputSchema: {
      type: "object",
      properties: {
        cypher: { type: "string", minLength: 1 },
        params: { type: "object", additionalProperties: true }
      },
      required: ["cypher"]
    }
  },
  async ({ cypher, params = {} }) => {
    try {
      // Reuse existing security validation from llm-to-cypher.js
      const dangerousPatterns = /\b(CREATE|DELETE|SET|REMOVE|MERGE|DROP)\b/i;
      if (dangerousPatterns.test(cypher)) {
        return { 
          content: [{ type: "text", text: "Error: Only read-only queries are allowed" }], 
          isError: true 
        };
      }

      if (!cypher.toLowerCase().includes('return')) {
        return { 
          content: [{ type: "text", text: "Error: Query must include RETURN statement" }], 
          isError: true 
        };
      }

      const session = neo.session({ defaultAccessMode: neo4j.session.READ });
      const startTime = Date.now();
      
      try {
        const result = await session.run(cypher, params);
        const data = result.records.map(record => record.toObject());
        const executionTime = Date.now() - startTime;
        
        const response = {
          success: true,
          cypher,
          data,
          count: data.length,
          executionTime,
          timestamp: new Date().toISOString()
        };
        
        return { content: [{ type: "text", text: JSON.stringify(response) }] };
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error('❌ Neo4j query error:', error.message);
      return { 
        content: [{ type: "text", text: `Database error: ${error.message}` }], 
        isError: true 
      };
    }
  }
);

// Tool: ollama.generate (reusing existing LLM converter)
server.registerTool(
  "ollama.generate",
  {
    title: "Generate Cypher from natural language",
    description: "Convert natural language to Cypher using Ollama LLM",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", minLength: 1 },
        model: { type: "string", default: "llama3.2:latest" }
      },
      required: ["prompt"]
    }
  },
  async ({ prompt, model = "llama3.2:latest" }) => {
    try {
      console.log(`🤖 Processing NL query via MCP: "${prompt}"`);
      const result = await llmConverter.convertToCypher(prompt);
      
      if (result.success) {
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } else {
        return { 
          content: [{ type: "text", text: `LLM error: ${result.error}` }], 
          isError: true 
        };
      }
    } catch (error) {
      console.error('❌ Ollama error:', error.message);
      return { 
        content: [{ type: "text", text: `LLM processing error: ${error.message}` }], 
        isError: true 
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
  exposedHeaders: ["Mcp-Session-Id"], 
  allowedHeaders: ["Content-Type", "mcp-session-id"] 
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'QMS MCP Server',
    endpoints: ['/mcp', '/health']
  });
});

const transports = new Map();

app.all("/mcp", async (req, res) => {
  let sessionId = req.headers["mcp-session-id"];
  
  if (!sessionId) {
    sessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionId,
      enableDnsRebindingProtection: true,
      allowedHosts: ["127.0.0.1", "localhost"]
    });
    transports.set(sessionId, transport);
    res.setHeader("Mcp-Session-Id", sessionId);
    await server.connect(transport);
  }
  
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.handleRequest(req, res, req.body);
  } else {
    res.status(400).json({ error: "Invalid session" });
  }
});

// Graceful shutdown (reusing existing pattern)
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down MCP server gracefully...');
  await neo.close();
  process.exit(0);
});

const port = Number(process.env.MCP_PORT || 7400);
app.listen(port, () => {
  console.log(`🚀 QMS MCP Server running on http://localhost:${port}`);
  console.log(`📊 Neo4j: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
  console.log(`🤖 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
});
```

### Implementation Notes

- **Reuses existing** `LLMToCypherConverter` class - no duplication
- **Maintains same security** validation as existing API
- **Preserves response format** from existing `/ask` endpoint  
- **Uses existing** environment variables and Neo4j driver setup
- **Follows existing** error handling and logging patterns

---

## Phase 3 — Enhance React Client with MCP Support

**Create** `client/src/mcp.ts` (new MCP client integration)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let mcpClient: Client | null = null;

export async function getMcpClient(): Promise<Client> {
  if (!mcpClient) {
    mcpClient = new Client({ name: "qms-react-ui", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL("http://localhost:7400/mcp")
    );
    await mcpClient.connect(transport);
  }
  return mcpClient;
}

export async function queryViaMcp(naturalLanguage: string) {
  const client = await getMcpClient();
  
  // First, convert NL to Cypher using MCP
  const llmResult = await client.callTool({
    name: "ollama.generate",
    arguments: { 
      prompt: naturalLanguage,
      model: "llama3.2:latest"
    }
  });
  
  const llmResponse = JSON.parse(llmResult.content[0].text || "{}");
  
  if (!llmResponse.success) {
    throw new Error(llmResponse.error || "Failed to generate Cypher");
  }
  
  // Then execute the Cypher via MCP
  const cypherResult = await client.callTool({
    name: "neo4j.query",
    arguments: { 
      cypher: llmResponse.cypher 
    }
  });
  
  return JSON.parse(cypherResult.content[0].text || "{}");
}

export async function queryDirectCypher(cypher: string, params: Record<string, any> = {}) {
  const client = await getMcpClient();
  
  const result = await client.callTool({
    name: "neo4j.query",
    arguments: { cypher, params }
  });
  
  return JSON.parse(result.content[0].text || "{}");
}
```

**Update** `client/src/App.tsx` (add MCP query option)

```typescript
import { useState } from 'react'
import './App.css'
import { queryViaMcp } from './mcp'

interface QueryResult {
  success: boolean
  query: string
  cypher: string
  data: any[]
  count: number
  executionTime: number
  timestamp: string
  error?: string
  message?: string
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queryMethod, setQueryMethod] = useState<'rest' | 'mcp'>('rest')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      let data: QueryResult;
      
      if (queryMethod === 'mcp') {
        // Use MCP path
        console.log('🔗 Querying via MCP...');
        data = await queryViaMcp(query.trim());
      } else {
        // Use existing REST API path
        console.log('🌐 Querying via REST API...');
        const response = await fetch('http://localhost:3001/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: query.trim() }),
        })

        data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || 'An error occurred')
        }
      }
      
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  // Add query method toggle in your form
  const renderQueryMethodToggle = () => (
    <div className="query-method-toggle">
      <label>
        <input
          type="radio"
          value="rest"
          checked={queryMethod === 'rest'}
          onChange={(e) => setQueryMethod(e.target.value as 'rest' | 'mcp')}
        />
        REST API
      </label>
      <label>
        <input
          type="radio"
          value="mcp"
          checked={queryMethod === 'mcp'}
          onChange={(e) => setQueryMethod(e.target.value as 'rest' | 'mcp')}
        />
        MCP
      </label>
    </div>
  )

  // Rest of your existing component code...
  // Insert renderQueryMethodToggle() in your form
}
```

### Implementation Strategy

- **Dual Query Paths**: Users can choose between REST API or MCP
- **Preserves Existing**: REST API continues to work unchanged
- **Same Response Format**: Both paths return identical `QueryResult` structure
- **Gradual Migration**: Teams can test MCP without breaking existing functionality

---

## Phase 4 — Optional: Containerize MCP Server

**Create** `Dockerfile.mcp` (separate from main app)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY src/ ./src/
COPY prompts/ ./prompts/
COPY .env ./
RUN npm install

# Runtime stage  
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prompts ./prompts
COPY --from=build /app/.env ./
COPY --from=build /app/package.json ./
RUN adduser -D -u 10001 nodeuser
USER nodeuser
EXPOSE 7400
CMD ["node", "src/mcp-server.js"]
```

**Add to docker-compose.yml** (extend existing setup)

```yaml
version: '3.8'
services:
  # Existing services (neo4j, ollama, etc.)
  
  qms-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USERNAME=${NEO4J_USERNAME}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - OLLAMA_URL=http://ollama:11434/api/generate
    depends_on:
      - neo4j
      - ollama

  qms-mcp:
    build:
      context: .
      dockerfile: Dockerfile.mcp
    ports:
      - "7400:7400"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USERNAME=${NEO4J_USERNAME}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - OLLAMA_URL=http://ollama:11434/api/generate
      - MCP_PORT=7400
      - MCP_ALLOWED_ORIGINS=http://localhost:5173
    depends_on:
      - neo4j
      - ollama

  qms-client:
    build: ./client
    ports:
      - "5173:5173"
    depends_on:
      - qms-api
      - qms-mcp
```

### Container Benefits

- **Isolated MCP Service**: Runs independently from main API
- **Same Dependencies**: Reuses existing Neo4j and Ollama containers
- **Environment Parity**: Same environment variables across services
- **Easy Scaling**: Can run multiple MCP instances if needed

---

## Phase 5 — Testing & Metrics

**Update Test Scripts**

Add MCP tests to your existing test suite:

```javascript
// Add to test-e2e.js
async function testMCPEndpoint() {
  console.log('🧪 Testing MCP Server...');
  
  // Test health endpoint
  const healthResponse = await fetch('http://localhost:7400/health');
  if (healthResponse.ok) {
    console.log('✅ MCP health check passed');
  } else {
    console.log('❌ MCP health check failed');
    return false;
  }
  
  // Test MCP endpoint (basic connectivity)
  const mcpResponse = await fetch('http://localhost:7400/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  if (mcpResponse.ok) {
    console.log('✅ MCP endpoint accessible');
  } else {
    console.log('❌ MCP endpoint failed');
    return false;
  }
  
  return true;
}
```

**Add MCP-specific npm scripts**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "mcp": "node --watch src/mcp-server.js",
    "test": "node src/test-llm-cypher.js",
    "test:api": "node src/test-api.js", 
    "test:mcp": "node test-mcp.js",
    "test:e2e": "node test-e2e.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run mcp\" \"npm run client\"",
    "client": "cd client && npm run dev"
  }
}
```

### Success Metrics

- ✅ **MCP Health Check**: `GET /health` returns 200
- ✅ **MCP Connectivity**: `POST /mcp` establishes session
- ✅ **Tool Execution**: Both `neo4j.query` and `ollama.generate` work
- ✅ **React Integration**: Can switch between REST and MCP seamlessly
- ✅ **Response Consistency**: Both paths return identical response format

---

## Phase 6 — Testing Steps

### Quick Health Check

```bash
# Test MCP server health
curl -s http://localhost:7400/health

# Test MCP session creation
curl -s -X POST http://localhost:7400/mcp \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### End-to-End Testing

1. **Start all services**:
   ```bash
   # Terminal 1: Backend API
   npm run dev
   
   # Terminal 2: MCP Server  
   npm run mcp
   
   # Terminal 3: Frontend
   npm run client
   ```

2. **Test both query paths**:
   - Open http://localhost:5173
   - Try same query with "REST API" selected
   - Try same query with "MCP" selected
   - Verify identical results

3. **Performance comparison**:
   - Compare execution times between REST and MCP paths
   - Verify MCP doesn't add significant overhead

---

## Implementation Summary

### What This Adds to Your Existing App

- ✅ **MCP Server**: New `src/mcp-server.js` alongside existing API
- ✅ **Dual Query Paths**: Users can choose REST or MCP in UI
- ✅ **Code Reuse**: Leverages existing `LLMToCypherConverter` and validation
- ✅ **Zero Breaking Changes**: Existing REST API continues unchanged
- ✅ **Same Security Model**: Read-only Cypher enforcement maintained
- ✅ **Familiar Patterns**: Follows your existing error handling and logging

### Architecture After Implementation

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   Neo4j DB      │  
│  localhost:5173 │◄──►│ localhost:3001  │◄──►│ localhost:7687  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                       │
         │              ┌─────────────────┐               │
         └─────────────►│   MCP Server    │◄──────────────┘
                        │ localhost:7400  │
                        └─────────────────┘
                                │
                        ┌─────────────────┐
                        │     Ollama      │
                        │ localhost:11434 │
                        └─────────────────┘
```

### Ready for Production

- **Environment Variables**: All configurable via `.env`
- **Docker Support**: Can be containerized alongside existing services  
- **Monitoring**: Health checks and metrics available
- **Security**: Same read-only validation as existing API
- **Testing**: Integrated with your existing test suite


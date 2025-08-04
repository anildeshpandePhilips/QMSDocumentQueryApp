# AI Coding Agent Instructions

## Architecture Overview

This is a **Schema-Aware NL2Cypher System** with three core components:
- **React Frontend** (`client/`) - TypeScript/Vite app on port 5173
- **Express API** (`src/server.js`) - Node.js backend on port 3001  
- **LLM Integration** (`src/llm-to-cypher.js`) - Ollama llama3.2 for NL→Cypher conversion

**Data Flow:** Natural Language → LLM (with schema context) → Cypher Query → Neo4j → Results

## Critical Development Patterns

### Schema-First Query Generation
The system prompt in `prompts/system.txt` contains complete Neo4j schema (Document:140, Training:41, TrainingPlan:4 nodes). When modifying query logic:
- Always validate against the actual schema in the prompt file
- Use Zod validation (`CypherResponseSchema`) in `llm-to-cypher.js`
- Test with `npm run test` before deploying changes

### Security Model: Read-Only Cypher
- **NEVER** allow CREATE, DELETE, SET, REMOVE operations
- Validation happens in `extractCypherQuery()` method using regex patterns
- Use `MATCH/RETURN/WHERE/ORDER BY/LIMIT` only
- Example safe pattern: `MATCH (d:Document) RETURN d.name LIMIT 10`

### Error Handling Conventions
```javascript
// Backend pattern (src/server.js)
try {
  // operation
} catch (error) {
  console.error('❌ Operation failed:', error.message);
  return res.status(500).json({ error: 'Internal server error', details: error.message });
}

// Frontend pattern (client/src/App.tsx)
if (response.ok && data.success) {
  setResults(data);
} else {
  setError(data.error || data.message || 'An error occurred');
}
```

## Development Workflow

### Testing Strategy
- **Unit Tests:** `npm run test` (tests LLM conversion)
- **API Tests:** `npm run test:api` (tests Express endpoints)
- **E2E Tests:** `npm run test:e2e` (full system integration)
- **Manual Testing:** Use sample queries from `docs/DATABASE_ANALYSIS.md`

### Startup Dependencies (Critical Order)
1. **Neo4j** must be running on `bolt://localhost:7687` FIRST
2. **Ollama** with `llama3.2:latest` model loaded
3. **Backend:** `npm run dev` (starts with --watch for hot reload)
4. **Frontend:** `npm run client` (Vite dev server)

### Development Scripts
```bash
# Backend development (auto-restart)
npm run dev

# Frontend development  
npm run client

# Test LLM conversion directly
npm run llm "show me all documents"

# Full system health check
curl http://localhost:3001/health
```

## Integration Points

### LLM Configuration
- Model: `llama3.2:latest` (hardcoded in `CONFIG` object)
- Endpoint: `http://localhost:11434/api/generate`
- Timeout: No explicit timeout set (consider adding for production)
- Response format: Expects JSON with `cypher` field

### Neo4j Connection
- Uses `neo4j-driver` with basic auth
- Environment variables: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`  
- Connection pooling handled automatically by driver
- Session management: One session per query (stateless)

### Frontend-Backend Contract
```typescript
// Request format
{ query: string }

// Response format (successful)
{
  success: true,
  query: string,
  cypher: string,
  data: any[],
  count: number,
  executionTime: number,
  timestamp: string
}
```

## Project-Specific Conventions

### File Organization
- **Backend logic:** All in `src/` directory (ES modules)
- **Prompts:** Store system prompts in `prompts/` directory
- **Documentation:** Organized in `docs/` with step-by-step guides
- **Tests:** Co-located with source files (`test-*.js` pattern)

### Code Style Patterns
- **ES Modules:** Use `import/export`, not `require()`
- **Console Logging:** Use emoji prefixes (`✅`, `❌`, `📝`) for visual parsing
- **Error Messages:** Include context and actionable information
- **Async/Await:** Preferred over Promises for readability

### Environment Configuration
Default values are development-friendly:
- Neo4j: `bolt://localhost:7687` with `neo4j/password`
- Express: Port 3001 with CORS enabled for localhost:5173
- Ollama: Assumes local installation on standard port 11434

### Dependency Management for AI Agents
- **WARN, don't auto-install**: Alert users about missing dependencies
- Check for Ollama with `ollama list | grep llama3.2`
- Verify Neo4j connection with health check before suggesting changes
- Point to `docs/STARTUP_PROCEDURES.md` for manual setup steps

## Known Integration Challenges

1. **Ollama Model Loading:** llama3.2 must be pulled before first use
2. **Neo4j Authentication:** Default password must be changed from 'neo4j'
3. **CORS Configuration:** Frontend/backend on different ports requires explicit CORS setup
4. **Query Timeout:** Long-running Cypher queries can timeout (no current handling)

## When Making Changes

- **Schema Changes:** Update `prompts/system.txt` first, then test LLM output
- **API Changes:** Update TypeScript interfaces in `client/src/App.tsx`
- **Security Changes:** Test with malicious inputs using `npm run test:api`
- **Performance Changes:** Monitor query execution times in logs

## Common Query Patterns & Edge Cases

### Typical Query Patterns
```cypher
// Count queries
MATCH (d:Document) RETURN count(d) as total

// Property searches (case-insensitive)
MATCH (t:Training) WHERE toLower(t.name) CONTAINS toLower('safety') RETURN t

// Multi-node queries with relationships
MATCH (d:Document)-[r]-(t:Training) RETURN d.name, type(r), t.name

// Sorting and limiting
MATCH (d:Document) RETURN d.name ORDER BY d.name ASC LIMIT 10
```

### Edge Cases to Handle
1. **Empty Results:** Always return meaningful messages, not just `[]`
2. **Case Sensitivity:** Use `toLower()` for text searches
3. **Null Properties:** Handle missing `code` or `name` fields gracefully
4. **Large Result Sets:** Always include `LIMIT` clause for performance
5. **Relationship Discovery:** Use `MATCH (a)-[r]-(b) RETURN type(r)` to explore connections

### Query Validation Patterns
```javascript
// In llm-to-cypher.js - extractCypherQuery method
const dangerousPatterns = /\b(CREATE|DELETE|SET|REMOVE|MERGE|DROP)\b/i;
if (dangerousPatterns.test(cypherQuery)) {
  throw new Error('Only read-only queries are allowed');
}
```

### Sample User Questions & Expected Cypher
- **"How many training sessions are there?"** → `MATCH (t:Training) RETURN count(t) as count`
- **"Find ISO documents"** → `MATCH (d:Document) WHERE toLower(d.name) CONTAINS 'iso' RETURN d`
- **"What training relates to safety?"** → `MATCH (t:Training) WHERE toLower(t.summary) CONTAINS 'safety' OR toLower(t.name) CONTAINS 'safety' RETURN t`

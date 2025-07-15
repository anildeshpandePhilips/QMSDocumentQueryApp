# Recommended Build Order: LLM-powered Neo4j Query App

This document outlines the logical order for building the LLM-powered Natural Language to Neo4j Query application based on the project goals.

---

## 🎯 Build Strategy: Walking Skeleton Approach

Build a minimal end-to-end system first, then enhance incrementally. This approach ensures you have a working foundation before adding complexity.

---

## 📋 Phase 0: MCP Integration Setup (Optional but Recommended)

### 0. **Neo4j MCP Server Setup** 🔹
**Priority: HIGH - Accelerates Development**

- [ ] Configure Claude Desktop with Neo4j MCP server (see `NEO4J_MCP_SETUP.md`)
- [ ] Test MCP connection with `get-neo4j-schema` tool
- [ ] Verify read/write Cypher query capabilities

**Why Early:** Provides direct database access in Claude Desktop for schema exploration and query testing.

---

## 📋 Phase 1: Foundation (Core Data & Logic)

### 1. **Step 1: Graph Schema Setup** 🔹
**Priority: CRITICAL - Build First**

- [ ] Define node labels, relationships, and properties for your domain
- [ ] Create a read-only database role in Neo4j
- [ ] Export schema summary to JSON or text
- [ ] Seed Neo4j with test data (10–50 nodes)
- [ ] *Use MCP tools to validate schema if configured*

**Why First:** Having real graph data makes all subsequent testing meaningful and concrete.

---

### 2. **Step 2: LLM-to-Cypher Script (No UI)** 🔹
**Priority: CRITICAL - Core Logic**

- [ ] Write a Node script that:
  - [ ] Loads a system prompt from `prompts/system.txt` with schema and examples
  - [ ] Calls Ollama (`http://localhost:11434/api/generate`)
  - [ ] Parses returned `{ "cypher": "MATCH ... RETURN ..." }`
  - [ ] Validates with JSON schema or Zod

**Why Second:** Prove the core translation logic works independently before adding API layers.

---

## 📋 Phase 2: API & Interface (Service Layer)

### 3. **Step 3: Express Service Layer** 🔹
**Priority: HIGH - Backend Foundation**

- [ ] Create `POST /ask` endpoint
  - [ ] Accepts `{ query: string }`
  - [ ] Calls Ollama with prompt + NL query
  - [ ] Validates response → extracts Cypher
  - [ ] Uses `neo4j-driver` to run Cypher
  - [ ] Returns results as JSON array

**Why Third:** Creates a stable contract between frontend and backend systems.

---

### 4. **Step 4: React Frontend** 🔹
**Priority: HIGH - User Interface**

- [ ] Scaffold: `npm create vite@latest client --template react-ts`
- [ ] Input box for NL query
- [ ] On submit:
  - [ ] Fetch `POST /ask` → render table of results
- [ ] Add spinner/loading state

**Why Fourth:** Visual interface for testing and demonstration of the complete pipeline.

---

## 📋 Phase 3: Security & Validation (Early Hardening)

### 5. **Step 7: Hardening** 🔹
**Priority: HIGH - Security First**

- [ ] Sanitize all LLM Cypher output:
  - [ ] Allow only `MATCH…RETURN` (no `CREATE`, `DELETE`, `MERGE`)
  - [ ] Reject queries without expected structure
- [ ] Log latency and full input/output for every request
- [ ] Add simple rate-limiter (e.g., `express-rate-limit`)

**Why Early:** Prevent security debt in core functionality. Much harder to retrofit security later.

---

## 📋 Phase 4: Enhancements (Polish & Features)

### 6. **Step 5: Optional Enhancements** 🔹
**Priority: MEDIUM - Value-Added Features**

- [ ] Use **LangChain-JS** `GraphCypherQAChain` to auto-handle:
  - [ ] Schema injection
  - [ ] Prompt templating
  - [ ] Cypher validation
- [ ] Add Ollama streaming:
  - [ ] Use `{ stream: true }` in request
  - [ ] Stream via SSE to React
- [ ] Use LLM again to summarize or explain graph results

**Why After Core:** These are architectural improvements to a working system.

---

## 📋 Phase 5: Integration & Deployment

### 7. **Step 6: MCP Agent Integration (Optional)** 🔹
**Priority: LOW - IDE Integration**

- [ ] Install MCP server (e.g., `@vscode/mcp`)
- [ ] Register tools:
  - [ ] `neo4j.query` → calls driver
  - [ ] `ollama.generate` → wraps LLM
- [ ] Register with VS Code Agent Mode for IDE integration

---

### 8. **Step 8: DevOps Ready** 🔹
**Priority: LOW - Production Readiness**

- [ ] Create `docker-compose.yml` to run:
  - [ ] Neo4j container
  - [ ] Ollama container or runtime
  - [ ] Node API server
- [ ] Optionally add nginx proxy and HTTPS
- [ ] Add `.env` and `README.md`

---

## 🎯 Milestone Checkpoints

| Phase | Milestone | Expected Time | Success Criteria |
|-------|-----------|---------------|------------------|
| 0 | MCP Setup Complete | 0.5 day | Claude can query Neo4j directly via MCP tools |
| 1 | Foundation Complete | 1 day | Can manually test NL→Cypher→Results |
| 2 | API & UI Complete | 1 day | End-to-end web application working |
| 3 | Security Added | 0.5 day | All queries sanitized and logged |
| 4 | Enhanced Features | 1+ day | Streaming, LangChain, or other polish |
| 5 | Production Ready | 0.5 day | Dockerized and deployable |

---

## 🚫 What NOT to Build First

- **Docker setup** - Adds complexity before proving the concept
- **Streaming** - Premature optimization
- **MCP integration** - Nice-to-have, not core functionality
- **Complex UI** - Start with basic input/output
- **Vector search** - Stretch goal, not MVP

---

## 🔄 Iterative Development Tips

1. **Test at each phase** - Don't move forward with broken foundations
2. **Keep commits small** - Each bullet point could be a commit
3. **Manual testing first** - Automate tests after core logic works
4. **Document as you go** - Update README with setup instructions
5. **Version your prompts** - Track what works for the LLM

---

## 🎯 Success Metrics

- **Phase 0 Success:** Claude Desktop can directly query your Neo4j database
- **Phase 1 Success:** Can ask "Show me all users" and get valid Cypher
- **Phase 2 Success:** Can use the web app end-to-end
- **Phase 3 Success:** Malicious queries are blocked
- **Phase 4 Success:** Enhanced user experience (streaming, summaries)
- **Phase 5 Success:** Can deploy anywhere with Docker

---

*This build order prioritizes proving the core concept first, then systematically adding layers of functionality and polish.*

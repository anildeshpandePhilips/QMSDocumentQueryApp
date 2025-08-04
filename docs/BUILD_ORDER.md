# Recommended Build Order: LLM-powered Neo4j Query App

T### 3. **Step 3: Express Service Layer** 🔹
**Priority: HIGH - Backend API** ✅ **DONE**

- [x] Create `POST /ask` endpoint
  - [x] Accepts `{ query: string }`
  - [x] Calls Ollama with prompt + NL query
  - [x] Validates response → extracts Cypher
  - [x] Uses `neo4j-driver` to run Cypher
  - [x] Returns results as JSON array

**Why Third:** Creates a stable contract between frontend and backend systems.t outlines the logical order for building the LLM-powered Natural Language to Neo4j Query application based on the project goals.

---

## 🎯 Build Strategy: Walking Skeleton Approach

Build a minimal end-to-end system first, then enhance incrementally. This approach ensures you have a working foundation before adding complexity.

---

## ✅ Phase 0: MCP Integration Setup (COMPLETED)

### 0. **Neo4j MCP Server Setup** 🔹
**Priority: HIGH - Accelerates Development** ✅ **DONE**

- [x] Configure Claude Desktop with Neo4j MCP server (see `NEO4J_MCP_SETUP.md`)
- [x] Test MCP connection with `get-neo4j-schema` tool
- [x] Verify read/write Cypher query capabilities
- [x] **Status: COMPLETED** - See `PHASE_0_COMPLETE.md` for details

**Why Early:** Provides direct database access in Claude Desktop for schema exploration and query testing.

---

## 📋 Phase 1: Foundation (Core Data & Logic)

### 1. **Step 1: Graph Schema Setup** 🔹
**Priority: CRITICAL - Build First**

- [x] Define node labels, relationships, and properties for your domain
- [x] Create a read-only database role in Neo4j
- [x] Export schema summary to JSON or text
- [x] Seed Neo4j with test data (10–50 nodes)
- [x] *Use MCP tools to validate schema if configured*

**Why First:** Having real graph data makes all subsequent testing meaningful and concrete.

---

### 2. **Step 2: LLM-to-Cypher Script (No UI)** 🔹
**Priority: CRITICAL - Core Logic** ✅ **DONE**

- [x] Write a Node script that:
  - [x] Loads a system prompt from `prompts/system.txt` with schema and examples
  - [x] Calls Ollama (`http://localhost:11434/api/generate`)
  - [x] Parses returned `{ "cypher": "MATCH ... RETURN ..." }`
  - [x] Validates with JSON schema or Zod
- [x] **Status: COMPLETED** - See `STEP_2_COMPLETE.md` for details

**Why Second:** Prove the core translation logic works independently before adding API layers.

---

## 📋 Phase 2: API & Interface (Service Layer)

### 3. **Step 3: Express Service Layer** 🔹
**Priority: HIGH - Backend Foundation** ✅ **COMPLETE**

- [x] Create `POST /ask` endpoint
  - [x] Accepts `{ query: string }`
  - [x] Calls Ollama with prompt + NL query
  - [x] Validates response → extracts Cypher
  - [x] Uses `neo4j-driver` to run Cypher
  - [x] Returns results as JSON array

**Why Third:** Creates a stable contract between frontend and backend systems.  
**Status:** ✅ **COMPLETED** - See `STEP_3_COMPLETE.md` for details

---

### 4. **Step 4: React Frontend** 🔹
**Priority: HIGH - User Interface** ✅ **COMPLETE**

- [x] Scaffold: `npm create vite@latest client --template react-ts`
- [x] Input box for NL query
- [x] On submit:
  - [x] Fetch `POST /ask` → render table of results
- [x] Add spinner/loading state

**Why Fourth:** Visual interface for testing and demonstration of the complete pipeline.  
**Status:** ✅ **COMPLETED** - See `STEP_4_COMPLETE.md` for details

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
| 0 | ✅ MCP Setup Complete | ✅ 0.5 day | ✅ Claude can query Neo4j directly via MCP tools |
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

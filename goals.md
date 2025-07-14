# Project Scaffold: LLM-powered NL → Neo4j Query App

This project creates a React + Node.js + Neo4j proof-of-concept that converts **natural language questions** into **Cypher queries** using a locally hosted **Ollama LLM**. The app includes a basic front-end, a backend orchestration layer, and optionally integrates with Visual Studio Code’s **MCP protocol**.

---

## ✅ Step 0: Prerequisites

- Neo4j (5.x Community Edition)
- Ollama installed and model pulled (e.g., `ollama pull llama3:8b-q4`)
- Node.js v18+
- pnpm or npm
- TypeScript
- Vite + React TypeScript template
- Zod or AJV for input validation

---

## 🔹 Step 1: Graph Schema Setup

- Define node labels, relationships, and properties
- Create a read-only database role in Neo4j
- Export schema summary to JSON or text
- Seed Neo4j with test data (10–50 nodes)

---

## 🔹 Step 2: LLM-to-Cypher Script (No UI)

- Write a Node script that:
  - Loads a system prompt from `prompts/system.txt` with schema and examples
  - Calls Ollama (`http://localhost:11434/api/generate`)
  - Parses returned `{ "cypher": "MATCH ... RETURN ..." }`
  - Validates with JSON schema or Zod

---

## 🔹 Step 3: Express Service Layer

- Create `POST /ask` endpoint
  - Accepts `{ query: string }`
  - Calls Ollama with prompt + NL query
  - Validates response → extracts Cypher
  - Uses `neo4j-driver` to run Cypher
  - Returns results as JSON array

---

## 🔹 Step 4: React Frontend

- Scaffold: `npm create vite@latest client --template react-ts`
- Input box for NL query
- On submit:
  - Fetch `POST /ask` → render table of results
- Add spinner/loading state

---

## 🔹 Step 5: Optional Enhancements

- Use **LangChain-JS** `GraphCypherQAChain` to auto-handle:
  - Schema injection
  - Prompt templating
  - Cypher validation

- Add Ollama streaming:
  - Use `{ stream: true }` in request
  - Stream via SSE to React

- Use LLM again to summarize or explain graph results

---

## 🔹 Step 6: MCP Agent Integration (Optional)

- Install MCP server (e.g., `@vscode/mcp`)
- Register tools:
  - `neo4j.query` → calls driver
  - `ollama.generate` → wraps LLM
- Register with VS Code Agent Mode for IDE integration

---

## 🔹 Step 7: Hardening

- Sanitize all LLM Cypher output:
  - Allow only `MATCH…RETURN` (no `CREATE`, `DELETE`, `MERGE`)
  - Reject queries without expected structure
- Log latency and full input/output for every request
- Add simple rate-limiter (e.g., `express-rate-limit`)

---

## 🔹 Step 8: DevOps Ready

- Create `docker-compose.yml` to run:
  - Neo4j container
  - Ollama container or runtime
  - Node API server
- Optionally add nginx proxy and HTTPS
- Add `.env` and `README.md`

---

## Stretch Goals

- GraphRAG with vector search in Neo4j
- LLM self-healing: Retry invalid Cypher
- Deployment: Fly.io, Render, or Docker on EC2

---

## Project Milestones

| Day | Milestone |
|-----|-----------|
| 0.5 | Seeded graph + LLM test |
| 0.5 | End-to-end Node script |
| 0.5 | REST API live |
| 0.5 | React UI working |
| +1  | Optional polish & dev tooling |


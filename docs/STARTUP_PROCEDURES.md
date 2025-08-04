# QMS Document Query App - Startup Procedures

## Overview
This document outlines the proper procedures to start and run the QMS Document Query Application, which consists of a Neo4j database, Express API backend, and React frontend.

## Prerequisites
1. **Neo4j Database**: Must be running on `bolt://localhost:7687`
2. **Node.js**: Version 20.18.0 or compatible
3. **Ollama**: With `llama3.2:latest` model installed
4. **Dependencies**: All npm packages installed

## Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express API    │    │   Neo4j DB      │
│  localhost:5173 │◄──►│ localhost:3001  │◄──►│ localhost:7687  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Ollama LLM    │
                        │ llama3.2:latest │
                        └─────────────────┘
```

## Startup Sequence

### Step 1: Start Neo4j Database
```bash
# Ensure Neo4j is running (varies by installation method)
# For Neo4j Desktop: Start from the application
# For standalone: neo4j start
```

### Step 2: Start Ollama Service
```bash
# Ensure Ollama is running with the required model
ollama serve
# In another terminal, verify model is available:
ollama list | grep llama3.2
```

### Step 3: Start Backend Express API
```bash
# From project root directory
cd /Users/anil/Documents/Neo4J/QMSDocumentQueryApp
node src/server.js &

# Verify backend is running
curl http://localhost:3001/health
# Expected response: {"status":"ok","timestamp":"...","service":"QMS Document Query API"}
```

### Step 4: Start Frontend React App
```bash
# From client directory
cd client
npm run dev

# This will start Vite dev server at http://localhost:5173
```

## Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-24T08:40:32.290Z",
  "service": "QMS Document Query API"
}
```

### 2. Test API Query Endpoint
```bash
curl -X POST http://localhost:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What documents are available?"}'
```

### 3. Frontend Access
- Open browser to `http://localhost:5173`
- Should see the QMS Document Query System interface
- Test the query form functionality

## Shutdown Procedures

### Stop Frontend
- In the terminal running `npm run dev`, press `Ctrl+C`

### Stop Backend
```bash
# Find the background process
ps aux | grep "node src/server.js"
# Kill the process (replace PID with actual process ID)
kill [PID]
# OR use pkill
pkill -f "node src/server.js"
```

### Stop Other Services
- Neo4j: Stop through Neo4j Desktop or `neo4j stop`
- Ollama: `pkill ollama` or stop the service

## Troubleshooting

### Backend Won't Start
1. Check if port 3001 is already in use: `lsof -i :3001`
2. Verify Neo4j is running and accessible
3. Check if Ollama service is running
4. Review server logs for specific error messages

### Frontend Won't Start
1. Check if port 5173 is already in use: `lsof -i :5173`
2. Ensure dependencies are installed: `npm install` in client directory
3. Check Node.js version compatibility

### API Queries Fail
1. Verify Neo4j connection in server logs
2. Check Ollama model availability: `ollama list`
3. Test individual components:
   - Neo4j connectivity
   - Ollama API response
   - MCP server functionality

## Development Commands

### Install Dependencies
```bash
# Backend (run from project root)
npm install

# Frontend (run from client directory)
cd client && npm install
```

### Testing
```bash
# Test MCP setup
./test_mcp_setup.sh

# Test LLM to Cypher conversion
node src/test-llm-cypher.js

# Test API endpoints
node src/test-api.js
```

## Port Configuration
- **Neo4j**: 7687 (bolt), 7474 (HTTP)
- **Express API**: 3001
- **React Frontend**: 5173
- **Ollama**: 11434 (default)

## Environment Variables
Currently using default configurations. For production, consider:
- `NEO4J_URI`: Database connection string
- `NEO4J_USER`: Database username
- `NEO4J_PASSWORD`: Database password
- `OLLAMA_HOST`: Ollama service URL
- `PORT`: Backend server port (default: 3001)

## Status: ✅ VERIFIED WORKING
- **Date**: July 24, 2025
- **Backend**: Successfully started and responding on port 3001
- **Frontend**: Successfully started on port 5173
- **Integration**: Full stack application operational

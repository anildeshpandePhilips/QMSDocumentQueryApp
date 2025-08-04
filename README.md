# QMS Document Query App

> **Natural Language to Neo4j Query System** - Convert plain English questions into Cypher queries for Quality Management System data exploration.

[![Neo4j](https://img.shields.io/badge/Neo4j-5.24.0-blue)](https://neo4j.com/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.18.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)

## 🎯 Overview

The QMS Document Query App is a **Natural Language to Cypher (NL2Cypher)** system that allows users to query a Neo4j Quality Management System database using plain English. Built with React, Express.js, and powered by Ollama LLM for intelligent query generation.

### 🏗️ Architecture

```
React Frontend → Express API → Ollama LLM → Neo4j Database
(localhost:5173)  (localhost:3001)  (llama3.2:latest)  (bolt://localhost:7687)
```

**Architecture Pattern:** **Schema-Aware NL2Cypher with Direct Execution**
- **Input**: Natural language questions
- **Processing**: LLM converts NL directly to Cypher using database schema
- **Execution**: Cypher runs against Neo4j database
- **Output**: Structured query results

## ✨ Features

- 🗣️ **Natural Language Queries** - Ask questions in plain English
- 🔍 **Intelligent Query Generation** - Converts NL to optimized Cypher queries
- 📊 **Real-time Results** - Instant database query execution
- 🎨 **Modern UI** - Responsive React interface with glass morphism design
- 🔒 **Security First** - Read-only queries with write operation blocking
- 📱 **Mobile Responsive** - Works on all device sizes
- ⚡ **Fast Performance** - Optimized query execution and caching

## 🚀 Quick Start

### Prerequisites

- **Neo4j Database** (v5.24.0+) running on `bolt://localhost:7687`
- **Node.js** (v20.18.0+)
- **Ollama** with `llama3.2:latest` model installed
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QMSDocumentQueryApp
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file in project root
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=password
   NEO4J_DATABASE=neo4j
   OLLAMA_URL=http://localhost:11434
   PORT=3001
   ```

### Running the Application

1. **Start Neo4j Database**
   ```bash
   # Ensure Neo4j is running on bolt://localhost:7687
   ```

2. **Start Ollama Service**
   ```bash
   ollama serve
   # Verify model is available
   ollama list | grep llama3.2
   ```

3. **Start Backend API**
   ```bash
   # From project root
   node src/server.js
   ```

4. **Start Frontend (in new terminal)**
   ```bash
   cd client
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## 📊 Database Schema

The system works with a Quality Management System database containing:

### Node Types
- **Document** (140 nodes) - Policies, procedures, manuals, work instructions
  - Properties: `code`, `name`
- **Training** (41 nodes) - Training sessions, courses, certifications
  - Properties: `code`, `name`, `summary`
- **TrainingPlan** (4 nodes) - Training curricula and programs
  - Properties: `code`, `name`

### Sample Queries
- "Show me all training plans"
- "How many documents are there?"
- "Find training sessions about safety"
- "List all ISO documents"

## 🛠️ Development

### Project Structure
```
QMSDocumentQueryApp/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── App.css        # Application styles
│   │   └── main.tsx       # React entry point
│   └── package.json
├── src/                   # Node.js backend
│   ├── server.js          # Express API server
│   ├── llm-to-cypher.js   # LLM integration module
│   ├── test-api.js        # API test suite
│   └── test-llm-cypher.js # LLM test script
├── prompts/
│   └── system.txt         # LLM system prompt with schema
├── docs/                  # Project documentation
└── package.json           # Backend dependencies
```

### Available Scripts

**Backend:**
```bash
npm start              # Start production server
npm run dev            # Start with file watching
npm run llm            # Test LLM conversion directly
npm test               # Run LLM test suite
npm run test:api       # Run API test suite
npm run test:e2e       # Run end-to-end tests
```

**Frontend:**
```bash
cd client
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

### Testing

**Backend API Testing:**
```bash
# Health check
curl http://localhost:3001/health

# Query endpoint
curl -X POST http://localhost:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all training plans"}'

# Run test suite
node src/test-api.js
```

**LLM Testing:**
```bash
# Test natural language to Cypher conversion
node src/test-llm-cypher.js
```

## 🔧 API Reference

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-24T08:40:32.290Z",
  "service": "QMS Document Query API"
}
```

### Query Endpoint
```http
POST /ask
Content-Type: application/json

{
  "query": "natural language question"
}
```

**Response:**
```json
{
  "success": true,
  "query": "Show me all training plans",
  "cypher": "MATCH (tp:TrainingPlan) RETURN tp.code, tp.name",
  "data": [
    {
      "tp.code": "TP-000022",
      "tp.name": "R&D - Software Engineering"
    }
  ],
  "count": 4,
  "executionTime": 2,
  "timestamp": "2025-07-16T..."
}
```

## 🔒 Security Features

- **Read-only Queries** - Blocks CREATE, DELETE, MERGE operations
- **Query Validation** - Validates Cypher syntax and structure
- **Input Sanitization** - Prevents injection attacks
- **CORS Configuration** - Controlled cross-origin access
- **Error Handling** - Secure error messages without data leakage

## 🎨 UI Features

- **Glass Morphism Design** - Modern backdrop blur effects
- **Purple Gradient Theme** - Professional color scheme
- **Responsive Layout** - Mobile-first design approach
- **Loading States** - Visual feedback during processing
- **Dynamic Tables** - Automatic result table generation
- **Error Handling** - User-friendly error messages

## 📈 Performance

- **API Response Time:** < 100ms (excluding LLM processing)
- **LLM Processing:** ~5-18 seconds (depends on query complexity)
- **Database Queries:** < 50ms average
- **Frontend Load Time:** < 500ms
- **Memory Usage:** ~59MB backend server

## 🔄 Development Workflow

### Phase 1: Foundation ✅
- [x] Neo4j MCP Server Setup
- [x] Database Schema Analysis
- [x] LLM-to-Cypher Script

### Phase 2: API & Interface ✅
- [x] Express Service Layer
- [x] React Frontend Implementation

### Phase 3: Security & Validation (Next)
- [ ] Query Sanitization Enhancement
- [ ] Request Logging
- [ ] Rate Limiting

### Phase 4: Enhancements (Future)
- [ ] LangChain Integration
- [ ] Streaming Responses
- [ ] Graph RAG Implementation

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
NEO4J_URI=bolt://production-host:7687
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-secure-password
PORT=3001
```

### Build for Production
```bash
# Build frontend
cd client
npm run build

# Start backend
npm start
```

### Docker Support (Coming Soon)
- Neo4j container configuration
- Multi-stage frontend build
- Production-ready compose file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

Detailed documentation available in `/docs`:
- `BUILD_ORDER.md` - Development phases and milestones
- `DATABASE_ANALYSIS.md` - Neo4j schema analysis
- `STARTUP_PROCEDURES.md` - Operational procedures
- `MCP_CONNECTION_CONFIRMED.md` - MCP integration details

## 🛠️ Troubleshooting

### Common Issues

**Backend won't start:**
1. Check if port 3001 is in use: `lsof -i :3001`
2. Verify Neo4j is running and accessible
3. Ensure Ollama service is running with llama3.2 model

**Frontend won't connect:**
1. Verify backend API is running on port 3001
2. Check CORS configuration
3. Confirm API endpoints are responding

**Queries returning errors:**
1. Test Ollama model availability: `ollama list`
2. Verify Neo4j database connection
3. Check query logs for Cypher syntax issues

### Support

For issues and questions:
1. Check existing documentation in `/docs`
2. Review test scripts in `/src`
3. Examine server logs for error details

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Neo4j** - Graph database platform
- **Ollama** - Local LLM inference
- **React** - Frontend framework
- **Express** - Backend framework
- **Vite** - Build tool and dev server

---

**Status:** ✅ **Production Ready** - Full-stack application operational with comprehensive testing
**Last Updated:** August 4, 2025

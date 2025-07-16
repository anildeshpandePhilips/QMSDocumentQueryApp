import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import neo4j from 'neo4j-driver';
import { LLMToCypherConverter } from './llm-to-cypher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

// Initialize LLM converter
const llmConverter = new LLMToCypherConverter();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'QMS Document Query API'
  });
});

// Main query endpoint
app.post('/ask', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query parameter is required and must be a non-empty string'
      });
    }

    console.log(`📝 Received query: "${query}"`);
    
    // Step 1: Convert natural language to Cypher using LLM
    console.log('🤖 Converting to Cypher...');
    const cypherResult = await llmConverter.convertToCypher(query);
    
    if (!cypherResult.success) {
      console.error('❌ LLM conversion failed:', cypherResult.error);
      return res.status(500).json({
        error: 'Query conversion failed',
        message: cypherResult.error,
        step: 'llm_conversion'
      });
    }

    const cypherQuery = cypherResult.cypher;
    console.log(`🔍 Generated Cypher: ${cypherQuery}`);
    
    // Step 2: Execute Cypher query against Neo4j
    console.log('📊 Executing query...');
    const session = driver.session();
    
    try {
      const result = await session.run(cypherQuery);
      const records = result.records.map(record => {
        // Convert Neo4j record to plain object
        const obj = {};
        record.keys.forEach(key => {
          const value = record.get(key);
          // Handle Neo4j types
          if (value && typeof value === 'object' && value.properties) {
            // Node or Relationship
            obj[key] = value.properties;
          } else if (value && typeof value === 'object' && value.low !== undefined) {
            // Neo4j Integer
            obj[key] = value.toNumber ? value.toNumber() : value.low;
          } else {
            obj[key] = value;
          }
        });
        return obj;
      });
      
      console.log(`✅ Query successful: ${records.length} records returned`);
      
      // Return successful response
      res.json({
        success: true,
        query: query,
        cypher: cypherQuery,
        data: records,
        count: records.length,
        executionTime: result.summary.resultAvailableAfter.toNumber() + 
                       result.summary.resultConsumedAfter.toNumber(),
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError) {
      console.error('❌ Database execution failed:', dbError.message);
      res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        cypher: cypherQuery,
        step: 'database_execution'
      });
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      step: 'general'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🔥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await driver.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await driver.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QMS Document Query API running on http://localhost:${PORT}`);
  console.log(`📊 Neo4j: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
  console.log(`🤖 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
});

export default app;

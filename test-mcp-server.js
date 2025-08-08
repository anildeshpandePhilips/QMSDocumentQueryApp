#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests the basic functionality of the MCP server
 */

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing MCP Server Implementation');
console.log('=====================================\n');

// Test 1: Check imports
console.log('📦 Test 1: Checking imports...');
try {
  const { LLMToCypherConverter } = await import('./src/llm-to-cypher.js');
  console.log('✅ LLM converter import successful');
} catch (error) {
  console.error('❌ LLM converter import failed:', error.message);
  process.exit(1);
}

try {
  // Test importing MCP SDK components
  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
  console.log('✅ MCP Server import successful');
} catch (error) {
  console.error('❌ MCP Server import failed:', error.message);
  process.exit(1);
}

try {
  const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
  console.log('✅ MCP Transport import successful');
} catch (error) {
  console.error('❌ MCP Transport import failed:', error.message);
  process.exit(1);
}

// Test 2: Check environment
console.log('\n🔧 Test 2: Checking environment...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else {
  console.warn('⚠️  .env file not found');
}

const requiredVars = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD', 'MCP_PORT'];
const missingVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`❌ ${varName} is missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
}

// Test 3: Try importing the MCP server
console.log('\n🚀 Test 3: Testing MCP server import...');
try {
  // Import but don't start the server
  const mcpModule = await import('./src/mcp-server.js');
  console.log('✅ MCP server module imported successfully');
} catch (error) {
  console.error('❌ MCP server import failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

console.log('\n🎉 All tests passed! MCP server implementation is ready.');
console.log('\n📝 Next steps:');
console.log('1. Start Neo4j: Make sure Neo4j is running on bolt://localhost:7687');
console.log('2. Start Ollama: Make sure Ollama is running with llama3.2 model');
console.log('3. Start MCP server: npm run mcp');
console.log('4. Test health check: curl http://localhost:7400/health');

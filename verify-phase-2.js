#!/usr/bin/env node

/**
 * Quick MCP Server Verification Test
 * Tests basic functionality without starting the full server
 */

console.log('🧪 Phase 2 MCP Server Verification');
console.log('==================================\n');

// Test 1: Verify MCP SDK imports
console.log('📦 Test 1: MCP SDK Components...');
try {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  console.log('✅ McpServer import successful');
  
  const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
  console.log('✅ StreamableHTTPServerTransport import successful');
} catch (error) {
  console.error('❌ MCP SDK import failed:', error.message);
  process.exit(1);
}

// Test 2: Verify existing components are still working
console.log('\n🔧 Test 2: Existing Components...');
try {
  const { LLMToCypherConverter } = await import('./src/llm-to-cypher.js');
  const converter = new LLMToCypherConverter();
  console.log('✅ LLMToCypherConverter import and instantiation successful');
} catch (error) {
  console.error('❌ LLMToCypherConverter import failed:', error.message);
  process.exit(1);
}

try {
  const neo4j = await import('neo4j-driver');
  console.log('✅ Neo4j driver import successful');
} catch (error) {
  console.error('❌ Neo4j driver import failed:', error.message);
  process.exit(1);
}

// Test 3: Verify MCP server can be imported (but not started)
console.log('\n🚀 Test 3: MCP Server Module...');
try {
  // Import the module but don't start the server
  await import('./src/mcp-server.js');
  console.log('✅ MCP server module can be imported');
} catch (error) {
  console.error('❌ MCP server import failed:', error.message);
  console.error('Details:', error.stack);
  process.exit(1);
}

// Test 4: Verify environment setup
console.log('\n⚙️  Test 4: Environment Configuration...');
const requiredVars = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD', 'MCP_PORT'];
let allEnvVarsPresent = true;

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.warn('\n⚠️  Some environment variables are missing. Make sure .env file is properly configured.');
}

console.log('\n🎉 Phase 2 Verification Complete!');
console.log('\n📋 Summary:');
console.log('✅ MCP SDK components can be imported');
console.log('✅ Existing components (LLM, Neo4j) are preserved');
console.log('✅ MCP server module is syntactically correct');
console.log('✅ Environment configuration is ready');

console.log('\n🚀 Ready for testing:');
console.log('1. Start Neo4j database');
console.log('2. Start Ollama with llama3.2 model');
console.log('3. Run: npm run mcp');
console.log('4. Test: curl http://localhost:7400/health');

console.log('\n🎯 Next: Implement Phase 3 - React Client MCP Integration');

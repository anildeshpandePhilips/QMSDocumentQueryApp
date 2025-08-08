// Test MCP Client Integration
// Run this test after starting the MCP server

console.log('🧪 Testing MCP Client Integration...');

async function testMcpClient() {
  try {
    // Test MCP health endpoint
    console.log('1. Testing MCP server health...');
    const healthResponse = await fetch('http://localhost:7400/health');
    const healthData = await healthResponse.json();
    console.log('✅ MCP server health:', healthData);

    // Import MCP client functions
    console.log('2. Testing MCP client import...');
    const mcpModule = await import('./client/src/mcp.js');
    console.log('✅ MCP module imported successfully');

    // Test direct Cypher query
    console.log('3. Testing direct Cypher query via MCP...');
    const directResult = await mcpModule.queryDirectCypher('MATCH (n) RETURN count(n) as totalNodes LIMIT 1');
    console.log('✅ Direct Cypher result:', directResult);

    // Test natural language query
    console.log('4. Testing natural language query via MCP...');
    const nlResult = await mcpModule.queryViaMcp('How many documents are there?');
    console.log('✅ NL query result:', nlResult);

    console.log('🎉 All MCP tests passed!');
    
  } catch (error) {
    console.error('❌ MCP test failed:', error.message);
    console.log('💡 Make sure to:');
    console.log('   - Start MCP server: npm run mcp');
    console.log('   - Start REST API: npm run dev');
    console.log('   - Ensure Neo4j is running');
    console.log('   - Ensure Ollama is running with llama3.2 model');
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMcpClient();
}

export { testMcpClient };

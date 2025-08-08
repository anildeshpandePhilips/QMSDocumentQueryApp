import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/http.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testMcpClient() {
  try {
    console.log('🔌 Testing MCP client connection...');
    
    const transport = new StreamableHTTPClientTransport(
      new URL('http://localhost:7400/mcp')
    );
    
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    await client.connect(transport);
    console.log('✅ Connected to MCP server');
    
    // Test ollama.generate tool
    console.log('🧠 Testing ollama.generate tool...');
    const llmResult = await client.callTool({
      name: "ollama.generate",
      arguments: { 
        query: "show me all documents"
      }
    });
    
    console.log('✅ LLM Result:', llmResult);
    
    // Test neo4j.query tool if LLM result has cypher
    if (llmResult.content && llmResult.content[0] && llmResult.content[0].text) {
      const cypherText = llmResult.content[0].text;
      console.log('🔍 Testing neo4j.query tool...');
      
      const dbResult = await client.callTool({
        name: "neo4j.query",
        arguments: { 
          cypher: cypherText
        }
      });
      
      console.log('✅ DB Result:', dbResult);
    }
    
    await client.close();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Start the server first, then test
import('./src/server.js').then(() => {
  console.log('🚀 Server started, waiting 2 seconds...');
  setTimeout(testMcpClient, 2000);
}).catch(error => {
  console.error('❌ Failed to start server:', error);
});

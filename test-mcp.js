#!/usr/bin/env node

/**
 * Test script for MCP Server functionality
 * Tests MCP server health and basic connectivity
 */

const MCP_BASE_URL = 'http://localhost:7400';

async function testMCPHealth() {
  console.log('🧪 Testing MCP Server Health...');
  console.log('================================\n');

  try {
    console.log('1. Testing MCP health endpoint...');
    const healthResponse = await fetch(`${MCP_BASE_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ MCP health check passed:', healthData.status);
      console.log('   Service:', healthData.service);
      console.log('   Endpoints:', healthData.endpoints);
    } else {
      console.log('❌ MCP health check failed:', healthResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP server not running. Please start with: npm run mcp');
    console.log('   Error:', error.message);
    return false;
  }

  console.log('\n2. Testing MCP endpoint connectivity...');
  try {
    const mcpResponse = await fetch(`${MCP_BASE_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (mcpResponse.ok || mcpResponse.status === 400) {
      // 400 is expected for empty body, means endpoint is accessible
      console.log('✅ MCP endpoint accessible');
      return true;
    } else {
      console.log('❌ MCP endpoint failed:', mcpResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP endpoint connection failed:', error.message);
    return false;
  }
}

// Run the test
testMCPHealth()
  .then(success => {
    if (success) {
      console.log('\n🎉 MCP server test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 MCP server test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });

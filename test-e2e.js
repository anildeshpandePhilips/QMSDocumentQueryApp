#!/usr/bin/env node

/**
 * End-to-End Test Script for QMS Document Query App
 * Tests the complete pipeline: React Frontend → Express API → Ollama → Neo4j
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}🧪 End-to-End Test: QMS Document Query App${colors.reset}`);
console.log(`${colors.cyan}================================================${colors.reset}\n`);

/**
 * Test if a service is running on a specific port
 */
async function testPort(port, serviceName) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} | grep LISTEN`);
    if (stdout.trim()) {
      console.log(`${colors.green}✅ ${serviceName} is running on port ${port}${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${serviceName} is NOT running on port ${port}${colors.reset}`);
    return false;
  }
}

/**
 * Test HTTP endpoint
 */
async function testEndpoint(url, expectedStatus = 200) {
  try {
    const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`);
    const status = parseInt(stdout.trim());
    
    if (status === expectedStatus) {
      console.log(`${colors.green}✅ ${url} responds with ${status}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ ${url} responds with ${status} (expected ${expectedStatus})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${url} is not accessible${colors.reset}`);
    return false;
  }
}

/**
 * Test API functionality
 */
async function testAPIQuery() {
  try {
    const query = "Show me all training plans";
    const payload = JSON.stringify({ query });
    
    const { stdout } = await execAsync(`curl -s -X POST -H "Content-Type: application/json" -d '${payload}' http://localhost:3001/ask`);
    
    const response = JSON.parse(stdout);
    
    if (response.success && response.data && response.cypher) {
      console.log(`${colors.green}✅ API Query successful: "${query}"${colors.reset}`);
      console.log(`${colors.blue}   Generated Cypher: ${response.cypher}${colors.reset}`);
      console.log(`${colors.blue}   Results: ${response.count} records${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ API Query failed: ${response.error || 'Unknown error'}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ API Query test failed: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.yellow}📋 Testing Infrastructure...${colors.reset}`);
  
  // Test 1: Check if services are running
  const reactRunning = await testPort(5173, 'React Dev Server');
  const apiRunning = await testPort(3001, 'Express API Server');
  const neo4jRunning = await testPort(7687, 'Neo4j Database');
  const ollamaRunning = await testPort(11434, 'Ollama LLM');
  
  console.log(`\n${colors.yellow}🌐 Testing HTTP Endpoints...${colors.reset}`);
  
  // Test 2: Test HTTP endpoints
  const reactEndpoint = await testEndpoint('http://localhost:5173');
  const apiHealth = await testEndpoint('http://localhost:3001/health');
  const neo4jEndpoint = await testEndpoint('http://localhost:7474');
  
  console.log(`\n${colors.yellow}🔧 Testing API Functionality...${colors.reset}`);
  
  // Test 3: Test API query functionality
  const apiQuery = await testAPIQuery();
  
  // Summary
  console.log(`\n${colors.magenta}${colors.bright}📊 Test Results Summary${colors.reset}`);
  console.log(`${colors.magenta}========================${colors.reset}`);
  
  const infraTests = [reactRunning, apiRunning, neo4jRunning, ollamaRunning];
  const endpointTests = [reactEndpoint, apiHealth, neo4jEndpoint];
  const functionalTests = [apiQuery];
  
  const allTests = [...infraTests, ...endpointTests, ...functionalTests];
  const passed = allTests.filter(Boolean).length;
  const total = allTests.length;
  
  console.log(`${colors.bright}Infrastructure: ${infraTests.filter(Boolean).length}/4 passing${colors.reset}`);
  console.log(`${colors.bright}HTTP Endpoints: ${endpointTests.filter(Boolean).length}/3 passing${colors.reset}`);
  console.log(`${colors.bright}API Functionality: ${functionalTests.filter(Boolean).length}/1 passing${colors.reset}`);
  console.log(`${colors.bright}Overall: ${passed}/${total} tests passing${colors.reset}`);
  
  if (passed === total) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! End-to-end system is working perfectly!${colors.reset}`);
    console.log(`${colors.green}✅ React Frontend: http://localhost:5173${colors.reset}`);
    console.log(`${colors.green}✅ Express API: http://localhost:3001${colors.reset}`);
    console.log(`${colors.green}✅ Complete pipeline: React → Express → Ollama → Neo4j${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Some tests failed. Please check the services above.${colors.reset}`);
    
    console.log(`\n${colors.yellow}💡 Quick Start Commands:${colors.reset}`);
    console.log(`${colors.yellow}  Backend: cd /path/to/project && node src/server.js${colors.reset}`);
    console.log(`${colors.yellow}  Frontend: cd /path/to/project/client && npm run dev${colors.reset}`);
    console.log(`${colors.yellow}  Neo4j: Make sure Neo4j is running on port 7687${colors.reset}`);
    console.log(`${colors.yellow}  Ollama: Make sure Ollama is running on port 11434${colors.reset}`);
  }
  
  return passed === total;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.red}Test runner failed: ${error.message}${colors.reset}`);
  process.exit(1);
});

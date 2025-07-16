#!/usr/bin/env node

/**
 * Test script for the Express API server
 * Tests the /ask endpoint with various queries
 */

const API_BASE_URL = 'http://localhost:3001';

// Test queries
const testQueries = [
  'Show me all training plans',
  'How many documents are there?',
  'Find all documents',
  'What training sessions do we have?'
];

/**
 * Test the API endpoint
 */
async function testAPI() {
  console.log('🧪 Testing QMS Document Query API');
  console.log('=====================================\n');

  // Test health endpoint
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.status);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Server not running. Please start with: npm start');
    console.log('   Error:', error.message);
    return;
  }

  console.log('\n2. Testing /ask endpoint...\n');

  // Test each query
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`Test ${i + 1}: "${query}"`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Success: Generated Cypher: ${data.cypher}`);
        console.log(`   Results: ${data.count} records found`);
        if (data.data && data.data.length > 0) {
          console.log(`   Sample result:`, JSON.stringify(data.data[0], null, 2));
        }
      } else {
        console.log(`❌ Failed: ${data.error}`);
        console.log(`   Message: ${data.message}`);
        if (data.cypher) {
          console.log(`   Generated Cypher: ${data.cypher}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test error handling
  console.log('3. Testing error handling...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '' }) // Empty query
    });

    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      console.log('✅ Error handling works: Empty query rejected');
    } else {
      console.log('❌ Error handling failed: Empty query should be rejected');
    }
  } catch (error) {
    console.log(`❌ Error test failed: ${error.message}`);
  }

  console.log('\n🎯 Testing complete!');
}

// Run the tests
testAPI().catch(console.error);

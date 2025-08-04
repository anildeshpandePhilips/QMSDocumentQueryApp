#!/usr/bin/env node

/**
 * Test script for LLM-to-Cypher converter
 * Tests various natural language queries
 */

import { LLMToCypherConverter } from './llm-to-cypher.js';

const TEST_QUERIES = [
  "Show me all training plans",
  "Find documents with 'safety' in the name", 
  "How many training sessions are there?",
  "List all training courses with summaries",
  "Show me the first 5 documents",
  "Find training plans about compliance",
  "What documents are available?",
  "Show training sessions ordered by name"
];

async function runTests() {
  console.log('🧪 Testing LLM-to-Cypher Converter');
  console.log('===================================\n');
  
  const converter = new LLMToCypherConverter();
  const results = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`\n📝 Test ${i + 1}/${TEST_QUERIES.length}: "${query}"`);
    console.log('-'.repeat(60));
    
    const result = await converter.convertToCypher(query);
    results.push({
      query: query,
      result: result
    });
    
    if (result.success) {
      console.log(`✅ Generated: ${result.cypher}`);
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    
    // Add delay between requests to be nice to Ollama
    if (i < TEST_QUERIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Queries:');
    failed.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.query}" - ${r.result.error}`);
    });
  }
  
  console.log('\n✅ Test run complete!');
}

// Run tests
runTests().catch(console.error);

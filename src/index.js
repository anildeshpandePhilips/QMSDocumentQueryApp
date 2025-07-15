#!/usr/bin/env node

/**
 * LLM-to-Cypher Script
 * Converts natural language queries to Neo4j Cypher using Ollama
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Zod schema for validating LLM response
const CypherResponseSchema = z.object({
  cypher: z.string().min(1, "Cypher query cannot be empty")
});

// Configuration
const CONFIG = {
  OLLAMA_URL: 'http://localhost:11434/api/generate',
  MODEL: 'llama3.2:latest',
  PROMPTS_DIR: './prompts',
  SYSTEM_PROMPT_FILE: 'system.txt'
};

class LLMToCypherConverter {
  constructor() {
    this.systemPrompt = this.loadSystemPrompt();
  }

  /**
   * Load system prompt from file
   */
  loadSystemPrompt() {
    try {
      const promptPath = path.join(CONFIG.PROMPTS_DIR, CONFIG.SYSTEM_PROMPT_FILE);
      const prompt = fs.readFileSync(promptPath, 'utf-8');
      console.log('✅ System prompt loaded successfully');
      return prompt;
    } catch (error) {
      console.error('❌ Error loading system prompt:', error.message);
      process.exit(1);
    }
  }

  /**
   * Call Ollama API with the natural language query
   */
  async callOllama(naturalLanguageQuery) {
    const payload = {
      model: CONFIG.MODEL,
      prompt: `${this.systemPrompt}\n\nUser: "${naturalLanguageQuery}"`,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for more consistent outputs
        top_p: 0.9
      }
    };

    try {
      console.log(`🤖 Calling Ollama with model: ${CONFIG.MODEL}`);
      console.log(`📝 Query: "${naturalLanguageQuery}"`);
      
      const response = await fetch(CONFIG.OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Ollama response received');
      
      return data.response;
    } catch (error) {
      console.error('❌ Error calling Ollama:', error.message);
      throw error;
    }
  }

  /**
   * Parse and validate the LLM response
   */
  parseLLMResponse(llmResponse) {
    try {
      console.log('🔍 Raw LLM Response:', llmResponse);
      
      // Try to extract JSON from the response
      let jsonMatch = llmResponse.match(/\{[^}]*"cypher"[^}]*\}/);
      
      if (!jsonMatch) {
        // Fallback: look for any JSON-like structure
        jsonMatch = llmResponse.match(/\{.*\}/s);
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const jsonString = jsonMatch[0];
      console.log('📋 Extracted JSON:', jsonString);
      
      const parsed = JSON.parse(jsonString);
      console.log('✅ JSON parsed successfully');
      
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing LLM response:', error.message);
      console.error('Raw response:', llmResponse);
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }

  /**
   * Validate the parsed response using Zod
   */
  validateResponse(parsedResponse) {
    try {
      const validated = CypherResponseSchema.parse(parsedResponse);
      console.log('✅ Response validation successful');
      return validated;
    } catch (error) {
      console.error('❌ Response validation failed:', error.message);
      throw new Error(`Invalid response format: ${error.message}`);
    }
  }

  /**
   * Validate that the Cypher query is read-only
   */
  validateReadOnlyQuery(cypherQuery) {
    const writeOperations = ['CREATE', 'DELETE', 'MERGE', 'SET', 'REMOVE', 'DROP', 'DETACH'];
    const upperQuery = cypherQuery.toUpperCase();
    
    for (const operation of writeOperations) {
      if (upperQuery.includes(operation)) {
        throw new Error(`Security violation: Query contains write operation '${operation}'`);
      }
    }
    
    if (!upperQuery.includes('RETURN')) {
      throw new Error('Security violation: Query must include RETURN statement');
    }
    
    console.log('✅ Security validation passed');
    return true;
  }

  /**
   * Main method to convert natural language to Cypher
   */
  async convertToCypher(naturalLanguageQuery) {
    const startTime = Date.now();
    
    try {
      console.log('\n🔄 Starting NL → Cypher conversion...');
      console.log('=' .repeat(50));
      
      // Step 1: Call Ollama
      const llmResponse = await this.callOllama(naturalLanguageQuery);
      
      // Step 2: Parse response  
      const parsedResponse = this.parseLLMResponse(llmResponse);
      
      // Step 3: Validate format
      const validatedResponse = this.validateResponse(parsedResponse);
      
      // Step 4: Security validation
      this.validateReadOnlyQuery(validatedResponse.cypher);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('\n✅ Conversion successful!');
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log('=' .repeat(50));
      
      return {
        success: true,
        cypher: validatedResponse.cypher,
        duration: duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('\n❌ Conversion failed!');
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log('❌ Error:', error.message);
      console.log('=' .repeat(50));
      
      return {
        success: false,
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// CLI Interface
async function main() {
  console.log('🚀 LLM-to-Cypher Converter');
  console.log('==========================\n');
  
  // Get query from command line arguments
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Usage: node src/index.js "your natural language query"');
    console.log('\nExamples:');
    console.log('  node src/index.js "Show me all training plans"');
    console.log('  node src/index.js "Find documents about safety"');
    console.log('  node src/index.js "How many training sessions are there?"');
    process.exit(1);
  }
  
  const converter = new LLMToCypherConverter();
  const result = await converter.convertToCypher(query);
  
  if (result.success) {
    console.log('\n🎯 Generated Cypher Query:');
    console.log(`   ${result.cypher}`);
    console.log('\n💡 You can now run this query in Neo4j Browser or your application');
  } else {
    console.log('\n💥 Failed to generate Cypher query');
    process.exit(1);
  }
}

// Export for use as module
export { LLMToCypherConverter };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

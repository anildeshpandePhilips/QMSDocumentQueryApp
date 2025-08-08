import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let mcpClient: Client | null = null;

export async function getMcpClient() {
  if (mcpClient) return mcpClient;
  
  mcpClient = new Client(
    {
      name: "QMS-Client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:7400/mcp")
  );

  try {
    await mcpClient.connect(transport);
    console.log("✅ MCP client connected successfully");
    return mcpClient;
  } catch (error) {
    console.error("❌ MCP connection failed:", error);
    throw error;
  }
}

export async function queryViaMcp(naturalLanguage: string) {
  const client = await getMcpClient();
  
  // First, convert NL to Cypher using MCP
  const llmResult = await client.callTool({
    name: "ollama.generate",
    arguments: { 
      query: naturalLanguage
    }
  });
  
  // Type-safe content access
  if (!llmResult.content || !Array.isArray(llmResult.content) || llmResult.content.length === 0) {
    throw new Error("No response from LLM");
  }
  
  const firstContent = llmResult.content[0];
  if (!firstContent || typeof firstContent !== 'object' || !('text' in firstContent)) {
    throw new Error("Invalid response format from LLM");
  }
  
  const llmResponse = JSON.parse(firstContent.text || "{}");
  
  if (!llmResponse.success) {
    throw new Error(llmResponse.error || "Failed to generate Cypher");
  }
  
  // Then execute the Cypher via MCP
  const cypherResult = await client.callTool({
    name: "neo4j.query",
    arguments: { 
      cypher: llmResponse.cypher 
    }
  });
  
  // Type-safe content access
  if (!cypherResult.content || !Array.isArray(cypherResult.content) || cypherResult.content.length === 0) {
    throw new Error("No response from Neo4j");
  }
  
  const cypherContent = cypherResult.content[0];
  if (!cypherContent || typeof cypherContent !== 'object' || !('text' in cypherContent)) {
    throw new Error("Invalid response format from Neo4j");
  }
  
  return JSON.parse(cypherContent.text || "{}");
}

export async function queryDirectCypher(cypher: string, params: Record<string, unknown> = {}) {
  const client = await getMcpClient();
  
  const result = await client.callTool({
    name: "neo4j.query",
    arguments: { cypher, params }
  });
  
  // Type-safe content access
  if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
    throw new Error("No response from Neo4j");
  }
  
  const resultContent = result.content[0];
  if (!resultContent || typeof resultContent !== 'object' || !('text' in resultContent)) {
    throw new Error("Invalid response format from Neo4j");
  }
  
  return JSON.parse(resultContent.text || "{}");
}

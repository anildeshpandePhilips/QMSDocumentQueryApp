#!/bin/bash

# Neo4j MCP Server Test Script
# This script tests the Neo4j MCP server configuration

echo "🔍 Testing Neo4j MCP Server Setup..."
echo "======================================="

# Set environment variables
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USERNAME="neo4j" 
export NEO4J_PASSWORD="password"
export NEO4J_DATABASE="neo4j"

echo "✅ Environment variables set:"
echo "   NEO4J_URI: $NEO4J_URI"
echo "   NEO4J_USERNAME: $NEO4J_USERNAME"
echo "   NEO4J_DATABASE: $NEO4J_DATABASE"
echo ""

# Test Neo4j connectivity
echo "🔌 Testing Neo4j connectivity..."
curl_result=$(curl -s -u neo4j:password http://localhost:7474/ | jq -r '.neo4j_version' 2>/dev/null)
if [ "$curl_result" != "null" ] && [ "$curl_result" != "" ]; then
    echo "✅ Neo4j is running (version: $curl_result)"
else
    echo "❌ Neo4j connection failed"
    exit 1
fi
echo ""

# Test MCP server package
echo "🧪 Testing MCP server package..."
echo "Using: @alanse/mcp-neo4j-server"

# Run the MCP server in test mode (it will show help/version info)
echo "   Testing package availability..."
npx_result=$(timeout 10s npx @alanse/mcp-neo4j-server --version 2>&1 | head -5)
if echo "$npx_result" | grep -q "NEO4J_PASSWORD"; then
    echo "✅ MCP package is available and requires environment variables (expected)"
elif echo "$npx_result" | grep -q "version"; then
    echo "✅ MCP package version info: $npx_result"
else
    echo "⚠️  MCP package response: $npx_result"
fi
echo ""

# Test basic functionality by attempting to start server briefly
echo "🚀 Testing MCP server startup..."
echo "   Starting server for 3 seconds to test initialization..."

# Start server in background, capture output, then kill it
timeout 3s npx @alanse/mcp-neo4j-server > mcp_test.log 2>&1 &
server_pid=$!

sleep 3
kill $server_pid 2>/dev/null || true
wait $server_pid 2>/dev/null || true

if [ -f "mcp_test.log" ]; then
    echo "   Server output:"
    head -10 mcp_test.log | sed 's/^/   /'
    
    if grep -q "error\|Error\|ERROR" mcp_test.log; then
        echo "⚠️  Server showed some errors (check mcp_test.log for details)"
    else
        echo "✅ Server started successfully"
    fi
    
    rm -f mcp_test.log
else
    echo "⚠️  No server output captured"
fi
echo ""

echo "📋 Claude Desktop Configuration:"
echo "==============================="
echo "Add this to your claude_desktop_config.json:"
echo ""
cat << 'EOF'
{
  "mcpServers": {
    "neo4j": {
      "command": "npx",
      "args": ["@alanse/mcp-neo4j-server"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
EOF
echo ""

echo "📍 Config file location (macOS):"
echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""

echo "🎯 Next Steps:"
echo "1. Add the configuration to Claude Desktop"
echo "2. Restart Claude Desktop"
echo "3. Test with: 'Get the Neo4j database schema'"
echo ""
echo "✅ MCP Setup Test Complete!"

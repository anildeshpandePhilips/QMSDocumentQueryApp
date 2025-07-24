import { useState } from 'react'
import './App.css'

interface QueryResult {
  success: boolean
  query: string
  cypher: string
  data: any[]
  count: number
  executionTime: number
  timestamp: string
  error?: string
  message?: string
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('http://localhost:3001/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setResults(data)
      } else {
        setError(data.error || data.message || 'An error occurred')
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the API is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  const renderResults = () => {
    if (!results || !results.data || results.data.length === 0) {
      return (
        <div className="no-results">
          <p>No results found</p>
        </div>
      )
    }

    // Get column headers from first result
    const headers = Object.keys(results.data[0])

    return (
      <div className="results-container">
        <div className="results-header">
          <h3>📊 Query Results</h3>
          <div className="results-meta">
            <span className="count">{results.count} records</span>
            <span className="time">{results.executionTime}ms</span>
          </div>
        </div>
        
        <div className="cypher-display">
          <strong>Generated Cypher:</strong>
          <code>{results.cypher}</code>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.data.map((row, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={header}>
                      {typeof row[header] === 'object' 
                        ? JSON.stringify(row[header])
                        : String(row[header])
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 QMS Document Query System</h1>
        <p>Ask natural language questions about your documents and training data</p>
      </header>

      <main className="app-main">
        <form onSubmit={handleSubmit} className="query-form">
          <div className="input-group">
            <label htmlFor="query">Enter your question:</label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Show me all training plans' or 'How many documents about safety are there?'"
              rows={3}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              '🚀 Ask Question'
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {results && renderResults()}
      </main>

      <footer className="app-footer">
        <p>Powered by Ollama LLM → Neo4j Graph Database</p>
      </footer>
    </div>
  )
}

export default App

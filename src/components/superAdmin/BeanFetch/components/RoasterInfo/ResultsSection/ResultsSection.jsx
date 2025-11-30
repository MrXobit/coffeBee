import React from 'react'

const ResultsSection = ({
  results,
  loadMoreUrl,
  onLoadMoreUrlChange,
  onContinue,
  onLoadMore,
  onClearResults,
  selectedRoaster,
  addingToDatabase,
  onAddToDatabase,
  onViewJson,
  onRemoveResult,
  loading,
  continueLoading,
  onHandleLoad
}) => {


  
  const handleContinue = () => {
    if (results && results.continueToken) {
      onHandleLoad(results.continueToken) // Використовуємо передану функцію
    }
  }

  const handleLoadMore = () => {
    if (!loadMoreUrl) {
      alert('Please enter URL for new page')
      return
    }
    onHandleLoad(null, loadMoreUrl) // Використовуємо передану функцію
  }

  return (
    <div className="beanfetch-results-section">
      <div className="beanfetch-results-header">
        <div>
          <h2 className="beanfetch-results-title">
            Results ({results.data ? results.data.filter(r => !r.error).length : 0} products)
          </h2>
          <div className="beanfetch-pagination-info">
            Progress: {results.processed}/{results.total} 
            ({Math.round((results.processed / results.total) * 100)}%)
            {results.executionTime && (
              <span className="beanfetch-time"> • Time: {results.executionTime}ms</span>
            )}
          </div>
        </div>
        <div className="beanfetch-results-actions">
          {results.hasMore && (
            <button 
              onClick={handleContinue}
              disabled={continueLoading}
              className="beanfetch-continue-btn"
            >
              {continueLoading ? (
                <span className="beanfetch-loading">
                  <span className="beanfetch-spinner"></span>
                  Continuing...
                </span>
              ) : (
                `Continue (${results.total - results.processed} left)`
              )}
            </button>
          )}
          
          {results.data && results.data.length > 0 && selectedRoaster && (
            <button 
              onClick={onAddToDatabase}
              className="beanfetch-db-btn"
              disabled={addingToDatabase}
            >
              {addingToDatabase ? (
                <span className="beanfetch-db-loading">
                  <span className="beanfetch-db-spinner"></span>
                  Adding...
                </span>
              ) : (
                `📥 Add to Database (${selectedRoaster.name})`
              )}
            </button>
          )}
          
          <button onClick={onClearResults} className="beanfetch-clear-btn">
            Clear Results
          </button>
        </div>
      </div>

      <div className="beanfetch-load-more-section">
        <h3 className="beanfetch-load-more-title">Load More from Different Page</h3>
        <div className="beanfetch-field">
          <label>New Page URL:</label>
          <input
            type="text"
            placeholder="https://example.com/coffee?page=2"
            value={loadMoreUrl}
            onChange={(e) => onLoadMoreUrlChange(e.target.value)}
            className="beanfetch-input"
          />
          <div className="beanfetch-hint">
            Enter URL of another catalog page to load more products (will be added to current results)
          </div>
        </div>
        <button
          onClick={handleLoadMore}
          className="beanfetch-btn primary"
          disabled={loading || continueLoading}
        >
          Load More from New Page
        </button>
      </div>
      
      {results.data && results.data.length > 0 ? (
        <div className="beanfetch-results-grid">
          {results.data.map((result, index) => (
            <div key={index} className={`beanfetch-result-card ${result.error ? 'error' : ''}`}>
              <div className="beanfetch-result-header">
                <h3 className="beanfetch-result-name">{result.name}</h3>
                <div className="beanfetch-result-actions">
                  {result.error ? (
                    <span className="beanfetch-error-badge">Error</span>
                  ) : (
                    <span className="beanfetch-success-badge">Success</span>
                  )}
                  <button 
                    onClick={() => onRemoveResult(index)}
                    className="beanfetch-result-remove"
                    title="Remove this product"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {result.url && (
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="beanfetch-result-url"
                >
                  {result.url}
                </a>
              )}
              
              {result.error ? (
                <div className="beanfetch-error-message">
                  {result.error}
                </div>
              ) : (
                <div className="beanfetch-result-content">
                  <div className="beanfetch-result-fields">
                    {Object.entries(result).map(([fieldName, value]) => {
                      if (['name', 'url', 'error'].includes(fieldName)) return null
                      
                      return (
                        <div key={fieldName} className="beanfetch-field-result">
                          <span className="beanfetch-field-name">{fieldName}:</span>
                          <span className="beanfetch-field-value">
                            {Array.isArray(value) ? (
                              <div className="beanfetch-array-value">
                                {value.map((item, idx) => (
                                  <span key={idx} className="beanfetch-array-item">
                                    {item}
                                    {idx < value.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              value
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  
                  <button 
                    onClick={() => onViewJson(result)}
                    className="beanfetch-json-btn"
                  >
                    👁️ View JSON
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="beanfetch-no-results">
          No results found. Please check your selectors and try again.
        </div>
      )}
    </div>
  );
};

export default ResultsSection;
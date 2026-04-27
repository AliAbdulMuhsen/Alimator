import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages/SearchPage.css';
import axios from 'axios';

function SearchPage({ user, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inflationRate, setInflationRate] = useState(0);
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get('/api/search/autocomplete', {
        params: { q: query }
      });
      setSuggestions(response.data || []);
    } catch (err) {
      console.error('Autocomplete failed:', err);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    await performSearch(suggestion);
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setError('Please enter an item description');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/search/item', {
        params: { description: query }
      });
      setResults(response.data);
    } catch (err) {
      setError('Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const calculateInflatedPrice = (price) => {
    return (price * (1 + inflationRate / 100)).toFixed(2);
  };

  return (
    <div className="search-page">
      <Header user={user} onLogout={onLogout} />
      
      <div className="search-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>Search Items</h1>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for an item (autocomplete working)"
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              <i className="fas fa-search"></i> {loading ? 'Searching...' : 'Search'}
            </button>
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <i className="fas fa-history"></i> {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {results && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2>{results.description}</h2>
                {results.statistics && (
                  <p className="result-count">
                    Found in {results.statistics.occurrences} project(s)
                  </p>
                )}
              </div>
              <div className="inflation-control">
                <label htmlFor="inflation">
                  <i className="fas fa-percentage"></i> Inflation Rate
                </label>
                <div className="inflation-input-group">
                  <input
                    type="number"
                    id="inflation"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                    placeholder="%"
                    step="0.1"
                    min="0"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {results.statistics ? (
              <>
                <div className="statistics-cards">
                  <div className="stat-card">
                    <h4>Average Price</h4>
                    <p className="stat-value">${results.statistics.average_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">${calculateInflatedPrice(results.statistics.average_price)}</p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Minimum Price</h4>
                    <p className="stat-value">${results.statistics.min_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">${calculateInflatedPrice(results.statistics.min_price)}</p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Maximum Price</h4>
                    <p className="stat-value">${results.statistics.max_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">${calculateInflatedPrice(results.statistics.max_price)}</p>
                    )}
                  </div>
                </div>

                <div className="history-section">
                  <h3>Price History</h3>
                  <div className="table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Project Name</th>
                          <th>Project Date</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                          {inflationRate > 0 && <th>Adjusted Price</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.map((result, index) => (
                          <tr key={index}>
                            <td>{result.project_name}</td>
                            <td>{result.project_date}</td>
                            <td>{result.unit}</td>
                            <td>${result.unit_price.toFixed(2)}</td>
                            {inflationRate > 0 && (
                              <td className="adjusted-price">${calculateInflatedPrice(result.unit_price)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No results found for "{results.description}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;

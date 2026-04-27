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
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());
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

  // Calculate inflation based on year difference (compound yearly)
  const calculateInflatedPrice = (price, projectDate) => {
    if (inflationRate === 0) {
      return price.toFixed(2);
    }

    // Extract year from project date (format: YYYY-MM-DD)
    const projectYear = parseInt(projectDate.split('-')[0]);
    const yearsDifference = referenceYear - projectYear;

    if (yearsDifference <= 0) {
      return price.toFixed(2);
    }

    // Compound inflation formula: Price × (1 + rate)^years
    const inflatedPrice = price * Math.pow(1 + inflationRate / 100, yearsDifference);
    return inflatedPrice.toFixed(2);
  };

  // Get years range from results for context
  const getYearsFromResults = () => {
    if (!results || !results.results || results.results.length === 0) {
      return null;
    }
    
    const years = results.results.map(r => parseInt(r.project_date.split('-')[0]));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    return { minYear, maxYear };
  };

  const yearsRange = getYearsFromResults();

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
                    {yearsRange && ` (${yearsRange.minYear} - ${yearsRange.maxYear})`}
                  </p>
                )}
              </div>
              <div className="inflation-controls">
                <div className="inflation-control">
                  <label htmlFor="inflation">
                    <i className="fas fa-percentage"></i> Annual Inflation Rate
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
                    <span>% per year</span>
                  </div>
                </div>
                
                <div className="inflation-control">
                  <label htmlFor="referenceYear">
                    <i className="fas fa-calendar"></i> Adjust To Year
                  </label>
                  <div className="inflation-input-group">
                    <input
                      type="number"
                      id="referenceYear"
                      value={referenceYear}
                      onChange={(e) => setReferenceYear(parseInt(e.target.value) || new Date().getFullYear())}
                      placeholder="YYYY"
                      min="2000"
                      max="2100"
                    />
                  </div>
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
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(results.statistics.average_price, `${referenceYear}-01-01`)}
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Minimum Price</h4>
                    <p className="stat-value">${results.statistics.min_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(results.statistics.min_price, `${referenceYear}-01-01`)}
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Maximum Price</h4>
                    <p className="stat-value">${results.statistics.max_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(results.statistics.max_price, `${referenceYear}-01-01`)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="history-section">
                  <h3>Price History {inflationRate > 0 && `(with ${inflationRate}% annual inflation adjusted to ${referenceYear})`}</h3>
                  <div className="table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Project Name</th>
                          <th>Project Date</th>
                          <th>Unit</th>
                          <th>Original Price</th>
                          {inflationRate > 0 && <th>Adjusted to {referenceYear}</th>}
                          {inflationRate > 0 && <th>Years Diff</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.map((result, index) => {
                          const projectYear = parseInt(result.project_date.split('-')[0]);
                          const yearsDiff = referenceYear - projectYear;
                          return (
                            <tr key={index}>
                              <td>{result.project_name}</td>
                              <td>{result.project_date}</td>
                              <td>{result.unit}</td>
                              <td>${result.unit_price.toFixed(2)}</td>
                              {inflationRate > 0 && (
                                <td className="adjusted-price">${calculateInflatedPrice(result.unit_price, result.project_date)}</td>
                              )}
                              {inflationRate > 0 && (
                                <td className="years-diff">{yearsDiff} {yearsDiff === 1 ? 'year' : 'years'}</td>
                              )}
                            </tr>
                          );
                        })}
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

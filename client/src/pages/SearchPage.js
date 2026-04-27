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
  const [selectedUnit, setSelectedUnit] = useState('');
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

      // Reset unit selection. If only one unit exists we'll auto-select it below.
      setSelectedUnit('');
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

  // Utility: get unique units from results
  const getUniqueUnits = () => {
    if (!results || !results.results) return [];
    const units = Array.from(new Set(results.results.map(r => r.unit)));
    return units;
  };

  // Compute filtered results based on selectedUnit (or all if none selected)
  const getFilteredResults = () => {
    if (!results || !results.results) return [];
    if (!selectedUnit) return results.results;
    return results.results.filter(r => r.unit === selectedUnit);
  };

  // Compute statistics from filtered results (frontend fallback)
  const computeStatisticsFrom = (rows) => {
    if (!rows || rows.length === 0) return null;
    const prices = rows.map(r => Number(r.unit_price));
    const avg = prices.reduce((a,b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      average_price: parseFloat(avg.toFixed(2)),
      min_price: parseFloat(min.toFixed(2)),
      max_price: parseFloat(max.toFixed(2)),
      occurrences: prices.length
    };
  };

  const uniqueUnits = getUniqueUnits();
  const filteredResults = getFilteredResults();

  // Decide which statistics to show: if backend provided global statistics and no unit filter, use it.
  // Otherwise compute from filtered results.
  const displayedStatistics = (!selectedUnit && results && results.statistics) ? results.statistics : computeStatisticsFrom(filteredResults);

  // Auto-select unit if only one exists
  useEffect(() => {
    if (uniqueUnits.length === 1) {
      setSelectedUnit(uniqueUnits[0]);
    }
  }, [results]);

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
                {displayedStatistics && (
                  <p className="result-count">
                    Found in {displayedStatistics.occurrences} project(s)
                    {results.results && results.results.length > 0 && (() => {
                      const years = results.results.map(r => parseInt(r.project_date.split('-')[0]));
                      const minYear = Math.min(...years);
                      const maxYear = Math.max(...years);
                      return ` (${minYear} - ${maxYear})`;
                    })()}
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

                {/* Unit selector when multiple units exist */}
                {uniqueUnits.length > 1 && (
                  <div className="inflation-control unit-selector">
                    <label htmlFor="unitSelect">
                      <i className="fas fa-ruler"></i> Choose Unit
                    </label>
                    <div className="inflation-input-group">
                      <select
                        id="unitSelect"
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                      >
                        <option value="">-- Select unit to filter results --</option>
                        {uniqueUnits.map((u, i) => (
                          <option key={i} value={u}>{u}</option>
                        ))}
                        <option value="__all__">Show all units</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* If multiple units and no unit selected, prompt the user */}
            {uniqueUnits.length > 1 && !selectedUnit && (
              <div className="alert alert-info">
                This item exists with multiple units. Please select the unit you want to view the results for.
              </div>
            )}

            {displayedStatistics ? (
              <>
                <div className="statistics-cards">
                  <div className="stat-card">
                    <h4>Average Price</h4>
                    <p className="stat-value">${displayedStatistics.average_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(displayedStatistics.average_price, `${referenceYear}-01-01`)}
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Minimum Price</h4>
                    <p className="stat-value">${displayedStatistics.min_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(displayedStatistics.min_price, `${referenceYear}-01-01`)}
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h4>Maximum Price</h4>
                    <p className="stat-value">${displayedStatistics.max_price.toFixed(2)}</p>
                    {inflationRate > 0 && (
                      <p className="stat-inflated">
                        → ${calculateInflatedPrice(displayedStatistics.max_price, `${referenceYear}-01-01`)}
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
                        {filteredResults.map((result, index) => {
                          const projectYear = parseInt(result.project_date.split('-')[0]);
                          const yearsDiff = referenceYear - projectYear;
                          return (
                            <tr key={index}>
                              <td>{result.project_name}</td>
                              <td>{result.project_date}</td>
                              <td>{result.unit}</td>
                              <td>${Number(result.unit_price).toFixed(2)}</td>
                              {inflationRate > 0 && (
                                <td className="adjusted-price">${calculateInflatedPrice(Number(result.unit_price), result.project_date)}</td>
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/LoginPage.css';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    onLogin(username);
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <i className="fas fa-calculator"></i>
          <h1>Alimator</h1>
          <p>BOQ Cost Estimator</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter your username"
              className={error ? 'input-error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          
          <button type="submit" className="btn btn-primary btn-block">
            <i className="fas fa-sign-in-alt"></i> Open App
          </button>
        </form>

        <div className="login-footer">
          <p>Manage your historical BOQs and estimate project costs</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

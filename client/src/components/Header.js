import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/Header.css';

function Header({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate('/')}>
          <i className="fas fa-calculator"></i>
          <span>Alimator</span>
        </div>
        
        <div className="header-right">
          {user && <span className="user-name">Welcome, {user.username}</span>}
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

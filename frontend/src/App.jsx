import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ReporterDashboard from './components/ReporterDashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import Leaderboard from './components/Leaderboard';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userWallet, setUserWallet] = useState('');
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    const savedUser = localStorage.getItem('waste2earn_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setUserRole(user.role);
      setUserName(user.name);
      setUserEmail(user.email);
      setUserWallet(user.wallet);
      setCurrentPage(user.role === 'reporter' ? 'report' : 'volunteer');
    }
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUserRole(userData.role);
    setUserName(userData.name);
    setUserEmail(userData.email);
    setUserWallet(userData.wallet);
    localStorage.setItem('waste2earn_user', JSON.stringify(userData));
    setCurrentPage(userData.role === 'reporter' ? 'report' : 'volunteer');
  };

  const handleLogout = () => {
    localStorage.removeItem('waste2earn_user');
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentPage('login');
  };

  if (!isLoggedIn) {
    if (currentPage === 'register') {
      return <Register onLogin={handleLogin} onBack={() => setCurrentPage('login')} />;
    }
    return <Login onLogin={handleLogin} onRegister={() => setCurrentPage('register')} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo">🗑️</span>
          <span className="brand-name">Waste2Earn</span>
        </div>
        
        <div className="nav-tabs">
          {userRole === 'reporter' && (
            <button 
              className={`nav-tab ${currentPage === 'report' ? 'active' : ''}`}
              onClick={() => setCurrentPage('report')}
            >
              📸 Report Waste
            </button>
          )}
          {userRole === 'volunteer' && (
            <button 
              className={`nav-tab ${currentPage === 'volunteer' ? 'active' : ''}`}
              onClick={() => setCurrentPage('volunteer')}
            >
              🗺️ Find Tasks
            </button>
          )}
          <button 
            className={`nav-tab ${currentPage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('leaderboard')}
          >
            🏆 Leaderboard
          </button>
        </div>
        
        <div className="user-info">
          <span className="user-name">👤 {userName}</span>
          <span className="user-email">📧 {userEmail}</span>
          <span className="wallet-badge">💰 {userWallet.slice(0, 8)}...</span>
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </nav>
      
      <main className="main-content">
        {currentPage === 'report' && userRole === 'reporter' && (
          <ReporterDashboard userName={userName} userEmail={userEmail} userWallet={userWallet} />
        )}
        {currentPage === 'volunteer' && userRole === 'volunteer' && (
          <VolunteerDashboard userName={userName} userEmail={userEmail} userWallet={userWallet} />
        )}
        {currentPage === 'leaderboard' && (
          <Leaderboard />
        )}
      </main>
    </div>
  );
}

export default App;
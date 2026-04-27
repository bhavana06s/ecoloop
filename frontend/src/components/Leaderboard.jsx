import React, { useState, useEffect } from 'react';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      // Load from localStorage
      const users = JSON.parse(localStorage.getItem('waste2earn_users') || '[]');
      const sorted = users.sort((a, b) => (b.tokenBalance || 0) - (a.tokenBalance || 0));
      setLeaderboard(sorted);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}th`;
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-card">
        <h1>🏆 Top Waste Warriors</h1>
        <p>Meet the heroes making our planet cleaner! 🌍</p>
      </div>
      
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h2>Global Leaderboard</h2>
          <p>Earn tokens by reporting and cleaning waste!</p>
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No users yet. Be the first to join! 🎉</p>
          </div>
        ) : (
          leaderboard.map((user, index) => (
            <div className="leaderboard-item" key={user.wallet}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={`rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                  {getRankIcon(index)}
                </div>
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {user.role === 'reporter' ? '📸 Reporter' : '💚 Volunteer'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                  {user.token_balance || user.tokenBalance || 0} W2E
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {user.reports_count || user.reportsCount || 0} reports • {user.cleanups_count || user.cleanupsCount || 0} cleanups
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '2rem', background: 'white', borderRadius: '20px', padding: '1.5rem' }}>
        <h3>💡 How to Earn More Tokens:</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>📸 Report waste - Earn 2 W2E per report</li>
          <li>✅ Clean up waste - Earn 5 W2E per cleanup</li>
          <li>🏆 Reach top 3 on leaderboard - Get recognition!</li>
          <li>🌟 Complete tasks quickly - Higher chance for rewards!</li>
        </ul>
      </div>
    </div>
  );
}

export default Leaderboard;
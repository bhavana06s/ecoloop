import React, { useState } from 'react';

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        // Save to localStorage
        localStorage.setItem('waste2earn_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Cannot connect to server. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🗑️</div>
          <h2>Welcome Back!</h2>
          <p>Login to continue cleaning the planet 🌍</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : '🔐 Login'}
          </button>
        </form>
        
        <div className="register-link">
          <p>Don't have an account? <button onClick={onRegister}>Create Account</button></p>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
          💡 No crypto needed! Wallet auto-generated with your email.
        </p>
      </div>
    </div>
  );
}

export default Login;
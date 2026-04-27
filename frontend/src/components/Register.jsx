import React, { useState } from 'react';

function Register({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('reporter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('name', name);
    formData.append('password', password);
    formData.append('role', role);
    
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Account created successfully!\n\nYour Wallet: ${data.user.wallet}\n\nSave this wallet address for your records.`);
        localStorage.setItem('waste2earn_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
          <h2>Create Account</h2>
          <p>Join the waste reduction movement! 🌱</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <button 
              type="button"
              className={`role-btn ${role === 'reporter' ? 'active' : ''}`}
              onClick={() => setRole('reporter')}
            >
              📸 Reporter
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
              onClick={() => setRole('volunteer')}
            >
              💚 Volunteer
            </button>
          </div>
          
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
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creating Account...' : '🚀 Create Account'}
          </button>
        </form>
        
        <div className="register-link">
          <p>Already have an account? <button onClick={onBack}>Login</button></p>
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
          <p>✨ Your wallet will be automatically generated using your email</p>
          <p>🔒 All data is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}

export default Register;
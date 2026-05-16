import React, { useState, useRef, useEffect } from 'react';

function ReporterDashboard({ userName, userEmail, userWallet }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('not_requested');
  const [userStats, setUserStats] = useState({ 
    token_balance: 0, 
    reports_count: 0,
    cleanups_count: 0 
  });
  const fileInputRef = useRef(null);

  // Load user stats from backend
  const loadUserStats = async () => {
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/user-stats/${userWallet}`);
      const data = await response.json();
      if (!data.error) {
        setUserStats({
          token_balance: data.token_balance || 0,
          reports_count: data.reports_count || 0,
          cleanups_count: data.cleanups_count || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('waste2earn_users') || '[]');
      const currentUser = users.find(u => u.wallet === userWallet);
      if (currentUser) {
        setUserStats({
          token_balance: currentUser.token_balance || 0,
          reports_count: currentUser.reports_count || 0,
          cleanups_count: currentUser.cleanups_count || 0
        });
      }
    }
  };

  useEffect(() => {
    loadUserStats();
  }, [userWallet]);

  const getLocation = () => {
    setLocationStatus('requesting');
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLocationStatus('error');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(newLocation);
        setLocationStatus('success');
        alert(` Location captured!`);
      },
      (error) => {
        console.error('Location error:', error);
        alert('Please allow location access to report waste');
        setLocationStatus('error');
      }
    );
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Detect waste type
      await detectWaste(file);
    }
  };

  const detectWaste = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('https://ecoloop-backend-hy7l.onrender.com/api/detect-waste', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      setDetectionResult(result);
    } catch (error) {
      console.error('Detection error:', error);
      setDetectionResult({
        waste_type: 'general_waste',
        confidence: 0.5,
        recommendations: ['Unable to detect. Please try another photo.']
      });
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      alert(' Please select an image first!');
      return;
    }
    
    if (!location) {
      alert('📍 Please click "Get My Location" and allow location access!');
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('latitude', location.lat);
    formData.append('longitude', location.lng);
    formData.append('wallet_address', userWallet);
    formData.append('description', description);
    
    try {
      const response = await fetch('https://ecoloop-backend-hy7l.onrender.com/api/report-waste', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        alert(` Report submitted! You earned ${result.tokens_awarded} W2E tokens! `);
        
        // Reset form
        setSelectedImage(null);
        setImageFile(null);
        setDescription('');
        setDetectionResult(null);
        
        // Reload stats
        await loadUserStats();
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting report. Please make sure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-card">
        <h1> Welcome, {userName}!</h1>
        <p>Report waste, earn tokens, and help keep your community clean! </p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}> {userEmail}</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{userStats.token_balance}</div>
          <div>W2E Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{userStats.reports_count}</div>
          <div>Reports Made</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{userStats.reports_count * 0.5}</div>
          <div>kg CO₂ Saved</div>
        </div>
      </div>
      
      <div className="report-form">
        <h2> Report New Waste</h2>
        
        <div 
          className="image-upload-area"
          onClick={() => fileInputRef.current.click()}
          style={{ cursor: 'pointer' }}
        >
          {selectedImage ? (
            <img src={selectedImage} alt="Preview" className="preview-image" />
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
              <p>Click to take or upload a photo of waste</p>
              <small>Supported: JPG, PNG, GIF</small>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        
        {detectionResult && (
          <div className="detection-result" style={{
            background: detectionResult.confidence > 0.7 ? '#10B98120' : '#F59E0B20',
            padding: '1rem',
            borderRadius: '15px',
            margin: '1rem 0'
          }}>
            <h3> AI Analysis Result</h3>
            <p><strong>Detected Waste Type:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '1.2rem' }}>{detectionResult.waste_type}</span></p>
            <p><strong>Confidence:</strong> {(detectionResult.confidence * 100).toFixed(1)}%</p>
            <div style={{ marginTop: '0.5rem' }}>
              <strong> How to dispose correctly:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {detectionResult.recommendations?.slice(0, 2).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className="input-group">
          <input
            type="text"
            placeholder="Additional description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '15px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="input-group">
          <button 
            type="button" 
            onClick={getLocation}
            style={{
              width: '100%',
              padding: '1rem',
              background: location ? '#10B981' : locationStatus === 'requesting' ? '#F59E0B' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {locationStatus === 'requesting' ? ' Getting Location...' : location ? ' Location Captured!' : ' Get My Location'}
          </button>
          {location && (
            <p style={{ color: '#10B981', marginTop: '0.5rem', fontSize: '0.85rem' }}>
               Location ready for verification
            </p>
          )}
        </div>
        
        <button 
          className="submit-report-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedImage || !location}
          style={{
            width: '100%',
            padding: '1rem',
            background: (!selectedImage || !location) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: (!selectedImage || !location) ? 'not-allowed' : 'pointer',
            marginTop: '1rem'
          }}
        >
          {isSubmitting ? 'Submitting...' : ' Submit Report & Earn 2 W2E Tokens'}
        </button>
      </div>
    </div>
  );
}

export default ReporterDashboard;
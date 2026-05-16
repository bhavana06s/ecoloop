import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function VolunteerDashboard({ userName, userWallet }) {
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showFakeReportModal, setShowFakeReportModal] = useState(false);
  const [selectedFakeTask, setSelectedFakeTask] = useState(null);
  const [fakeReason, setFakeReason] = useState('');
  const [completionLocation, setCompletionLocation] = useState(null);
  const [issueReason, setIssueReason] = useState('');
  const [wasteFound, setWasteFound] = useState(false);
  const [userStats, setUserStats] = useState({ token_balance: 0, cleanups_count: 0 });

  useEffect(() => {
    loadUserStats();
    getLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchTasks();
      fetchMyTasks();
    }
  }, [userLocation]);

  const loadUserStats = async () => {
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/user-stats/${userWallet}`);
      const data = await response.json();
      if (!data.error) {
        setUserStats({
          token_balance: data.token_balance || 0,
          cleanups_count: data.cleanups_count || 0
        });
      }
    } catch (error) {
      const users = JSON.parse(localStorage.getItem('waste2earn_users') || '[]');
      const user = users.find(u => u.wallet === userWallet);
      if (user) {
        setUserStats({
          token_balance: user.tokenBalance || 0,
          cleanups_count: user.cleanupsCount || 0
        });
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    }
  };

  const fetchTasks = async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/nearby-tasks?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/my-tasks/${userWallet}`);
      const data = await response.json();
      setMyTasks(data.tasks || []);
    } catch (error) {
      setMyTasks([]);
    }
  };

  const acceptTask = async (taskId) => {
    const formData = new FormData();
    formData.append('wallet_address', userWallet);
    
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/accept-task/${taskId}`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert(' Task accepted! Go to the location, clean up, then verify completion.');
        fetchTasks();
        fetchMyTasks();
        loadUserStats();
      } else {
        alert('Unable to accept task. Please try again.');
      }
    } catch (error) {
      alert(' Task accepted! (Demo mode)\n\nGo to the location to complete.');
      fetchTasks();
      fetchMyTasks();
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  };

  const openCompletionModal = async (task) => {
    setSelectedTask(task);
    setShowCompletionModal(true);
    setIssueReason('');
    setWasteFound(false);
    
    // Get current location for verification
    try {
      const location = await getCurrentLocation();
      setCompletionLocation(location);
    } catch (error) {
      alert('Please enable location to verify task completion');
    }
  };

  const openFakeReportModal = async (task) => {
    setSelectedFakeTask(task);
    setShowFakeReportModal(true);
    setFakeReason('');
    
    // Get current location for verification
    try {
      const location = await getCurrentLocation();
      setCompletionLocation(location);
    } catch (error) {
      alert('Please enable location to report fake waste');
    }
  };

  const completeTask = async () => {
    if (!completionLocation) {
      alert('Getting your location... Please wait and try again.');
      return;
    }
    
    if (!wasteFound) {
      alert(' Please confirm that you found the waste at this location by checking the "Waste Found" box.');
      return;
    }
    
    const formData = new FormData();
    formData.append('wallet_address', userWallet);
    formData.append('latitude', completionLocation.lat);
    formData.append('longitude', completionLocation.lng);
    formData.append('waste_found', 'true');
    
    if (issueReason) {
      formData.append('issue_reported', issueReason);
    }
    
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/complete-task/${selectedTask.id}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(` ${result.message}`);
        setShowCompletionModal(false);
        setSelectedTask(null);
        setWasteFound(false);
        setIssueReason('');
        fetchTasks();
        fetchMyTasks();
        loadUserStats();
      } else {
        if (result.require_confirmation) {
          alert(' Please confirm that you found the waste at this location.');
        } else if (result.current_distance) {
          alert(` You are ${result.current_distance}m away from the waste location.\n\nPlease go to the exact location to verify cleanup.`);
        } else {
          alert(` ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert(' Demo: Task completed! You earned 5 W2E tokens!');
      setShowCompletionModal(false);
      setSelectedTask(null);
      setWasteFound(false);
      setIssueReason('');
      fetchTasks();
      fetchMyTasks();
      loadUserStats();
    }
  };

  const reportFakeTask = async () => {
    if (!fakeReason) {
      alert('Please select a reason for reporting this as fake');
      return;
    }
    
    if (!completionLocation) {
      alert('Getting your location... Please enable location and try again.');
      return;
    }
    
    const formData = new FormData();
    formData.append('wallet_address', userWallet);
    formData.append('latitude', completionLocation.lat);
    formData.append('longitude', completionLocation.lng);
    formData.append('reason', fakeReason);
    
    try {
      const response = await fetch(`https://ecoloop-backend-hy7l.onrender.com/api/report-fake-task/${selectedFakeTask.id}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(` ${result.message}`);
        setShowFakeReportModal(false);
        setSelectedFakeTask(null);
        setFakeReason('');
        fetchTasks();
        fetchMyTasks();
        loadUserStats();
      } else {
        alert(result.message || 'Unable to verify. Please go to the exact location.');
      }
    } catch (error) {
      console.error('Error reporting fake task:', error);
      alert('Demo: Fake report submitted! Reporter would lose tokens.');
      setShowFakeReportModal(false);
      setSelectedFakeTask(null);
      setFakeReason('');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-card">
        <h1> Welcome, {userName}!</h1>
        <p>Your Wallet: <strong>{userWallet}</strong></p>
        <p>Find nearby waste cleanup tasks and earn rewards! </p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
           If you find a fake report, you can report it and earn compensation!
        </p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{userStats.token_balance || 0}</div>
          <div>W2E Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{userStats.cleanups_count || 0}</div>
          <div>Cleanups Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{(userStats.cleanups_count || 0) * 0.5}</div>
          <div>kg CO₂ Saved</div>
        </div>
      </div>
      
      {/* My Active Tasks */}
      {myTasks.filter(t => t.status === 'accepted').length > 0 && (
        <>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}> My Active Tasks</h2>
          {myTasks.filter(t => t.status === 'accepted').map(task => (
            <div key={task.id} className="stat-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #F59E0B' }}>
              <h4> {task.waste_type?.toUpperCase()}</h4>
              <p> Location: {task.latitude?.toFixed(6)}, {task.longitude?.toFixed(6)}</p>
              <p> Reward: 5 W2E tokens</p>
              <button 
                onClick={() => openCompletionModal(task)}
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}
              >
                 Verify Cleanup & Complete
              </button>
            </div>
          ))}
        </>
      )}
      
      <h2 style={{ color: 'white', marginBottom: '1rem', marginTop: '2rem' }}> Available Tasks Nearby</h2>
      
      {userLocation && (
        <div className="map-container" style={{ height: '450px', borderRadius: '20px', overflow: 'hidden', marginBottom: '2rem' }}>
          <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup> You are here</Popup>
            </Marker>
            {tasks.filter(t => t.status === 'pending').map(task => (
              <Marker key={task.id} position={[task.latitude, task.longitude]}>
                <Popup>
                  <div style={{ minWidth: '250px' }}>
                    <h4> {task.waste_type?.toUpperCase()}</h4>
                    <p> Distance: {task.distance_km} km</p>
                    <p> Reward: 5 W2E tokens</p>
                    <hr />
                    <button 
                      onClick={() => acceptTask(task.id)} 
                      style={{ 
                        background: '#10B981', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        width: '100%',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}
                    >
                       Accept Task & Clean
                    </button>
                    <button 
                      onClick={() => openFakeReportModal(task)} 
                      style={{ 
                        background: '#EF4444', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        width: '100%',
                        fontWeight: '600'
                      }}
                    >
                       Report Fake Waste
                    </button>
                    <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>
                       Reporting fake waste deducts tokens from reporter
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      
      {/* Tasks List */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}> Available Tasks List</h3>
        {loading ? (
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.filter(t => t.status === 'pending').length === 0 ? (
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <p> No pending tasks nearby! Check back later.</p>
          </div>
        ) : (
          tasks.filter(t => t.status === 'pending').map(task => (
            <div key={task.id} className="stat-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h4> {task.waste_type?.toUpperCase()}</h4>
                  <p> {task.distance_km} km away</p>
                  <p> Reward: 5 W2E tokens</p>
                </div>
                <div>
                  <button 
                    onClick={() => acceptTask(task.id)}
                    style={{
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1.5rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginRight: '0.5rem'
                    }}
                  >
                    Accept Task 
                  </button>
                  <button 
                    onClick={() => openFakeReportModal(task)}
                    style={{
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Fake Report 
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Completion Modal */}
      {showCompletionModal && selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2> Verify Cleanup</h2>
            <p>Task: <strong>{selectedTask.waste_type?.toUpperCase()}</strong></p>
            <p> Task Location: {selectedTask.latitude?.toFixed(6)}, {selectedTask.longitude?.toFixed(6)}</p>
            
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '2px solid #10B981' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={wasteFound}
                  onChange={(e) => setWasteFound(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <strong style={{ fontSize: '1rem' }}>✓ I confirm that I found the waste at this location and cleaned it up</strong>
              </label>
            </div>
            
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#EFF6FF', borderRadius: '10px' }}>
              <p><strong> Your current location:</strong></p>
              {completionLocation ? (
                <p style={{ color: '#10B981' }}>
                   Lat: {completionLocation.lat.toFixed(6)}<br />
                   Lng: {completionLocation.lng.toFixed(6)}
                </p>
              ) : (
                <p style={{ color: '#F59E0B' }}> Getting your location... Please wait.</p>
              )}
            </div>
            
            <div style={{ margin: '1rem 0' }}>
              <p><strong> Issue with dustbin?</strong></p>
              <select 
                value={issueReason} 
                onChange={(e) => setIssueReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  marginTop: '0.5rem'
                }}
              >
                <option value="">No issue - Dustbin available </option>
                <option value="no_dustbin"> No dustbin at location</option>
                <option value="dustbin_full"> Dustbin is full</option>
              </select>
            </div>
            
            <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <p style={{ color: '#92400E', margin: 0, fontSize: '0.85rem' }}>
                 You must be at the exact waste location to verify cleanup.<br />
                 You must check the "Waste Found" box.<br />
                 You will earn 5 W2E tokens upon successful verification.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={completeTask}
                disabled={!wasteFound || !completionLocation}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: (wasteFound && completionLocation) ? '#10B981' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (wasteFound && completionLocation) ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                 Confirm & Earn 5 Tokens
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedTask(null);
                  setWasteFound(false);
                  setIssueReason('');
                }}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fake Report Modal */}
      {showFakeReportModal && selectedFakeTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2> Report Fake Waste</h2>
            <p>Task: <strong>{selectedFakeTask.waste_type?.toUpperCase()}</strong></p>
            <p> Location: {selectedFakeTask.latitude?.toFixed(6)}, {selectedFakeTask.longitude?.toFixed(6)}</p>
            
            <div style={{ margin: '1rem 0' }}>
              <p><strong>Why can't you find the waste?</strong></p>
              <select 
                value={fakeReason} 
                onChange={(e) => setFakeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  marginTop: '0.5rem'
                }}
              >
                <option value="">Select a reason...</option>
                <option value="waste_not_found"> No waste found at this location</option>
                <option value="wrong_location"> Wrong location marked on map</option>
                <option value="already_cleaned"> Waste already cleaned by someone else</option>
                <option value="inaccessible"> Location is inaccessible</option>
              </select>
            </div>
            
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#EFF6FF', borderRadius: '10px' }}>
              <p><strong> Your current location:</strong></p>
              {completionLocation ? (
                <p style={{ color: '#10B981' }}>
                  Lat: {completionLocation.lat.toFixed(6)}<br />
                  Lng: {completionLocation.lng.toFixed(6)}
                </p>
              ) : (
                <p style={{ color: '#F59E0B' }}> Getting your location...</p>
              )}
            </div>
            
            <div style={{ background: '#FEE2E2', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <p style={{ color: '#991B1B', margin: 0, fontSize: '0.85rem' }}>
                 <strong>Warning:</strong> Reporting fake waste will:
                <br />• Deduct <strong>5 tokens</strong> from the reporter
                <br />• Add <strong>2 tokens</strong> to your account as compensation
                <br />• Reduce the reporter's reputation score
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={reportFakeTask}
                disabled={!fakeReason || !completionLocation}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: (fakeReason && completionLocation) ? '#EF4444' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (fakeReason && completionLocation) ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Confirm Fake Report
              </button>
              <button
                onClick={() => {
                  setShowFakeReportModal(false);
                  setSelectedFakeTask(null);
                  setFakeReason('');
                }}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;
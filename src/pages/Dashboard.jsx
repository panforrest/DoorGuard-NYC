import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX, Video, Mic, Activity, Database, CheckCircle2, XCircle, MapPin, Phone, PhoneOff } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  
  const [status, setStatus] = useState('LISTENING');
  const [transcript, setTranscript] = useState([
    { role: 'agent', text: 'DoorGuard AI System initializing...' }
  ]);
  const [currentClaim, setCurrentClaim] = useState(null);
  const [apiResults, setApiResults] = useState(null);
  const [rightsCitation, setRightsCitation] = useState(null);

  // Integrate Live Voice Hook
  const { connect, disconnect, isConnected, isSpeaking } = useVoice((msg) => {
    setTranscript(prev => [...prev, msg]);
    
    // Simple heuristic to trigger the Data Verification for the demo when the user says "inspect", "hpd", "dob", etc.
    const text = msg.text.toLowerCase();
    if (msg.role === 'visitor' && (text.includes('inspect') || text.includes('hpd') || text.includes('repair') || text.includes('permit'))) {
       setCurrentClaim(msg.text);
       triggerLiveVerification(msg.text);
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('doorguard_address');
    if (saved) {
      setAddress(JSON.parse(saved));
    } else {
      navigate('/setup');
    }
    
    // Cleanup voice connection on unmount
    return () => disconnect();
  }, [navigate, disconnect]);

  const triggerLiveVerification = async (claim) => {
    setStatus('VERIFYING');
    setTranscript(prev => [...prev, { role: 'agent', text: 'Checking live NYC Open Data for records at this address...' }]);
    
    try {
      const response = await fetch('http://localhost:8000/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          visitor_claim: claim
        })
      });
      
      const data = await response.json();
      
      setStatus(data.verdict);
      setApiResults(data.datasets);
      setRightsCitation(data.rights_citation);
      
      setTranscript(prev => [...prev, { 
        role: 'agent', 
        text: data.reasoning
      }]);

    } catch (error) {
      console.error("Backend API Error:", error);
      setStatus('BLOCKED');
      setTranscript(prev => [...prev, { 
        role: 'agent', 
         text: 'System Error: Cannot connect to NYC Open Data.' 
      }]);
    }
  };

  const runLiveVerification = async () => {
    // Legacy manual trigger for the demo
    const claim = 'HPD inspector here for a mold inspection';
    setCurrentClaim('HPD Inspector');
    triggerLiveVerification(claim);
  };

  if (!address) return null;

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dashboard-header glass-panel">
        <div className="logo cursor-pointer" onClick={() => navigate('/')}>
          <ShieldCheck className="logo-icon" size={24} />
          <span className="logo-text">DoorGuard<span className="text-gradient-blue">NYC</span></span>
        </div>
        
        <div className="address-badge">
          <MapPin size={16} className="text-blue-400" />
          {address.houseNumber} {address.street}, {address.borough} {address.apartment && `Apt ${address.apartment}`}
        </div>
        
        <div className="system-status">
          <span className="pulse-dot green"></span>
          System Active
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="dashboard-main">
        
        {/* Left Panel: Camera Feed */}
        <div className="panel camera-panel glass-panel">
          <div className="panel-header">
            <Video size={18} /> <span>Live Door Camera</span>
            {status !== 'LISTENING' && <span className="badge-analyzing">Analyzing</span>}
          </div>
          <div className="camera-feed">
             <div className="camera-bg"></div>
             {/* Overlay for demo */}
             <div className="vision-overlay">
               <div className="bounding-box">
                 <span className="label">Person (89%)</span>
               </div>
             </div>
             <div className="feed-timestamp">
               {new Date().toLocaleTimeString()} • Front Door
             </div>
          </div>
        </div>

        {/* Center Panel: Transcript & Voice */}
        <div className="panel transcript-panel glass-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><Mic size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> <span>Live Conversation (Gemini Voice)</span></div>
            {!isConnected ? (
              <button 
                onClick={connect} 
                style={{ 
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', 
                  border: 'none', 
                  borderRadius: '16px', 
                  color: 'white', 
                  padding: '4px 12px', 
                  fontSize: '0.75rem', 
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Connect Voice
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot green" style={{ width: '6px', height: '6px' }}></span> Connected
              </span>
            )}
          </div>
          
          <div className="transcript-area">
            {transcript.map((msg, i) => (
              <div key={i} className={`msg-bubble ${msg.role}`}>
                <div className="msg-sender">{msg.role === 'agent' ? 'DoorGuard Agent' : 'Visitor'}</div>
                <div className="msg-text">{msg.text}</div>
              </div>
            ))}
            {status === 'LISTENING' && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>
          
          <div className="audio-visualizer">
            <div className={`bar ${status === 'LISTENING' ? 'active' : ''}`}></div>
            <div className={`bar ${status === 'LISTENING' ? 'active' : ''}`} style={{animationDelay: '0.1s'}}></div>
            <div className={`bar ${status === 'LISTENING' ? 'active' : ''}`} style={{animationDelay: '0.2s'}}></div>
            <div className={`bar ${status === 'LISTENING' ? 'active' : ''}`} style={{animationDelay: '0.3s'}}></div>
            <div className={`bar ${status === 'LISTENING' ? 'active' : ''}`} style={{animationDelay: '0.1s'}}></div>
          </div>
        </div>

        {/* Right Panel: Verdict & NYC Data */}
        <div className="panel verdict-panel glass-panel">
          <div className="panel-header">
            <Activity size={18} /> <span>Real-Time Verification</span>
          </div>
          
          <div className="verdict-content">
            {/* The bold verdict card */}
            <div className={`verdict-card ${status.toLowerCase()}`}>
              {status === 'LISTENING' && <div className="verdict-icon"><ShieldCheck size={48} /></div>}
              {status === 'VERIFYING' && <div className="verdict-icon pulse"><Database size={48} /></div>}
              {status === 'UNVERIFIED' && <div className="verdict-icon"><ShieldAlert size={48} /></div>}
              {status === 'BLOCKED' && <div className="verdict-icon"><ShieldX size={48} /></div>}
              {status === 'VERIFIED' && <div className="verdict-icon"><ShieldCheck size={48} /></div>}
              
              <h2>{status}</h2>
              {currentClaim && <p>Claim: {currentClaim}</p>}
            </div>

            {/* NYC Open Data Results */}
            <div className="nyc-data-section">
              <h3>NYC Open Data Checks</h3>
              
              <div className="data-row">
                <div className="data-label">HPD Violations (wvxf-dwi5)</div>
                <div className={`data-status ${status === 'VERIFYING' ? 'loading' : 'done'}`}>
                  {status === 'VERIFYING' ? 'Querying...' : 
                    apiResults ? <><CheckCircle2 size={16}/> {apiResults.hpd_violations_found} Found</> : 'Waiting...'
                  }
                </div>
              </div>
              
              <div className="data-row">
                <div className="data-label">HPD Complaints (uwyv-629c)</div>
                <div className={`data-status ${status === 'VERIFYING' ? 'loading' : 'done'}`}>
                  {status === 'VERIFYING' ? 'Querying...' : 
                    apiResults ? <><CheckCircle2 size={16}/> {apiResults.hpd_complaints_found} Found</> : 'Waiting...'
                  }
                </div>
              </div>

              <div className="data-row">
                <div className="data-label">DOB Permits (ic3t-wcy2)</div>
                <div className={`data-status ${status === 'VERIFYING' ? 'loading' : 'done'}`}>
                  {status === 'VERIFYING' ? 'Querying...' : 
                    apiResults ? <><CheckCircle2 size={16}/> {apiResults.dob_permits_found} Found</> : 'Waiting...'
                  }
                </div>
              </div>
            </div>

            {/* Tenant Rights Citation */}
            {(rightsCitation) && (
              <div className="rights-citation">
                <strong>NYC Tenant Rights Alert</strong>
                <p>{rightsCitation}</p>
              </div>
            )}
            
            {/* Dev Demo Controls */}
            <div className="demo-controls" style={{marginTop: 'auto', paddingTop: '20px'}}>
               <button onClick={runLiveVerification} className="btn-secondary w-full" style={{fontSize: '0.8rem'}}>
                 ▶️ Run Live Verification (Real NYC Data)
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

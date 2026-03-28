import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import './Setup.css';

const AddressSetup = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    houseNumber: '370',
    street: 'Jay Street',
    borough: 'BROOKLYN',
    apartment: '317'
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    
    // Simulate real NYC Open Data address validation (we'll connect actual API later)
    setTimeout(() => {
      // Save address to local storage so Dashboard can use it
      localStorage.setItem('doorguard_address', JSON.stringify(address));
      setIsVerifying(false);
      navigate('/dashboard');
    }, 1500);
  };

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="setup-container">
      <div className="setup-nav">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <ShieldCheck className="logo-icon" size={24} />
          <span className="logo-text" style={{ fontSize: '1.25rem' }}>DoorGuard<span className="text-gradient-blue">NYC</span></span>
        </div>
      </div>

      <div className="setup-content">
        <div className="setup-card glass-panel">
          <div className="setup-header">
            <div className="icon-wrapper">
              <MapPin size={32} color="var(--accent-blue)" />
            </div>
            <h2>Set Up Your Door</h2>
            <p>Enter your NYC address to activate DoorGuard. We use this to verify inspectors and workers against real city records.</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>House / Building Number</label>
                <input 
                  type="text" 
                  name="houseNumber" 
                  value={address.houseNumber} 
                  onChange={handleChange} 
                  placeholder="e.g. 1520" 
                  required 
                />
              </div>
              <div className="form-group flex-2">
                <label>Street Name</label>
                <input 
                  type="text" 
                  name="street" 
                  value={address.street} 
                  onChange={handleChange} 
                  placeholder="e.g. GRAND CONCOURSE" 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Borough</label>
                <div className="select-wrapper">
                  <select name="borough" value={address.borough} onChange={handleChange}>
                    <option value="MANHATTAN">Manhattan</option>
                    <option value="BROOKLYN">Brooklyn</option>
                    <option value="QUEENS">Queens</option>
                    <option value="BRONX">The Bronx</option>
                    <option value="STATEN ISLAND">Staten Island</option>
                  </select>
                </div>
              </div>
              <div className="form-group flex-1">
                <label>Apt / Unit (Optional)</label>
                <input 
                  type="text" 
                  name="apartment" 
                  value={address.apartment} 
                  onChange={handleChange} 
                  placeholder="e.g. 4B" 
                />
              </div>
            </div>

            <div className="data-disclaimer">
              <Building size={16} />
              <span>We check claims against HPD Violations, DOB Permits, & 311 Complaints via NYC Open Data API.</span>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isVerifying}>
              {isVerifying ? (
                <span className="loading-state">
                  <div className="spinner"></div>
                  Validating Address...
                </span>
              ) : (
                <>Activate DoorGuard <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressSetup;

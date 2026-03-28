import { ShieldCheck, ArrowRight, Eye, Mic, Bell, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="glass-panel nav-bar">
        <div className="logo">
          <ShieldCheck className="logo-icon" size={28} />
          <span className="logo-text">DoorGuard<span className="text-gradient-blue">NYC</span></span>
        </div>
        <div className="nav-links">
          <a href="#how-it-works">How it Works</a>
          <a href="#datasets">NYC Data</a>
          <a href="https://github.com/panforrest/doorguard-nyc" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="badge">NYC Hackathon 2026 Winner 🏆</div>
          <h1 className="hero-title">
            Who's at your door? <br />
            <span className="text-gradient">And are they who they say they are?</span>
          </h1>
          <p className="hero-subtitle">
            A voice + vision AI agent that talks to visitors on your behalf, checks NYC Open Data in real time to verify if they're legit, knows your tenant rights, and alerts you with the verdict.
          </p>
          
          <div className="cta-group">
            <Link to="/setup" className="btn-primary">
              Protect Your Door <ArrowRight size={20} />
            </Link>
            <button className="btn-secondary" onClick={() => document.getElementById('demo').scrollIntoView({behavior: 'smooth'})}>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual animate-float">
          <div className="glass-panel mock-dashboard">
            <div className="mock-header">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="mock-content">
              <div className="mock-camera">
                <div className="camera-overlay">
                  <div className="face-box"></div>
                  <span className="analyzing-text">ANALYZING VISITOR...</span>
                </div>
              </div>
              <div className="mock-verdict blocked">
                <ShieldCheck size={24} />
                <div>
                  <strong>UNVERIFIED: Fake DOB Inspector</strong>
                  <p>No complaints or permits found for this address.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features / How it Works */}
      <section id="how-it-works" className="features">
        <h2 className="section-title">The "Live Agent" Experience</h2>
        <div className="feature-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon blue"><Eye size={32} /></div>
            <h3>It SEES them</h3>
            <p>Using Gemini Vision, DoorGuard analyzes the camera feed to read badges and uniforms in real time.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon orange"><Mic size={32} /></div>
            <h3>It TALKS to them</h3>
            <p>Gemini 2.0 Flash Live powers a natural, interruptible voice conversation to ask why they're here.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon green"><Building size={32} /></div>
            <h3>It VERIFIES them</h3>
            <p>Cross-references their claims against 5 NYC Open Datasets instantly (HPD, DOB, permits).</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon red"><Bell size={32} /></div>
            <h3>It ALERTS you</h3>
            <p>Sends a verified/blocked verdict with tenant rights citations directly to your phone.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

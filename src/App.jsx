import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Placeholders for upcoming steps */}
        <Route path="/setup" element={<div className="landing-container" style={{paddingTop: '100px'}}><h2>Step 2: Address Setup Flow (Coming Next)</h2></div>} />
        <Route path="/dashboard" element={<div className="landing-container" style={{paddingTop: '100px'}}><h2>Step 3: Live Dashboard (Coming Next)</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;

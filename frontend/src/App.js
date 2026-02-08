import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import FMEAList from './pages/FMEAList';
import FMEACreate from './pages/FMEACreate';
import FMEADetail from './pages/FMEADetail';
import FTAList from './pages/FTAList';
import FTACreate from './pages/FTACreate';
import RiskMatrix from './pages/RiskMatrix';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>SafetyMindPro</h1>
          </div>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/fmea">FMEA</Link></li>
            <li><Link to="/fta">Fault Trees</Link></li>
            <li><Link to="/risk-matrix">Risk Matrix</Link></li>
          </ul>
        </nav>
        
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fmea" element={<FMEAList />} />
            <Route path="/fmea/create" element={<FMEACreate />} />
            <Route path="/fmea/:id" element={<FMEADetail />} />
            <Route path="/fta" element={<FTAList />} />
            <Route path="/fta/create" element={<FTACreate />} />
            <Route path="/risk-matrix" element={<RiskMatrix />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
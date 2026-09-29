// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DynamicArchitectureGenerator from './components/InfrastructureGenerator';
import EnhancedAIGenerator from './components/AIGenerator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DynamicArchitectureGenerator />} />
        <Route path="/ai" element={<EnhancedAIGenerator />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} /> {/* Optional */}
      </Routes>
    </Router>
  );
}

export default App;

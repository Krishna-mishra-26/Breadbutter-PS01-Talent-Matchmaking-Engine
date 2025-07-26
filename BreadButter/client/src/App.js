import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import GigDetails from './pages/GigDetails';
import MatchingResults from './pages/MatchingResults';
import TalentBrowser from './pages/TalentBrowser';
import CreateGig from './pages/CreateGig';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/gigs/:id" element={<GigDetails />} />
          <Route path="/gigs/:id/matches" element={<MatchingResults />} />
          <Route path="/talent" element={<TalentBrowser />} />
          <Route path="/create-gig" element={<CreateGig />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

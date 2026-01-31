import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { API_URL } from './api/config';
import './App.css';
import Inscription from './components/Inscription';
import Validation from './components/Validation';
import Classement from './components/Classement';
import Admin from './components/Admin';
import Navigation from './components/Navigation';
import ContestInfo from './components/ContestInfo';

function App() {
  const [activeContest, setActiveContest] = useState<any>(null);

  useEffect(() => {
    fetchActiveContest();
  }, []);

  const fetchActiveContest = async () => {
    try {
      const response = await fetch(`${API_URL}/contest/active`);
      const data = await response.json();
      setActiveContest(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du contest actif:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        <ContestInfo activeContest={activeContest} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/inscription" replace />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/classement" element={<Classement />} />
            <Route path="/admin" element={<Admin onContestChange={fetchActiveContest} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

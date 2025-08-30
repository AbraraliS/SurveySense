import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import CreateSurvey from './components/CreateSurvey';
import TakeSurvey from './components/TakeSurvey';
import Results from './components/Results';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateSurvey />} />
            <Route path="/survey/:surveyId" element={<TakeSurvey />} />
            <Route path="/results/:surveyId" element={<Results />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
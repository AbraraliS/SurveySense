import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import CreateSurvey from './components/CreateSurvey';
import YourSurveys from './components/YourSurveys';
import EditSurvey from './components/EditSurvey';
import TakeSurvey from './components/TakeSurvey';
import SurveyResultsPage from './components/SurveyResultsPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Router>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateSurvey />} />
            <Route path="/surveys" element={<YourSurveys />} />
            {/* Keep the old route for backward compatibility */}
            <Route path="/edit/:surveyId" element={<EditSurvey />} />
            {/* Add the new route to match the URL pattern from YourSurveys */}
            <Route path="/survey/:surveyId/edit" element={<EditSurvey />} />
            <Route path="/survey/:surveyId" element={<TakeSurvey />} />
            <Route path="/survey/:surveyId/results" element={<SurveyResultsPage />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
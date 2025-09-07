import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import CreateSurvey from './components/CreateSurvey';
import YourSurveys from './components/YourSurveys';
import EditSurvey from './components/EditSurvey';
import SurveyResultsPage from './components/SurveyResultsPage';
import MLInsightsPage from './components/MLInsights/MLInsightsPage';
import TakeSurvey from './components/TakeSurvey';
import Results from './components/Results';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SurveyResults } from './components/MLInsights/MLInsightsPage';

function MLInsightsPageWrapper() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your actual fetch logic
    async function fetchResults() {
      setLoading(true);
      // Example: fetch(`/api/surveys/${surveyId}/results`)
      //   .then(res => res.json())
      //   .then(data => { setResults(data); setLoading(false); });
      // For now, just set dummy data or handle as needed
      setResults({} as SurveyResults);
      setLoading(false);
    }
    if (surveyId) {
      fetchResults();
    }
  }, [surveyId]);

  if (loading) return <div>Loading...</div>;
  if (!results) return <div>No results found.</div>;
  return <MLInsightsPage results={results} />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/survey/:surveyId" element={<TakeSurvey />} />
              <Route path="/survey/:surveyId/thank-you" element={<Results />} />
              
              {/* Protected Routes (Require Authentication) */}
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateSurvey />
                </ProtectedRoute>
              } />
              <Route path="/surveys" element={
                <ProtectedRoute>
                  <YourSurveys />
                </ProtectedRoute>
              } />
              <Route path="/survey/:surveyId/edit" element={
                <ProtectedRoute>
                  <EditSurvey />
                </ProtectedRoute>
              } />
              <Route path="/survey/:surveyId/results" element={
                <ProtectedRoute>
                  <SurveyResultsPage />
                </ProtectedRoute>
              } />
              <Route path="/survey/:surveyId/insights" element={
                <ProtectedRoute>
                  <MLInsightsPageWrapper />
                </ProtectedRoute>
              } />
              
              {/* Fallback Route */}
              <Route path="*" element={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
                  <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.006-6-2.709M15 11V7a3 3 0 00-3-3H8a3 3 0 00-3 3v4.582m12-1.582V11a3 3 0 00-3-3H8a3 3 0 00-3 3v.582" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                    <Link 
                      to="/" 
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <span>Go Home</span>
                    </Link>
                  </div>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

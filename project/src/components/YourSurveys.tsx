import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Share2, 
  Calendar,
  Users,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api, { getAllSurveys, deleteSurvey, Survey } from '../services/api';
import ShareModal from './ShareModal'; // Add this import

const YourSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'popular'>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  
  // Add these states for ShareModal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [surveyToShare, setSurveyToShare] = useState<Survey | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllSurveys();
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        setSurveys(response);
      } else if (response && Array.isArray(response.data)) {
        setSurveys(response.data);
      } else {
        console.warn('Unexpected response format:', response);
        setSurveys([]); // Fallback to empty array
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setError('Failed to load surveys');
      setSurveys([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) {
      return;
    }

    try {
      // Call the correct endpoint that matches your backend
      await api.delete(`/survey/${surveyId}`); // This matches your backend route
      setSurveys(prev => prev.filter(survey => survey.survey_id !== surveyId));
    } catch (error) {
      console.error('Error deleting survey:', error);
      setError('Failed to delete survey');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter surveys with null checks
  const filteredSurveys = (surveys || []).filter(survey => {
    if (!survey) return false; // Skip null/undefined surveys
    
    const matchesSearch = !searchTerm || 
      (survey.topic && survey.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (survey.audience && survey.audience.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'recent' && new Date(survey.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (filterBy === 'popular' && (survey.responses_count || 0) > 10);

    return matchesSearch && matchesFilter;
  });

  const handleShareSurvey = (survey: Survey) => {
    setSurveyToShare(survey);
    setShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your surveys...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Surveys</h1>
              <p className="text-gray-600">Manage and analyze your survey responses</p>
            </div>
            <Link
              to="/create"
              className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Survey</span>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
              <button 
                onClick={fetchSurveys}
                className="ml-auto text-red-600 hover:text-red-800 underline text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search surveys by topic or audience..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Surveys</option>
                  <option value="recent">Recent (7 days)</option>
                  <option value="popular">Popular (10+ responses)</option>
                </select>
                <div className="text-sm text-gray-600">
                  {(filteredSurveys || []).length} survey{(filteredSurveys || []).length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Survey Grid */}
          {(filteredSurveys || []).length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterBy !== 'all' ? 'No surveys found' : 'No surveys yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first survey to start collecting valuable insights.'
                }
              </p>
              {!searchTerm && filterBy === 'all' && (
                <Link
                  to="/create"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Survey</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredSurveys || []).map((survey) => {
                if (!survey) return null; // Skip invalid survey objects
                
                return (
                  <div key={survey.survey_id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {survey.topic || 'Untitled Survey'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Target: {survey.audience || 'General'}
                          </p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setSelectedSurvey(selectedSurvey === survey.survey_id ? null : survey.survey_id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {selectedSurvey === survey.survey_id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <Link
                                to={`/survey/${survey.survey_id}/edit`}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                onClick={() => setSelectedSurvey(null)}
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit Survey</span>
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedSurvey(null);
                                  handleDeleteSurvey(survey.survey_id);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-b-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Survey</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {survey.questions_count || survey.num_questions || 0}
                          </div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {survey.responses_count || 0}
                          </div>
                          <div className="text-xs text-gray-500">Responses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {survey.responses_count ? Math.round((survey.responses_count / 100) * 87) : 0}%
                          </div>
                          <div className="text-xs text-gray-500">Completion</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(survey.created_at)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Link
                          to={`/survey/${survey.survey_id}/results`}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center block group-hover:shadow-lg"
                        >
                          View Analytics
                        </Link>
                        <button
                          onClick={() => handleShareSurvey(survey)}
                          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center block"
                        >
                          Share Survey
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add ShareModal at the end, before closing div */}
      {surveyToShare && (
        <ShareModal
          survey={surveyToShare}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSurveyToShare(null);
          }}
        />
      )}
    </div>
  );
};

export default YourSurveys;
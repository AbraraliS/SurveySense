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
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import api, { getAllSurveys, deleteSurvey, Survey } from '../services/api';
import ShareModal from './ShareModal';

const YourSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'popular'>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [surveyToShare, setSurveyToShare] = useState<Survey | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setSelectedSurvey(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllSurveys();
      
      if (Array.isArray(response)) {
        setSurveys(response);
      } else if (response && Array.isArray(response.data)) {
        setSurveys(response.data);
      } else {
        console.warn('Unexpected response format:', response);
        setSurveys([]);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setError('Failed to load surveys');
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) {
      return;
    }

    try {
      await api.delete(`/survey/${surveyId}`);
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

  const filteredSurveys = (surveys || []).filter(survey => {
    if (!survey) return false;
    
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

  const filterOptions = [
    { value: 'all', label: 'All Surveys' },
    { value: 'recent', label: 'Recent (7 days)' },
    { value: 'popular', label: 'Popular (10+ responses)' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">Loading your surveys...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Your Surveys
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage and analyze your survey responses
              </p>
            </div>
            <Link
              to="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Survey</span>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm sm:text-base flex-1">{error}</p>
              <button 
                onClick={fetchSurveys}
                className="text-red-600 hover:text-red-800 underline text-sm self-end sm:self-auto"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            {/* Desktop Layout */}
            <div className="hidden sm:flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search surveys by topic or audience..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {(filteredSurveys || []).length} survey{(filteredSurveys || []).length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  <span>{filterOptions.find(opt => opt.value === filterBy)?.label}</span>
                  <Menu className="w-4 h-4" />
                </button>
                
                <div className="text-sm text-gray-600">
                  {(filteredSurveys || []).length} result{(filteredSurveys || []).length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Mobile Filter Dropdown */}
              {showMobileFilters && (
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterBy(option.value as any);
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 ${
                        filterBy === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Survey Grid */}
          {(filteredSurveys || []).length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <BarChart3 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterBy !== 'all' ? 'No surveys found' : 'No surveys yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first survey to start collecting valuable insights.'
                }
              </p>
              {!searchTerm && filterBy === 'all' && (
                <Link
                  to="/create"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create Your First Survey</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {(filteredSurveys || []).map((survey) => {
                if (!survey) return null;
                
                return (
                  <div key={survey.survey_id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {survey.topic || 'Untitled Survey'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 truncate">
                            Target: {survey.audience || 'General'}
                          </p>
                        </div>
                        <div className="relative dropdown-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSurvey(selectedSurvey === survey.survey_id ? null : survey.survey_id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {selectedSurvey === survey.survey_id && (
                            <div className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              <Link
                                to={`/survey/${survey.survey_id}/edit`}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
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
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-b-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Survey</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-bold text-blue-600">
                            {survey.questions_count || survey.num_questions || 0}
                          </div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-bold text-green-600">
                            {survey.responses_count || 0}
                          </div>
                          <div className="text-xs text-gray-500">Responses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-bold text-purple-600">
                            {survey.responses_count ? Math.round((survey.responses_count / 100) * 87) : 0}%
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="hidden sm:inline">Completion</span>
                            <span className="sm:hidden">Complete</span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-4">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span>Created {formatDate(survey.created_at)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 sm:space-y-3">
                        <Link
                          to={`/survey/${survey.survey_id}/results`}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center block text-sm sm:text-base"
                        >
                          View Analytics
                        </Link>
                        <button
                          onClick={() => handleShareSurvey(survey)}
                          className="w-full bg-gray-100 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center block text-sm sm:text-base"
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

      {/* ShareModal */}
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
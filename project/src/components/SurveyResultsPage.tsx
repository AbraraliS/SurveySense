import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  Download, 
  Search,
  User,
  Mail,
  Globe,
  ArrowLeft,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
  MessageSquare,
  PieChart,
  Activity,
  Share2,
  Copy,
  Brain,
  Menu
} from 'lucide-react';
import { getSurveyResults, SurveyResults, SurveyResponse } from '../services/api';

// Import ML Components
import MLInsightsPage from './MLInsights/MLInsightsPage';
import OverviewTab from './SurveyTabs/OverviewTab';
import ResponsesTab from './SurveyTabs/ResponsesTab';
import AnalyticsTab from './SurveyTabs/AnalyticsTab';

const SurveyResultsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'responses' | 'analytics' | 'ml-insights'>('overview');
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (surveyId) {
      fetchResults();
    }
  }, [surveyId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getSurveyResults(surveyId!);
      
      setResults(response.data);
    } catch (error) {
      
      setError('Failed to load survey results');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copySurveyLink = async () => {
    try {
      const surveyLink = `${window.location.origin}/survey/${surveyId}`;
      await navigator.clipboard.writeText(surveyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      
    }
  };

  const downloadResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `survey-results-${surveyId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">Loading survey results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12">
            <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-red-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">{error}</p>
            <button
              onClick={fetchResults}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12">
            <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">Unable to load survey results</p>
            <Link
              to="/surveys"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Back to Surveys</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'responses', label: 'Responses', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'ml-insights', label: 'AI Insights', icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            {/* Top Header Row */}
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <Link
                to="/surveys"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors flex-shrink-0 mt-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight pr-2">
                  {results.survey.topic}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  <span className="hidden sm:inline">Survey Results & Analytics • </span>
                  <span className="sm:hidden">Results • </span>
                  Target: {results.survey.audience}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <button
                onClick={copySurveyLink}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Survey Link'}</span>
              </button>
              <button
                onClick={downloadResults}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Export Results</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {results.analytics.total_responses}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="sm:hidden">Responses</span>
                      <span className="hidden sm:inline">Total Responses</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {results.analytics.completion_rate}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="sm:hidden">Complete</span>
                      <span className="hidden sm:inline">Completion Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {Math.floor(results.analytics.average_completion_time / 60)}m {results.analytics.average_completion_time % 60}s
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="sm:hidden">Avg Time</span>
                      <span className="hidden sm:inline">Avg. Time</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {results.survey.questions_count}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Questions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Desktop */}
            <div className="hidden sm:block border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Navigation - Mobile */}
            <div className="sm:hidden">
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg text-left font-medium text-gray-900"
                >
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const Icon = tabs.find(tab => tab.id === selectedTab)?.icon;
                      return Icon ? <Icon className="w-4 h-4" /> : null;
                    })()}
                    <span>{tabs.find(tab => tab.id === selectedTab)?.label}</span>
                  </div>
                  <Menu className="w-4 h-4 text-gray-400" />
                </button>

                {/* Mobile Dropdown */}
                {isMobileMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedTab(tab.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border overflow-hidden">
            {selectedTab === 'overview' && <OverviewTab results={results} />}
            {selectedTab === 'responses' && <ResponsesTab results={results} />}
            {selectedTab === 'analytics' && <AnalyticsTab results={results} />}
            {selectedTab === 'ml-insights' && <MLInsightsPage results={results} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsPage;

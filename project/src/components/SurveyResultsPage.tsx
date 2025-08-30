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
  Brain
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

  useEffect(() => {
    if (surveyId) {
      fetchResults();
    }
  }, [surveyId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching results for survey:', surveyId);
      const response = await getSurveyResults(surveyId!);
      console.log('Results received:', response);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
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
      console.error('Failed to copy link:', error);
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading survey results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchResults}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-6">Unable to load survey results</p>
            <Link
              to="/surveys"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Surveys</span>
            </Link>
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
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                to="/surveys"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{results.survey.topic}</h1>
                <p className="text-gray-600">Survey Results & Analytics • Target: {results.survey.audience}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={copySurveyLink}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={downloadResults}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{results.analytics.total_responses}</div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{results.analytics.completion_rate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.floor(results.analytics.average_completion_time / 60)}m {results.analytics.average_completion_time % 60}s
                    </div>
                    <div className="text-sm text-gray-600">Avg. Time</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{results.survey.questions_count}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'responses', label: 'User Responses', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                  { id: 'ml-insights', label: 'AI Insights', icon: Brain }
                ].map(tab => (
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
          </div>

          {/* Tab Content */}
          {selectedTab === 'overview' && <OverviewTab results={results} />}
          {selectedTab === 'responses' && <ResponsesTab results={results} />}
          {selectedTab === 'analytics' && <AnalyticsTab results={results} />}
          {selectedTab === 'ml-insights' && <MLInsightsPage results={results} />}
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsPage;
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
  List
} from 'lucide-react';
import { getSurveyResults, SurveyResults, SurveyResponse } from '../services/api';

const SurveyResultsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'responses' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'registered' | 'anonymous'>('all');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Analytics calculations
  const getAnalyticsData = () => {
    if (!results) return null;

    // Response trend over time
    const responseTrend = Object.entries(results.analytics.response_by_date).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Question type distribution
    const questionTypes = results.questions.reduce((acc, q) => {
      acc[q.question_type] = (acc[q.question_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Response distribution by question
    const questionAnalytics = results.questions.map(question => {
      const responses = results.responses.map(r => r.responses[question.question_id]).filter(Boolean);
      
      if (question.question_type === 'MCQ' && question.options) {
        const optionCounts = question.options.reduce((acc, option) => {
          acc[option] = responses.filter(r => r === option).length;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          question_id: question.question_id,
          question_text: question.question_text,
          type: 'MCQ',
          total_responses: responses.length,
          data: {
            labels: Object.keys(optionCounts),
            values: Object.values(optionCounts)
          }
        };
      } else {
        return {
          question_id: question.question_id,
          question_text: question.question_text,
          type: 'TEXT',
          total_responses: responses.length,
          responses: responses
        };
      }
    });

    // User type distribution
    const registeredUsers = results.responses.filter(r => r.user_id).length;
    const anonymousUsers = results.responses.length - registeredUsers;

    return {
      responseTrend,
      questionTypes,
      questionAnalytics,
      userTypes: {
        registered: registeredUsers,
        anonymous: anonymousUsers
      }
    };
  };

  const analyticsData = getAnalyticsData();

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

  const filteredResponses = results?.responses.filter(response => {
    const matchesSearch = !searchTerm || 
      (response.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.user_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.response_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'registered' && response.user_id) ||
      (filterBy === 'anonymous' && !response.user_id);

    return matchesSearch && matchesFilter;
  }) || [];

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
                      {formatDuration(results.analytics.average_completion_time)}
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
                  {
                    id: 'overview',
                    label: 'Overview',
                    icon: BarChart3
                  },
                  {
                    id: 'responses',
                    label: 'User Responses',
                    icon: Users
                  },
                  {
                    id: 'analytics',
                    label: 'Analytics',
                    icon: TrendingUp
                  }
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
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* Survey Summary */}
              <div className="bg-white rounded-2xl shadow-sm border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Survey Summary</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(results.survey.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Questions:</span>
                        <span className="font-medium">{results.survey.questions_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Audience:</span>
                        <span className="font-medium">{results.survey.audience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Survey ID:</span>
                        <span className="font-mono text-sm">{results.survey.survey_id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Responses:</span>
                        <span className="font-medium text-blue-600">{results.analytics.total_responses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registered Users:</span>
                        <span className="font-medium text-green-600">{analyticsData?.userTypes.registered || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Anonymous Users:</span>
                        <span className="font-medium text-purple-600">{analyticsData?.userTypes.anonymous || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-medium text-orange-600">{results.analytics.completion_rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Types Overview */}
              {analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <PieChart className="w-5 h-5 text-blue-600" />
                      <span>Question Types</span>
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(analyticsData.questionTypes).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            {type === 'MCQ' ? <List className="w-4 h-4 text-green-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                            <span className="text-gray-600">{type === 'MCQ' ? 'Multiple Choice' : 'Text Response'}</span>
                          </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>User Distribution</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Registered Users</span>
                          <span className="font-semibold">{analyticsData.userTypes.registered}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${results.analytics.total_responses > 0 ? (analyticsData.userTypes.registered / results.analytics.total_responses) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Anonymous Users</span>
                          <span className="font-semibold">{analyticsData.userTypes.anonymous}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${results.analytics.total_responses > 0 ? (analyticsData.userTypes.anonymous / results.analytics.total_responses) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Responses */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Recent Activity</span>
                </h3>
                {results.responses.length > 0 ? (
                  <div className="space-y-3">
                    {results.responses.slice(0, 5).map((response) => (
                      <div key={response.response_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{response.user_name || 'Anonymous User'}</p>
                            <p className="text-xs text-gray-500">{formatDate(response.submitted_at)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {response.user_id ? 'Registered' : 'Anonymous'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No responses yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && analyticsData && (
            <div className="space-y-8">
              {/* Response Trend */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Response Trend</span>
                </h3>
                {analyticsData.responseTrend.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.responseTrend.map(({ date, count }) => (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-gray-600">{formatDate(date)}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.max(10, (count / Math.max(...analyticsData.responseTrend.map(t => t.count))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No trend data available</p>
                )}
              </div>

              {/* Question Analytics */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>Question Analysis</span>
                </h3>
                
                {analyticsData.questionAnalytics.map((question) => (
                  <div key={question.question_id} className="bg-white rounded-2xl shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">{question.question_text}</h4>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">
                        {question.type === 'MCQ' ? 'Multiple Choice' : 'Text Response'}
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {question.total_responses} responses
                      </span>
                    </div>
                    
                    {question.type === 'MCQ' && question.data ? (
                      <div className="space-y-3">
                        {question.data.labels.map((label, index) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-gray-700">{label}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${question.total_responses > 0 ? (question.data.values[index] / question.total_responses) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="font-semibold w-8 text-right">{question.data.values[index]}</span>
                              <span className="text-sm text-gray-500 w-12 text-right">
                                {question.total_responses > 0 ? Math.round((question.data.values[index] / question.total_responses) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 mb-3">Sample responses:</p>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {question.responses?.slice(0, 3).map((response, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{response}</p>
                            </div>
                          ))}
                        </div>
                        {(question.responses?.length || 0) > 3 && (
                          <p className="text-xs text-gray-500 mt-2">
                            And {(question.responses?.length || 0) - 3} more responses...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'responses' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Responses</option>
                      <option value="registered">Registered Users</option>
                      <option value="anonymous">Anonymous Users</option>
                    </select>
                  </div>

                  <div className="text-sm text-gray-600">
                    {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Responses Table */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Response ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResponses.map((response) => (
                        <tr key={response.response_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {response.user_name || 'Anonymous User'}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center space-x-2">
                                  {response.user_email ? (
                                    <span className="flex items-center space-x-1">
                                      <Mail className="w-3 h-3" />
                                      <span>{response.user_email}</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <Globe className="w-3 h-3" />
                                      <span>{response.user_ip || 'Unknown IP'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">
                              {response.response_id.substring(0, 8)}...
                            </div>
                            <div className="text-xs text-gray-500">
                              {response.user_id ? 'Registered' : 'Anonymous'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(response.submitted_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {response.completion_time ? formatDuration(response.completion_time) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedResponse(response)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredResponses.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterBy !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No one has responded to this survey yet.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response Detail Modal */}
          {selectedResponse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Response Details</h2>
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{selectedResponse.user_name || 'Anonymous'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedResponse.user_email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">User ID</p>
                        <p className="font-medium font-mono">{selectedResponse.user_id || 'Anonymous'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IP Address</p>
                        <p className="font-medium">{selectedResponse.user_ip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Submitted At</p>
                        <p className="font-medium">{formatDate(selectedResponse.submitted_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Time</p>
                        <p className="font-medium">
                          {selectedResponse.completion_time ? formatDuration(selectedResponse.completion_time) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Responses</h3>
                    <div className="space-y-4">
                      {results.questions.map((question) => (
                        <div key={question.question_id} className="border rounded-lg p-4">
                          <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-800">
                              {selectedResponse.responses[question.question_id] || 'No response'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsPage;
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Share2, BarChart3, Users, TrendingUp, MessageSquare, Loader2, Copy, Check } from 'lucide-react';
import { getSurveyResults, SurveyResults } from '../services/api';

const Results: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [data, setData] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (surveyId) {
      fetchResults();
    }
  }, [surveyId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await getSurveyResults(surveyId!);
      setData(response);
    } catch (err: any) {
      console.error('Failed to load results:', err);
      setError('Failed to load survey results');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading survey results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h1>
          <p className="text-gray-600 mb-6">{error || 'Survey results not found'}</p>
          <Link
            to="/surveys"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Back to Surveys</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalResponses = data.responses.length;
  const uniqueSessions = new Set(data.responses.map(r => r.response_id)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.survey.topic}</h1>
                <p className="text-gray-600">Target Audience: {data.survey.audience}</p>
                <p className="text-sm text-gray-500 mt-2">Created: {formatDate(data.survey.created_at)}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copySurveyLink}
                  className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                
                <Link
                  to={`/survey/${surveyId}`}
                  target="_blank"
                  className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>View Survey</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{totalResponses}</div>
              <div className="text-sm text-gray-600">Total Respondents</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{data.questions.length}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{uniqueSessions}</div>
              <div className="text-sm text-gray-600">Unique Sessions</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {data.analytics?.responseRate || 0}%
              </div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </div>

          {/* Questions and Responses */}
          <div className="space-y-6">
            {data.questions.map((question, index) => {
              // Get responses for this question from all survey responses
              const questionResponses = data.responses.flatMap(response => 
                response.responses
                  .filter(r => r.question_id === question.question_id)
                  .map(r => ({ ...r, response_id: response.response_id, created_at: response.created_at }))
              );
              
              return (
                <div key={question.question_id} className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {index + 1}. {question.question_text || question.question}
                  </h3>
                  
                  {question.question_type === 'MCQ' ? (
                    <div className="space-y-3">
                      {question.options?.map((option, optionIndex) => {
                        const optionCount = questionResponses.filter(r => r.answer === option).length;
                        const percentage = questionResponses.length > 0 ? (optionCount / questionResponses.length) * 100 : 0;
                        
                        return (
                          <div key={optionIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">{option}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                {optionCount} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-2">
                        {questionResponses.length} text responses
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {questionResponses.map((response, responseIndex) => (
                          <div key={responseIndex} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-700 text-sm">{response.answer}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              - Response {responseIndex + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Back to Surveys */}
          <div className="mt-8 text-center">
            <Link
              to="/surveys"
              className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Back to My Surveys</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
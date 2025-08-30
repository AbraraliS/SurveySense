import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  User, 
  Calendar, 
  Phone, 
  Briefcase, 
  Loader2, 
  Eye, 
  Clock,
  MessageSquare,
  List,
  ChevronDown,
  ChevronUp,
  Home
} from 'lucide-react';
import { getSurvey, submitSurveyResponse } from '../services/api';

interface Question {
  question_id: string;
  question: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
}

interface SurveyData {
  survey_id: string;
  topic: string;
  audience: string;
  questions: Question[];
}

interface UserDetails {
  name: string;
  age: string;
  contact: string;
  occupation: string;
}

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [currentStep, setCurrentStep] = useState<'userDetails' | 'questions' | 'submitted'>('userDetails');
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    age: '',
    contact: '',
    occupation: ''
  });
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userDetailsErrors, setUserDetailsErrors] = useState<Record<string, string>>({});
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const [showResponseDetails, setShowResponseDetails] = useState(false);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  useEffect(() => {
    if (currentStep === 'questions' && !startTime) {
      setStartTime(new Date());
    }
  }, [currentStep, startTime]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const response = await getSurvey(surveyId!);
      setSurvey(response.data);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const validateUserDetails = () => {
    const errors: Record<string, string> = {};
    
    if (!userDetails.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!userDetails.age.trim()) {
      errors.age = 'Age is required';
    } else {
      const age = parseInt(userDetails.age);
      if (isNaN(age) || age < 1 || age > 150) {
        errors.age = 'Please enter a valid age (1-150)';
      }
    }
    
    if (!userDetails.contact.trim()) {
      errors.contact = 'Contact is required';
    }
    
    setUserDetailsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUserDetails()) {
      setCurrentStep('questions');
    }
  };

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!survey) return;
    
    // Check if all questions are answered
    const unanswered = survey.questions.filter(q => !responses[q.question_id]);
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Calculate completion time
      const endTime = new Date();
      if (startTime) {
        const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        setCompletionTime(timeTaken);
      }

      // Format responses for the API
      const formattedResponses: Record<string, string> = {};
      survey.questions.forEach(q => {
        formattedResponses[q.question_id] = responses[q.question_id];
      });

      await submitSurveyResponse(surveyId!, {
        user_name: userDetails.name,
        user_email: userDetails.contact.includes('@') ? userDetails.contact : undefined,
        responses: formattedResponses
      });

      setSubmissionTime(endTime);
      setCurrentStep('submitted');
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckResponse = () => {
    // Navigate to survey results page
    navigate(`/survey/${surveyId}/results`);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseSummary = () => {
    if (!survey) return { mcqCount: 0, textCount: 0, totalWords: 0 };
    
    let mcqCount = 0;
    let textCount = 0;
    let totalWords = 0;

    survey.questions.forEach(question => {
      const response = responses[question.question_id];
      if (response) {
        if (question.type === 'MCQ') {
          mcqCount++;
        } else {
          textCount++;
          totalWords += response.split(' ').filter(word => word.trim() !== '').length;
        }
      }
    });

    return { mcqCount, textCount, totalWords };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Survey not found</p>
        </div>
      </div>
    );
  }

  // User Details Step
  if (currentStep === 'userDetails') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey: {survey.topic}</h1>
                <p className="text-gray-600">Please provide your details to continue</p>
              </div>

              <form onSubmit={handleUserDetailsSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Name *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      userDetailsErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {userDetailsErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{userDetailsErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Age *
                    </span>
                  </label>
                  <input
                    type="number"
                    value={userDetails.age}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, age: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      userDetailsErrors.age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your age"
                    min="1"
                    max="150"
                  />
                  {userDetailsErrors.age && (
                    <p className="mt-1 text-sm text-red-600">{userDetailsErrors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={userDetails.contact}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, contact: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      userDetailsErrors.contact ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Email or phone number"
                  />
                  {userDetailsErrors.contact && (
                    <p className="mt-1 text-sm text-red-600">{userDetailsErrors.contact}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Occupation
                    </span>
                  </label>
                  <input
                    type="text"
                    value={userDetails.occupation}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, occupation: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your occupation (optional)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue to Survey
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questions Step
  if (currentStep === 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.topic}</h1>
                <p className="text-gray-600">Target Audience: {survey.audience}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Welcome, {userDetails.name}! Please answer all questions below.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {survey.questions.map((question, index) => (
                  <div key={question.question_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {index + 1}. {question.question}
                    </h3>
                    
                    {question.type === 'MCQ' ? (
                      <div className="space-y-3">
                        {question.options?.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={question.question_id}
                              value={option}
                              onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                              className="mr-3 text-blue-600"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={responses[question.question_id] || ''}
                        onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your answer here"
                        rows={4}
                      />
                    )}
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {submitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    Submit Survey
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submitted Step - Enhanced with Response Details
  if (currentStep === 'submitted') {
    const responseSummary = getResponseSummary();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-800 mb-4">Thank You, {userDetails.name}!</h2>
                <p className="text-lg font-semibold text-green-700 mb-2">
                  Survey completed successfully
                </p>
                <p className="text-gray-600 mb-6">
                  Your responses have been recorded and will help improve our understanding of {survey.audience}.
                </p>
                {submissionTime && (
                  <p className="text-sm text-green-600 font-medium">
                    Submitted on {formatDateTime(submissionTime)}
                  </p>
                )}
              </div>
            </div>

            {/* Response Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Response Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{formatTime(completionTime)}</div>
                  <div className="text-sm text-blue-700">Completion Time</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{survey.questions.length}</div>
                  <div className="text-sm text-green-700">Questions Answered</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <List className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{responseSummary.mcqCount}</div>
                  <div className="text-sm text-purple-700">Multiple Choice</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{responseSummary.totalWords}</div>
                  <div className="text-sm text-orange-700">Words Written</div>
                </div>
              </div>

              {/* User Details */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{userDetails.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Age:</span>
                      <span className="ml-2 font-medium">{userDetails.age}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Contact:</span>
                      <span className="ml-2 font-medium">{userDetails.contact}</span>
                    </div>
                  </div>
                  {userDetails.occupation && (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-600">Occupation:</span>
                        <span className="ml-2 font-medium">{userDetails.occupation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Response Details Toggle */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setShowResponseDetails(!showResponseDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-lg font-semibold text-gray-900">Your Responses</h4>
                  {showResponseDetails ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {showResponseDetails && (
                  <div className="mt-6 space-y-6">
                    {survey.questions.map((question, index) => (
                      <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">
                          {index + 1}. {question.question}
                        </h5>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            {question.type === 'MCQ' ? (
                              <List className="w-4 h-4 text-blue-600 mt-0.5" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-blue-800 font-medium">
                                {responses[question.question_id] || 'No response'}
                              </p>
                              {question.type === 'TEXT' && responses[question.question_id] && (
                                <p className="text-xs text-blue-600 mt-1">
                                  {responses[question.question_id].split(' ').filter(word => word.trim() !== '').length} words
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleCheckResponse}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-lg"
              >
                <Eye className="w-6 h-6" />
                <span>View Survey Results & Analytics</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TakeSurvey;

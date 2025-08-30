import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, User, Calendar, Phone, Briefcase, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

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

      setCurrentStep('submitted');
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  // Submitted Step
  if (currentStep === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-800 mb-2">Thank you for completing the survey!</p>
            <p className="text-gray-600">Your responses have been recorded successfully.</p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TakeSurvey;

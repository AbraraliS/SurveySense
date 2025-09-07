import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Loader2, 
  MessageSquare,
  List,
  User,
  Mail,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { getPublicSurvey, submitSurveyResponse } from '../services/api';

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

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'userDetails' | 'questions' | 'submitted'>('userDetails');
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    age: '',
    occupation: ''
  });
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const response = await getPublicSurvey(surveyId!);
      setSurvey(response.data);
    } catch (error) {
      console.error('Failed to load survey:', error);
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleUserDetailsChange = (field: 'name' | 'email' | 'age' | 'occupation', value: string) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!userDetails.email.trim()) {
      setError('Please enter your email or contact information');
      return;
    }
    if (!userDetails.age.trim()) {
      setError('Please enter your age');
      return;
    }
    setError('');
    setStartTime(new Date()); // Start the timer when user begins questions
    setCurrentStep('questions');
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
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

    try {
      setSubmitting(true);
      setError('');
      
      // Format responses for the API
      const formattedResponses: Record<string, string> = {};
      survey.questions.forEach(q => {
        formattedResponses[q.question_id] = responses[q.question_id];
      });

      // Calculate completion time
      const endTime = new Date();
      setSubmissionTime(endTime);
      const completionTimeSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;


      const response = await submitSurveyResponse(surveyId!, {
        user_name: userDetails.name,
        user_email: userDetails.email || undefined,
        user_age: userDetails.age,
        user_occupation: userDetails.occupation || undefined,
        completion_time: completionTimeSeconds,
        responses: formattedResponses
      });

      setSubmitted(true);
      setCurrentStep('submitted');
    } catch (error) {
      console.error('Failed to submit survey:', error);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
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
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
          <p className="text-gray-600">The survey you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-green-800 mb-4">Thank You!</h2>
            <p className="text-lg font-semibold text-green-700 mb-2">
              Survey completed successfully
            </p>
            <p className="text-gray-600 mb-6">
              Your responses have been recorded and will help improve our understanding of {survey?.audience}.
            </p>
            {submissionTime && (
              <p className="text-sm text-green-600 font-medium">
                Submitted on {formatDateTime(submissionTime)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Survey not found</p>
        </div>
      </div>
    );
  }

  // User Details Step
  if (currentStep === 'userDetails') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Survey Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.topic}</h1>
                <p className="text-gray-600">Target Audience: {survey.audience}</p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <List className="w-4 h-4" />
                  <span>{survey.questions.length} questions</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* User Details Form */}
              <form onSubmit={handleUserDetailsSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Let's get started!</h2>
                  <p className="text-gray-600">Please provide your details to begin the survey.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={userDetails.name}
                      onChange={(e) => handleUserDetailsChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email or Contact *
                    </label>
                    <input
                      type="text"
                      id="email"
                      value={userDetails.email}
                      onChange={(e) => handleUserDetailsChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email or phone number"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-lg">🎂</span>
                      Age *
                    </label>
                    <input
                      type="number"
                      id="age"
                      value={userDetails.age}
                      onChange={(e) => handleUserDetailsChange('age', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-lg">💼</span>
                      Occupation (Optional)
                    </label>
                    <input
                      type="text"
                      id="occupation"
                      value={userDetails.occupation}
                      onChange={(e) => handleUserDetailsChange('occupation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your occupation or job title"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span>Start Survey</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questions Step
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Survey Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.topic}</h1>
              <p className="text-gray-600">Target Audience: {survey.audience}</p>
              <div className="mt-2 text-sm text-gray-500">
                <span>Respondent: {userDetails.name}</span>
                <span> • {userDetails.email}</span>
                <span> • Age: {userDetails.age}</span>
                {userDetails.occupation && <span> • {userDetails.occupation}</span>}
              </div>
            </div>

            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => setCurrentStep('userDetails')}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Details</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Survey Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {survey.questions.map((question, index) => (
                <div key={question.question_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  
                  {question.type === 'MCQ' ? (
                    <div className="space-y-3">
                      {question.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={question.question_id}
                            value={option}
                            checked={responses[question.question_id] === option}
                            onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={responses[question.question_id] || ''}
                        onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                        placeholder="Enter your response here..."
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Survey</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeSurvey;
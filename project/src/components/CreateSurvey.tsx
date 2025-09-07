import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Users, Hash, Sparkles, Plus, Loader2, CheckCircle, Edit, Share2, Eye } from 'lucide-react';
import { createSurvey, generateQuestions, createQuestion } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';

interface Question {
  question_id: string;
  question: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
}

const CreateSurvey: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Survey data
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [surveyId, setSurveyId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Predefined options for quick selection
  const topicSuggestions = [
    'Customer Satisfaction',
    'Employee Feedback',
    'Product Research',
    'Market Analysis',
    'User Experience',
    'Event Feedback',
    'Brand Awareness',
    'Service Quality'
  ];

  const audienceSuggestions = [
    'General Public',
    'Employees',
    'Customers',
    'Students',
    'Professionals',
    'Teenagers',
    'Seniors',
    'Small Business Owners'
  ];

  const handleGenerateQuestions = async () => {
    if (!topic.trim() || !audience.trim()) {
      setError('Please provide both topic and target audience');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // First create the survey
      const surveyResponse = await createSurvey({
        topic,
        audience,
        num_questions: numQuestions
      });

      const newSurveyId = surveyResponse.data.survey_id;
      setSurveyId(newSurveyId);

      // Then generate questions
      const questionsResponse = await generateQuestions(topic, audience, numQuestions);
      
      if (questionsResponse.data && questionsResponse.data.data && questionsResponse.data.data.questions) {
        setQuestions(questionsResponse.data.data.questions);
        setSuccess('Survey created successfully with AI-generated questions!');
        setStep(2);
      } else {
        throw new Error('No questions generated');
      }

    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Update the handleSubmit function around line 97
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating survey with data:', { topic, audience, numQuestions });
      
      // Step 1: Create the survey
      const response = await createSurvey({
        topic: topic.trim(),
        audience: audience.trim(),
        num_questions: parseInt(numQuestions.toString())
      });

      console.log('Survey creation response:', response);
      
      // Extract survey data from response
      const surveyData = response.data?.data || response.data;
      
      if (!surveyData || !surveyData.survey_id) {
        throw new Error('Survey created but no survey ID returned');
      }

      const newSurveyId = surveyData.survey_id;
      console.log('Survey created successfully:', newSurveyId);
      setSurveyId(newSurveyId);
      
      // Step 2: Try to generate questions
      try {
        console.log('Attempting to generate questions...');
        const questionsResponse = await generateQuestions(topic, audience, numQuestions);
        
        if (questionsResponse.data && questionsResponse.data.data && questionsResponse.data.data.questions) {
          const generatedQuestions = questionsResponse.data.data.questions;
          
          // Step 3: Save each question to the database
          for (let i = 0; i < generatedQuestions.length; i++) {
            const question = generatedQuestions[i];
            
            await createQuestion({
              survey_id: newSurveyId,
              question_text: question.question || question.question_text,
              question_type: question.type === 'multiple_choice' ? 'MCQ' : 'TEXT',
              options: question.options || null,
              order_index: i + 1
            });
          }
          
          console.log(`Saved ${generatedQuestions.length} questions to database`);
          
          // Set questions for display and move to step 2
          setQuestions(generatedQuestions.map((q: any, index: number) => ({
            question_id: `temp_${index}`,
            question: q.question || q.question_text,
            type: q.type === 'multiple_choice' ? 'MCQ' : 'TEXT',
            options: q.options
          })));
          
          setSuccess(`Survey "${topic}" created successfully with ${generatedQuestions.length} AI-generated questions!`);
          setStep(2);
          
        } else {
          throw new Error('No questions generated');
        }
        
      } catch (questionError) {
        console.warn('Question generation failed, but survey was created:', questionError);
        setSuccess(`Survey "${topic}" created successfully! You can add questions manually in the edit page.`);
        
        // Wait 2 seconds then redirect to edit page
        setTimeout(() => {
          navigate(`/survey/${newSurveyId}/edit`);
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Error creating survey:', error);
      setError(error.message || 'Failed to create survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Ensure user is authenticated (this should be handled by ProtectedRoute, but double-check)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to create surveys.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/')}
                className="group p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md self-start"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Create New Survey</h1>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                  Let AI help you create the perfect survey for your needs
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  Step {step} of 2
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-800 text-sm sm:text-base">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800 text-sm sm:text-base">Success!</h4>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Step 1: Survey Setup */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
              <div className="text-center mb-8 sm:mb-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Tell us about your survey
                </h2>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
                  Our AI will generate intelligent, targeted questions based on your topic and audience
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* Topic Section */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                    <Brain className="w-5 h-5 inline mr-2 text-blue-600" />
                    What's your survey topic?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-gray-50 focus:bg-white"
                    placeholder="e.g., Customer satisfaction with online shopping"
                  />
                  
                  {/* Topic Suggestions */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {topicSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setTopic(suggestion)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs sm:text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audience Section */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                    <Users className="w-5 h-5 inline mr-2 text-purple-600" />
                    Who is your target audience?
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-gray-50 focus:bg-white"
                    placeholder="e.g., Online shoppers aged 25-45"
                  />
                  
                  {/* Audience Suggestions */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">Common audiences:</p>
                    <div className="flex flex-wrap gap-2">
                      {audienceSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAudience(suggestion)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs sm:text-sm rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                    <Hash className="w-5 h-5 inline mr-2 text-green-600" />
                    How many questions do you need?
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-lg min-w-[4rem] text-center">
                      {numQuestions}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>3 questions</span>
                    <span>15 questions</span>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4 sm:pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !topic.trim() || !audience.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Creating survey...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        <span>Create Survey</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    After creation, you can choose to generate questions automatically or create your own.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview Generated Questions */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Your Survey is Ready!
                </h2>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
                  AI has generated {questions.length} intelligent questions for your survey about "{topic}"
                </p>
              </div>

              {/* Survey Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{topic}</p>
                    <p className="text-sm text-gray-600">Topic</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{audience}</p>
                    <p className="text-sm text-gray-600">Audience</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{questions.length}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-4 sm:space-y-6 mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Generated Questions:</h3>
                {questions.map((question, index) => (
                  <div key={question.question_id} className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{question.question}</p>
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {question.type === 'MCQ' ? 'Multiple Choice' : 'Text Answer'}
                          </span>
                          {question.type === 'MCQ' && question.options && (
                            <span className="text-gray-500 text-xs">
                              {question.options.length} options
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate(`/survey/${surveyId}/edit`)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Survey</span>
                  </button>
                  
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-base sm:text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share Survey</span>
                  </button>
                </div>
                
                {/* Secondary Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate(`/survey/${surveyId}`)}
                    target="_blank"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Survey</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setStep(1);
                      setQuestions([]);
                      setSurveyId('');
                      setSuccess('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Create Another Survey
                  </button>
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-gray-500 mt-4">
                You can further customize these questions, add more, or modify the survey settings in the next step.
              </p>
            </div>
          )}

          {/* Share Modal */}
          {showShareModal && surveyId && (
            <ShareModal
              survey={{
                survey_id: surveyId,
                topic: topic,
                audience: audience,
                num_questions: numQuestions,
                created_at: new Date().toISOString(),
                questions_count: questions.length,
                responses_count: 0
              }}
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSurvey;

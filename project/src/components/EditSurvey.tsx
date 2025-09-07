import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Loader2, GripVertical, Edit3, Type, List, PlusCircle } from 'lucide-react';
import { getSurvey, updateSurvey, getQuestions, getResponses, updateQuestion, createQuestion } from '../services/api';

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Question {
  question_id: string;
  question: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
  isNew?: boolean;
}

interface Survey {
  survey_id: string;
  topic: string;
  audience: string;
  num_questions: number;
  questions_count: number;
  responses_count: number;
  created_at: string;
  created_by: string;
  questions: Question[];
}

const EditSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch survey data
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!surveyId) {
        setError('No survey ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Get survey data
        const surveyResponse = await getSurvey(surveyId);
        const surveyData = surveyResponse.data;
        
        if (!surveyData) {
          throw new Error('No survey data returned');
        }

        // Set survey with questions
        setSurvey({
          survey_id: surveyData.survey_id,
          topic: surveyData.topic,
          audience: surveyData.audience,
          num_questions: surveyData.num_questions || 0,
          questions_count: surveyData.questions_count || 0,
          responses_count: surveyData.responses_count || 0,
          created_at: surveyData.created_at,
          created_by: surveyData.created_by,
          questions: []
        });

        // Get questions separately
        try {
          const questionsResponse = await getQuestions(surveyId);
          const questions = questionsResponse.data || [];
          
          console.log('Raw questions from API:', questions);
          
          // Map the API response to match the component's expected format
          const mappedQuestions = questions.map((q: any) => ({
            question_id: q.question_id,
            question: q.question_text || q.question || '', // Map question_text to question
            type: q.question_type === 'MCQ' ? 'MCQ' : 'TEXT',
            options: q.options || undefined
          }));
          
          console.log('Mapped questions:', mappedQuestions);
          
          setSurvey(prev => prev ? { ...prev, questions: mappedQuestions } : null);
        } catch (questionsError) {
          console.warn('Failed to fetch questions:', questionsError);
        }

      } catch (error: any) {
        console.error('Error fetching survey data:', error);
        setError(`Failed to load survey: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [surveyId]);

  // Handle survey field changes
  const handleSurveyChange = (field: 'topic' | 'audience', value: string) => {
    setSurvey(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Handle question changes
  const handleQuestionChange = (questionId: string, field: 'question' | 'type', value: string) => {
    setSurvey(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.question_id === questionId 
            ? { ...q, [field]: value, ...(field === 'type' && value === 'TEXT' ? { options: undefined } : {}) }
            : q
        )
      };
    });
  };

  // Handle option changes
  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setSurvey(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.question_id === questionId && q.options
            ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
            : q
        )
      };
    });
  };

  // Add option to question
  const addOption = (questionId: string) => {
    setSurvey(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.question_id === questionId
            ? { ...q, options: [...(q.options || []), 'New option'] }
            : q
        )
      };
    });
  };

  // Remove option from question
  const removeOption = (questionId: string, optionIndex: number) => {
    setSurvey(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.question_id === questionId && q.options
            ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
            : q
        )
      };
    });
  };

  // Add new question
  const addQuestion = (type: 'MCQ' | 'TEXT' = 'MCQ') => {
    if (!survey) return;

    const newQuestion: Question = {
      question_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: '',
      type: type,
      options: type === 'MCQ' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
      isNew: true
    };

    setSurvey(prev => prev ? {
      ...prev,
      questions: [...prev.questions, newQuestion]
    } : null);

    // Scroll to new question
    setTimeout(() => {
      const element = document.getElementById(`question-${newQuestion.question_id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Remove question
  const removeQuestion = (questionId: string) => {
    if (!survey) return;

    setSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.filter(q => q.question_id !== questionId)
    } : null);
  };

  // Save survey and questions
  const saveSurvey = async () => {
    if (!survey) return;

    try {
      setSaving(true);
      setError('');

      // Update survey details
      await updateSurvey(surveyId!, {
        topic: survey.topic,
        audience: survey.audience,
        num_questions: survey.questions.length
      });

      // Save each question
      for (const question of survey.questions) {
        if (question.isNew) {
          await createQuestion({
            survey_id: surveyId,
            question_text: question.question,
            question_type: question.type,
            options: question.type === 'MCQ' ? question.options : undefined,
            order_index: survey.questions.indexOf(question) + 1
          });
        } else {
          await updateQuestion(question.question_id, {
            question_text: question.question,
            question_type: question.type,
            options: question.type === 'MCQ' ? question.options : undefined
          });
        }
      }

      // Navigate back to surveys list
      navigate('/surveys');
    } catch (error: any) {
      console.error('Error saving survey:', error);
      setError('Failed to save survey: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Survey not found
  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Survey not found.</p>
          <button 
            onClick={() => navigate('/surveys')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Surveys
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl xl:max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/surveys')}
                className="group p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md self-start"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Edit Survey</h1>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Customize your survey to perfection</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600">Ready to save</span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
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
          </div>

          {/* Survey Details */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Survey Details</h2>
                <p className="text-gray-600 text-sm sm:text-base">Basic information about your survey</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Survey Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={survey.topic || ''}
                    onChange={(e) => handleSurveyChange('topic', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter survey topic"
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Target Audience
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={survey.audience || ''}
                    onChange={(e) => handleSurveyChange('audience', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter target audience"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add New Question */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Add New Question</h2>
                <p className="text-gray-600 text-sm sm:text-base">Choose the type of question you want to add</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => addQuestion('MCQ')}
                className="flex-1 group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <List className="w-5 h-5" />
                  <span className="font-semibold">Multiple Choice</span>
                </div>
                <p className="text-blue-100 text-sm mt-1">Create questions with predefined options</p>
              </button>
              
              <button
                onClick={() => addQuestion('TEXT')}
                className="flex-1 group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl transition-all duration-300 hover:from-purple-600 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Type className="w-5 h-5" />
                  <span className="font-semibold">Text Answer</span>
                </div>
                <p className="text-purple-100 text-sm mt-1">Allow open-ended responses</p>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {survey.questions && survey.questions.length > 0 ? (
              survey.questions.map((question, index) => (
                <div
                  key={question.question_id}
                  id={`question-${question.question_id}`}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-600">{index + 1}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          question.type === 'MCQ' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {question.type === 'MCQ' ? 'Multiple Choice' : 'Text Answer'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Question Text
                        </label>
                        <textarea
                          value={question.question || ''}
                          onChange={(e) => handleQuestionChange(question.question_id, 'question', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Enter your question..."
                          rows={2}
                        />
                      </div>
                      
                      {question.type === 'MCQ' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Answer Options
                          </label>
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 w-6">{String.fromCharCode(65 + optionIndex)}.</span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(question.question_id, optionIndex, e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {question.options && question.options.length > 2 && (
                                  <button
                                    onClick={() => removeOption(question.question_id, optionIndex)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addOption(question.question_id)}
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Option</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                      <button
                        onClick={() => removeQuestion(question.question_id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">Start building your survey by adding your first question above.</p>
                <button
                  onClick={() => addQuestion('MCQ')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add First Question
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4 sm:mb-0">
              <p className="text-center text-xs sm:text-sm text-gray-500">
                Your changes will be saved automatically • {survey.questions?.length || 0} questions total
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/surveys')}
                className="px-4 py-2 sm:px-6 sm:py-3 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSurvey}
                disabled={saving}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSurvey;

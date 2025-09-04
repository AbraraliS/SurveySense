import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Loader2, GripVertical, Edit3, Type, List, PlusCircle } from 'lucide-react';
import { getSurvey, updateSurvey } from '../services/api';
import axios from 'axios';

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Question {
  question_id: string;
  question: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
  isNew?: boolean; // Add flag for new questions
}

interface SurveyData {
  survey_id: string;
  topic: string;
  audience: string;
  questions: Question[];
}

const EditSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSurveyChange = (field: 'topic' | 'audience', value: string) => {
    if (survey) {
      setSurvey(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleQuestionChange = (questionId: string, field: 'question' | 'type', value: string) => {
    if (survey) {
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
    }
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    if (survey) {
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
    }
  };

  const addOption = (questionId: string) => {
    if (survey) {
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
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    if (survey) {
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
    }
  };

  // 🔥 NEW: Add Question Functionality
  const addQuestion = (type: 'MCQ' | 'TEXT' = 'MCQ') => {
    if (survey) {
      const newQuestion: Question = {
        question_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: '',
        type: type,
        options: type === 'MCQ' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : undefined,
        isNew: true
      };

      setSurvey(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: [...prev.questions, newQuestion]
        };
      });

      // Scroll to new question after a brief delay
      setTimeout(() => {
        const element = document.getElementById(`question-${newQuestion.question_id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // 🔥 NEW: Remove Question Functionality
  const removeQuestion = (questionId: string) => {
    if (survey && survey.questions.length > 1) {
      setSurvey(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.filter(q => q.question_id !== questionId)
        };
      });
    }
  };

  // 🔥 NEW: Move Question Up/Down
  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    if (survey) {
      setSurvey(prev => {
        if (!prev) return null;
        const questions = [...prev.questions];
        const currentIndex = questions.findIndex(q => q.question_id === questionId);
        
        if (currentIndex === -1) return prev;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex < 0 || newIndex >= questions.length) return prev;
        
        // Swap questions
        [questions[currentIndex], questions[newIndex]] = [questions[newIndex], questions[currentIndex]];
        
        return {
          ...prev,
          questions
        };
      });
    }
  };

  const saveSurvey = async () => {
    if (!survey) return;

    try {
      setSaving(true);
      setError('');

      // Update survey basic info
      await updateSurvey(surveyId!, {
        topic: survey.topic,
        audience: survey.audience,
        num_questions: survey.questions.length
      });

      // Process each question
      for (const question of survey.questions) {
        if (question.isNew) {
          // Create new question
          await createQuestion(question);
        } else {
          // Update existing question
          await saveQuestion(question);
        }
      }

      // Navigate back to surveys page
      navigate('/surveys');
    } catch (error) {
      console.error('Error saving survey:', error);
      setError('Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  // 🔥 UPDATED: Save Question Function with better error handling
  const saveQuestion = async (question: Question) => {
    try {
      console.log('Updating existing question:', {
        question_id: question.question_id,
        question_text: question.question,
        options: question.options
      });

      const response = await axios.put(`${API_BASE_URL}/question/${question.question_id}`, {
        question_text: question.question,
        options: question.type === 'MCQ' ? question.options : undefined
      });

      console.log('✅ Question updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating question:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error(`Question not found or update endpoint missing: ${question.question_id}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid question data: ${error.response.data?.error || error.message}`);
      } else {
        throw new Error(`Failed to update question: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // 🔥 UPDATED: Create Question Function with better error handling
  const createQuestion = async (question: Question) => {
    try {
      console.log('Creating new question:', {
        survey_id: surveyId,
        question_text: question.question,
        question_type: question.type,
        options: question.options
      });

      const response = await axios.post(`${API_BASE_URL}/question`, {
        survey_id: surveyId,
        question_text: question.question,
        question_type: question.type,
        options: question.type === 'MCQ' ? question.options : undefined
      });

      console.log('✅ Question created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating question:', error);
      console.error('Request details:', {
        url: `${API_BASE_URL}/question`,
        data: {
          survey_id: surveyId,
          question_text: question.question,
          question_type: question.type,
          options: question.type === 'MCQ' ? question.options : undefined
        }
      });
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error('Question creation endpoint not found. Please check if the backend is running and has the latest endpoints.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid question data: ${error.response.data?.error || error.message}`);
      } else {
        throw new Error(`Failed to create question: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse mx-auto"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Survey</h3>
              <p className="text-gray-600">Please wait while we fetch your survey details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={fetchSurvey}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/surveys')}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Back to Surveys
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.006-6-2.709M15 11V7a3 3 0 00-3-3H8a3 3 0 00-3 3v4.582m12-1.582V11a3 3 0 00-3-3H8a3 3 0 00-3 3v.582" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Survey Not Found</h3>
              <p className="text-gray-600 mb-6">The survey you're looking for doesn't exist or has been removed.</p>
              <button
                onClick={() => navigate('/surveys')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Surveys
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => navigate('/surveys')}
                className="group p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Survey</h1>
                <p className="text-gray-600 text-lg">Customize your survey to perfection</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Auto-saved</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-red-800">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button 
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Survey Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Survey Details</h2>
                <p className="text-gray-600">Basic information about your survey</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Survey Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={survey.topic}
                    onChange={(e) => handleSurveyChange('topic', e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="What's your survey about?"
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500 opacity-0 group-focus-within:opacity-20 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Target Audience
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={survey.audience}
                    onChange={(e) => handleSurveyChange('audience', e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="Who should take this survey?"
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500 opacity-0 group-focus-within:opacity-20 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔥 NEW: Add Question Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-sm border border-blue-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add New Question</h3>
                  <p className="text-gray-600 text-sm">Choose a question type to add to your survey</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => addQuestion('MCQ')}
                  className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-3 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200"
                >
                  <List className="w-4 h-4" />
                  <span>Multiple Choice</span>
                </button>
                <button
                  onClick={() => addQuestion('TEXT')}
                  className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-3 rounded-xl font-medium hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md border border-purple-200"
                >
                  <Type className="w-4 h-4" />
                  <span>Text Answer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {survey.questions.map((question, index) => (
              <div 
                key={question.question_id}
                id={`question-${question.question_id}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Question Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {/* Move Up/Down buttons */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveQuestion(question.question_id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveQuestion(question.question_id, 'down')}
                            disabled={index === survey.questions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-gray-400 cursor-grab hover:text-gray-600 transition-colors">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                          <span>Question {index + 1}</span>
                          {question.isNew && (
                            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <select
                          value={question.type}
                          onChange={(e) => handleQuestionChange(question.question_id, 'type', e.target.value)}
                          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                        >
                          <option value="MCQ">Multiple Choice</option>
                          <option value="TEXT">Text Answer</option>
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          {question.type === 'MCQ' ? (
                            <List className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Type className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* 🔥 NEW: Delete Question Button */}
                      {survey.questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(question.question_id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-8">
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Question Text
                    </label>
                    <div className="relative group">
                      <textarea
                        value={question.question}
                        onChange={(e) => handleQuestionChange(question.question_id, 'question', e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50 focus:bg-white group-hover:border-gray-400"
                        rows={3}
                        placeholder="What would you like to ask?"
                      />
                      <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500 opacity-0 group-focus-within:opacity-20 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  {question.type === 'MCQ' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-semibold text-gray-700">
                          Answer Options
                        </label>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {question.options?.length || 0} options
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="group/option flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-gray-600">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(question.question_id, optionIndex, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white group-hover/option:border-gray-400"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                            </div>
                            {(question.options?.length || 0) > 2 && (
                              <button
                                onClick={() => removeOption(question.question_id, optionIndex)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover/option:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {(question.options?.length || 0) < 6 && (
                          <button
                            onClick={() => addOption(question.question_id)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-all duration-200 group/add"
                          >
                            <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                            <span>Add Option</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-12 sticky bottom-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <button
                onClick={saveSurvey}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Your changes will be saved automatically • {survey.questions.length} questions total
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSurvey;
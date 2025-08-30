import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Loader2, Users, MessageSquare, Hash } from 'lucide-react';
import { createSurvey } from '../services/api';

export default function CreateSurvey() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    audience: '',
    num_questions: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const questionOptions = [
    { value: 5, label: '5 Questions', description: '4 Multiple Choice + 1 Text' },
    { value: 10, label: '10 Questions', description: '8 Multiple Choice + 2 Text' },
    { value: 15, label: '15 Questions', description: '12 Multiple Choice + 3 Text' },
    { value: 20, label: '20 Questions', description: '16 Multiple Choice + 4 Text' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await createSurvey(formData);
      const surveyId = response.data.survey_id;
      navigate(`/survey/${surveyId}`);
    } catch (err: any) {
      console.error('Error creating survey:', err);
      setError(err.response?.data?.error || 'Failed to create survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_questions' ? parseInt(value) : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <PlusCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Create AI-Powered Survey</h1>
        <p className="text-lg text-gray-600">
          Let our AI generate intelligent questions tailored to your topic and audience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Topic Field */}
          <div>
            <label htmlFor="topic" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span>Survey Topic</span>
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g., Customer Satisfaction for Online Shopping"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Describe what you want to survey about
            </p>
          </div>

          {/* Audience Field */}
          <div>
            <label htmlFor="audience" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="h-4 w-4" />
              <span>Target Audience</span>
            </label>
            <input
              type="text"
              id="audience"
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              placeholder="e.g., College students, Working professionals, Small business owners"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Who will be taking this survey?
            </p>
          </div>

          {/* Question Count */}
          <div>
            <label htmlFor="num_questions" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
              <Hash className="h-4 w-4" />
              <span>Number of Questions</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                    formData.num_questions === option.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="num_questions"
                    value={option.value}
                    checked={formData.num_questions === option.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.num_questions === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.num_questions === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{option.description}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading || !formData.topic.trim() || !formData.audience.trim()}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating Survey...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <PlusCircle className="h-5 w-5" />
                <span>Generate AI Survey</span>
              </div>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Pro Tip:</strong> Be specific with your topic and audience for better AI-generated questions. 
            For example: "Employee satisfaction with remote work tools\" targeting "Software developers"
          </p>
        </div>
      </form>
    </div>
  );
}
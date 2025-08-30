import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight, ArrowLeft, BarChart3 } from 'lucide-react';
import { getSurvey, submitResponse } from '../services/api';

interface Question {
  id: string;
  type: 'MCQ' | 'TEXT';
  text: string;
  options?: string[];
}

interface Survey {
  survey_id: string;
  topic: string;
  audience: string;
  questions: Question[];
}

export default function TakeSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      const response = await getSurvey(surveyId!);
      setSurvey(response.data);
    } catch (err: any) {
      console.error('Error fetching survey:', err);
      setError('Survey not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!survey) return;

    setSubmitting(true);
    setError('');

    try {
      const responseData = Object.entries(responses).map(([questionId, answer]) => ({
        question_id: questionId,
        answer
      }));

      await submitResponse({
        survey_id: survey.survey_id,
        responses: responseData
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting responses:', err);
      setError('Failed to submit responses. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = survey?.questions.every(q => responses[q.id]) || false;
  const progress = survey ? (Object.keys(responses).length / survey.questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your responses have been submitted successfully. Thank you for participating in this survey.
          </p>

          <button
            onClick={() => navigate(`/results/${survey?.survey_id}`)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>View Results</span>
          </button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const currentQuestion = survey.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Survey Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.topic}</h1>
          <p className="text-lg text-gray-600">Target Audience: {survey.audience}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <p className="text-center text-gray-500">
          Question {Object.keys(responses).length} of {survey.questions.length} answered
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {survey.questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {question.text}
                </h3>
              </div>
            </div>

            {question.type === 'MCQ' && question.options ? (
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                      responses[question.id] === option
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={responses[question.id] === option}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder="Please share your thoughts..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 min-h-32 resize-vertical"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Feel free to provide detailed feedback
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={!isComplete || submitting}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Submit Survey</span>
            </>
          )}
        </button>

        {!isComplete && (
          <p className="text-sm text-gray-500 mt-4">
            Please answer all questions before submitting
          </p>
        )}
      </div>

      {/* Survey Info Footer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          <span className="text-sm">Survey ID: {survey.survey_id}</span>
        </div>
      </div>
    </div>
  );
}
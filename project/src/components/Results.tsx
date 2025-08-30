import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, Share2, BarChart3, Users, TrendingUp, MessageSquare, Loader2, Copy, Check } from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';
import getSurveyAnalysis from '../services/api';
import axios from 'axios';

// Import or define your API base URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface MCQAnalysis {
  question_id: string;
  question_text: string;
  responses: number;
  data: {
    labels: string[];
    values: number[];
  };
  chart_type: string;
}

interface TextAnalysis {
  question_id: string;
  question_text: string;
  responses: number;
  raw_responses: string[];
  word_frequency?: {
    labels: string[];
    values: number[];
  };
}

interface Analysis {
  survey_id: string;
  topic: string;
  audience: string;
  total_responses: number;
  mcq_analysis: MCQAnalysis[];
  text_analysis: TextAnalysis[];
  summary: {
    completion_rate: string;
    avg_response_length: number;
    most_popular_mcq_answer: string;
  };
}

export interface SurveyResponse {
  response_id: string;
  survey_id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_ip?: string;
  responses: Record<string, any>;
  submitted_at: string;
  completion_time?: number; // in seconds
}

export interface SurveyResults {
  survey: {
    survey_id: string;
    topic: string;
    audience: string;
    created_at: string;
    questions_count: number;
    responses_count: number;
  };
  questions: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    options?: string[];
  }>;
  responses: SurveyResponse[];
  analytics: {
    total_responses: number;
    completion_rate: number;
    average_completion_time: number;
    response_by_date: Record<string, number>;
  };
}

// Get survey results with user data
export const getSurveyResults = async (surveyId: string): Promise<{ data: SurveyResults }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surveys/${surveyId}/results`);
    return response.data;
  } catch (error) {
    console.error('Error fetching survey results:', error);
    throw error;
  }
};

export default function Results() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (surveyId) {
      fetchAnalysis();
    }
  }, [surveyId]);

  const fetchAnalysis = async () => {
    try {
      const response = await getSurveyAnalysis(surveyId!);
      setAnalysis(response.data);
    } catch (err: any) {
      console.error('Error fetching analysis:', err);
      setError('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  // Copy survey link functionality
  const copySurveyLink = async () => {
    try {
      const surveyLink = `${window.location.origin}/survey/${surveyId}`;
      await navigator.clipboard.writeText(surveyLink);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      fallbackCopyTextToClipboard(`${window.location.origin}/survey/${surveyId}`);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err);
    }
    
    document.body.removeChild(textArea);
  };

  const shareSurvey = async () => {
    const surveyLink = `${window.location.origin}/survey/${surveyId}`;
    const shareData = {
      title: `Survey: ${analysis?.topic || 'Survey'}`,
      text: `Take this survey about ${analysis?.topic || 'various topics'}`,
      url: surveyLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copySurveyLink();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      await copySurveyLink();
    }
  };

  const downloadResults = () => {
    if (!analysis) return;

    const dataStr = JSON.stringify(analysis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `survey-results-${surveyId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing survey data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <p className="text-red-600 font-medium">{error || 'Failed to load analysis'}</p>
              <Link 
                to="/surveys" 
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Surveys
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Survey Results</h1>
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">{analysis.topic}</h2>
            <p className="text-gray-600">Target Audience: {analysis.audience}</p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 mb-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={copySurveyLink}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-white rounded-lg font-semibold text-blue-600 transition-colors hover:bg-blue-50 border border-blue-200"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Survey Link'}</span>
                </button>
                
                <button 
                  onClick={shareSurvey}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Survey</span>
                </button>
                
                <button 
                  onClick={downloadResults}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Results</span>
                </button>
              </div>
              
              {/* Survey Link Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Survey Link:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border text-gray-800">
                    {`${window.location.origin}/survey/${surveyId}`}
                  </code>
                  <button 
                    onClick={copySurveyLink}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">{analysis.total_responses}</div>
              <div className="text-gray-600">Total Responses</div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">{analysis.summary.completion_rate}</div>
              <div className="text-gray-600">Completion Rate</div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
              <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">{analysis.summary.avg_response_length}</div>
              <div className="text-gray-600">Avg Response Length</div>
            </div>
          </div>

          {/* MCQ Analysis */}
          {analysis.mcq_analysis && analysis.mcq_analysis.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Multiple Choice Responses</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysis.mcq_analysis.map((mcq, index) => (
                  <AnalyticsChart
                    key={mcq.question_id || index}
                    data={mcq.data}
                    type="pie"
                    title={mcq.question_text}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Text Analysis */}
          {analysis.text_analysis && analysis.text_analysis.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Open-ended Responses</h3>
              <div className="space-y-6">
                {analysis.text_analysis.map((text, index) => (
                  <div key={text.question_id || index} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{text.question_text}</h4>
                    <p className="text-sm text-gray-600 mb-4">{text.responses} responses</p>
                    
                    {text.raw_responses && text.raw_responses.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {text.raw_responses.map((response, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700 text-sm">{response}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No responses yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data State */}
          {(!analysis.mcq_analysis || analysis.mcq_analysis.length === 0) && 
           (!analysis.text_analysis || analysis.text_analysis.length === 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-6">
                This survey hasn't received any responses yet. Share the survey link to start collecting data.
              </p>
            </div>
          )}

          {/* Back to Surveys */}
          <div className="text-center mt-8">
            <Link
              to="/surveys"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowRight className="w-4 h-4 transform rotate-180" />
              <span>Back to Your Surveys</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
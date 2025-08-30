import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, Share2, BarChart3, Users, TrendingUp, MessageSquare, Loader2, Copy, Check } from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';
import { getSurveyAnalysis } from '../services/api';

interface McqAnalysis {
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
  word_frequency: {
    labels: string[];
    values: number[];
  };
}

interface Analysis {
  survey_id: string;
  topic: string;
  audience: string;
  total_responses: number;
  mcq_analysis: McqAnalysis[];
  text_analysis: TextAnalysis[];
  summary: {
    completion_rate: string;
    avg_response_length: number;
    most_popular_mcq_answer: string;
  };
}

export default function Results() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(''); // Add this missing state variable

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
      setError('Failed to load analysis data'); // Now setError is defined
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
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      fallbackCopyTextToClipboard(`${window.location.origin}/survey/${surveyId}`);
    }
  };

  // Fallback copy function for older browsers
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

  // Share survey functionality
  const shareSurvey = async () => {
    const surveyLink = `${window.location.origin}/survey/${surveyId}`;
    const shareData = {
      title: `Survey: ${analysis?.topic || 'Survey'}`,
      text: `Take this survey about ${analysis?.topic || 'various topics'}`,
      url: surveyLink,
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copySurveyLink();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      await copySurveyLink();
    }
  };

  // Download results functionality
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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing survey data...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <p className="text-red-600 font-medium">{error || 'Failed to load analysis'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.topic}</h1>
                <p className="text-lg text-gray-600">Target Audience: {analysis.audience}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={copySurveyLink}
                  className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Survey</span>
                </button>
                
                <Link
                  to={`/survey/${surveyId}`}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Take Survey</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.total_responses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.summary.completion_rate}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Response Length</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.summary.avg_response_length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* MCQ Analysis */}
          {analysis.mcq_analysis.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span>Multiple Choice Analysis</span>
              </h2>
              
              <div className="grid lg:grid-cols-2 gap-6">
                {analysis.mcq_analysis.map((mcq, index) => (
                  <div key={mcq.question_id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">{mcq.question_text}</h3>
                    <p className="text-sm text-gray-500 mb-4">{mcq.responses} responses</p>
                    
                    <AnalyticsChart
                      type="bar"
                      data={mcq.data}
                      title={`Question ${index + 1} Results`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Analysis */}
          {analysis.text_analysis.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <span>Text Response Analysis</span>
              </h2>
              
              <div className="space-y-6">
                {analysis.text_analysis.map((text, index) => (
                  <div key={text.question_id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">{text.question_text}</h3>
                    <p className="text-sm text-gray-500 mb-6">{text.responses} responses</p>
                    
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">Word Frequency</h4>
                        <AnalyticsChart
                          type="bar"
                          data={text.word_frequency}
                          title="Most Common Words"
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">Recent Responses</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {text.raw_responses.slice(0, 5).map((response, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                              <p className="text-gray-700 text-sm">{response}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Survey Results Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Survey Results</h2>
            
            {/* MCQ Results */}
            {analysis.mcq_analysis.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Multiple Choice Questions</h3>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {analysis.mcq_analysis.map((mcq, index) => (
                    <div key={mcq.question_id} className="bg-gray-50 rounded-xl shadow-md p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">{mcq.question_text}</h4>
                      <p className="text-sm text-gray-500 mb-4">{mcq.responses} responses</p>
                      
                      <AnalyticsChart
                        type="bar"
                        data={mcq.data}
                        title={`Question ${index + 1} Results`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Responses */}
            {analysis.text_analysis.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Text Responses</h3>
                
                <div className="space-y-6">
                  {analysis.text_analysis.map((text, index) => (
                    <div key={text.question_id} className="bg-gray-50 rounded-xl shadow-md p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">{text.question_text}</h4>
                      <p className="text-sm text-gray-500 mb-4">{text.responses} responses</p>
                      
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3">Word Frequency</h5>
                          <AnalyticsChart
                            type="bar"
                            data={text.word_frequency}
                            title="Most Common Words"
                          />
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3">Recent Responses</h5>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {text.raw_responses.slice(0, 5).map((response, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border">
                                <p className="text-gray-700 text-sm">{response}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Want to collect more responses?</h2>
            <p className="text-blue-100 mb-6">
              Share your survey link to get more participants and richer insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={copySurveyLink}
                className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Copy Survey Link</span>
              </button>
              
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
              >
                <span>Create New Survey</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
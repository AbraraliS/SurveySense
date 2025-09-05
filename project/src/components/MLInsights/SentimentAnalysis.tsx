import React, { useState, useEffect } from 'react';
import { Heart, Frown, Meh, Smile, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { SurveyResults, MLInsights, getMLInsights } from '../../services/api';

interface SentimentAnalysisProps {
  results: SurveyResults;
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ results }) => {
  const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchMLInsights();
  }, [results.survey.survey_id]);

  const fetchMLInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMLInsights(results.survey.survey_id);
      setMlInsights(response.data);
    } catch (error) {
      
      setError('Failed to load sentiment analysis data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sentiment analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!mlInsights) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No sentiment analysis data available</p>
        </div>
      </div>
    );
  }

  const { sentimentAnalysis } = mlInsights;
  const { overall, byQuestion, trends } = sentimentAnalysis;

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Sentiment Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Smile className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(overall.positive * 100)}%
            </div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Meh className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(overall.neutral * 100)}%
            </div>
            <div className="text-sm text-gray-600">Neutral</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Frown className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {Math.round(overall.negative * 100)}%
            </div>
            <div className="text-sm text-gray-600">Negative</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Compound Sentiment Score</span>
            <span className="text-sm text-gray-500">Confidence: {Math.round(overall.confidence)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                overall.compound > 0.1 ? 'bg-green-500' : 
                overall.compound < -0.1 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.abs(overall.compound) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Score: {overall.compound.toFixed(3)} 
            {overall.compound > 0.1 && ' (Positive)'}
            {overall.compound < -0.1 && ' (Negative)'}
            {overall.compound >= -0.1 && overall.compound <= 0.1 && ' (Neutral)'}
          </div>
        </div>
      </div>

      {/* Sentiment Trends */}
      {trends && trends.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends Over Time</h3>
          <div className="space-y-3">
            {trends.slice(-7).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{trend.date}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        trend.sentiment > 0.1 ? 'bg-green-500' : 
                        trend.sentiment < -0.1 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.abs(trend.sentiment) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-12">
                    {trend.sentiment.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Sentiment */}
      {byQuestion && byQuestion.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment by Question</h3>
          <div className="space-y-4">
            {byQuestion.map((question, index) => {
              const questionData = results.questions.find(q => q.question_id === question.questionId);
              const questionText = questionData?.question_text || questionData?.question || `Question ${index + 1}`;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{questionText}</h4>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {Math.round(question.sentiment.positive * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {Math.round(question.sentiment.neutral * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {Math.round(question.sentiment.negative * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Negative</div>
                    </div>
                  </div>

                  {question.keywords && question.keywords.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Key Terms:</div>
                      <div className="flex flex-wrap gap-2">
                        {question.keywords.map((keyword, keyIndex) => (
                          <span 
                            key={keyIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.emotions && question.emotions.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Detected Emotions:</div>
                      <div className="flex flex-wrap gap-2">
                        {question.emotions.map((emotion, emotionIndex) => (
                          <span 
                            key={emotionIndex}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {emotion.emotion} ({Math.round(emotion.intensity * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Text Questions Message */}
      {(!byQuestion || byQuestion.length === 0) && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="text-center py-8">
            <Meh className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Text Questions Found</h3>
            <p className="text-gray-600">
              This survey doesn't contain any text-based questions for sentiment analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;

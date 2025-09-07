import React, { useState, useEffect } from 'react';
import { Heart, Frown, Meh, Smile, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface SentimentAnalysisProps {
  results: SurveyResults;
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ results }) => {
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    analyzeSentiment();
  }, [results.survey.survey_id]);

  // Advanced sentiment analysis function with weighted scoring
  const analyzeTextSentiment = (text: string) => {
    // Enhanced sentiment dictionaries with weights
    const sentimentWords = {
      positive: {
        'excellent': 3, 'amazing': 3, 'fantastic': 3, 'outstanding': 3, 'brilliant': 3,
        'perfect': 2.5, 'wonderful': 2.5, 'awesome': 2.5, 'love': 2.5, 'great': 2,
        'good': 1.5, 'happy': 1.5, 'satisfied': 1.5, 'pleased': 1.5, 'like': 1,
        'nice': 1, 'fine': 0.5, 'okay': 0.5, 'decent': 0.5
      },
      negative: {
        'terrible': 3, 'awful': 3, 'horrible': 3, 'disgusting': 3, 'hate': 2.5,
        'worst': 2.5, 'frustrated': 2, 'angry': 2, 'disappointed': 2, 'sad': 1.5,
        'bad': 1.5, 'poor': 1.5, 'annoying': 1.5, 'frustrating': 1.5, 'dislike': 1,
        'unhappy': 1, 'upset': 1, 'concerned': 0.5, 'worried': 0.5
      }
    };

    // Negation words that flip sentiment
    const negationWords = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor'];
    
    // Intensifiers that amplify sentiment
    const intensifiers = {
      'very': 1.5, 'extremely': 2, 'incredibly': 2, 'absolutely': 2, 'completely': 1.5,
      'totally': 1.5, 'really': 1.2, 'quite': 1.2, 'rather': 1.1, 'somewhat': 0.8,
      'slightly': 0.7, 'barely': 0.6, 'hardly': 0.6
    };

    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let totalWords = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = i > 0 ? words[i - 1] : '';
      const nextWord = i < words.length - 1 ? words[i + 1] : '';
      
      let wordScore = 0;
      let sentiment = 'neutral';
      
      // Check for positive sentiment
      if (sentimentWords.positive[word]) {
        wordScore = sentimentWords.positive[word];
        sentiment = 'positive';
      }
      // Check for negative sentiment
      else if (sentimentWords.negative[word]) {
        wordScore = sentimentWords.negative[word];
        sentiment = 'negative';
      }
      
      if (wordScore > 0) {
        totalWords++;
        
        // Apply negation (check previous word)
        if (negationWords.includes(prevWord)) {
          wordScore = -wordScore;
          sentiment = sentiment === 'positive' ? 'negative' : 'positive';
        }
        
        // Apply intensifiers (check previous word)
        if (intensifiers[prevWord]) {
          wordScore *= intensifiers[prevWord];
        }
        
        // Apply to appropriate score
        if (sentiment === 'positive') {
          positiveScore += wordScore;
        } else {
          negativeScore += wordScore;
        }
      }
    }
    
    // Calculate final sentiment
    const totalScore = positiveScore + Math.abs(negativeScore);
    if (totalScore === 0) return { sentiment: 'neutral', score: 0, confidence: 0 };
    
    const score = (positiveScore - Math.abs(negativeScore)) / totalScore;
    const confidence = Math.min(1, totalWords / 3); // Confidence based on sentiment words found
    
    // Determine sentiment with thresholds
    if (score > 0.15) return { sentiment: 'positive', score, confidence };
    if (score < -0.15) return { sentiment: 'negative', score, confidence };
    return { sentiment: 'neutral', score, confidence };
  };

  const analyzeSentiment = () => {
    try {
      setLoading(true);
      setError('');
      
      // Extract all text responses
      const textResponses = results.responses?.flatMap(response => 
        response.responses?.filter(resp => {
          const question = results.questions?.find(q => q.question_id === resp.question_id);
          return question?.question_type === 'TEXT' && resp.answer && resp.answer.trim().length > 0;
        }).map(resp => resp.answer) || []
      ) || [];

      if (textResponses.length === 0) {
        setSentimentData({
          overallSentiment: 'neutral',
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
          averageScore: 0,
          confidence: 0,
          totalResponses: 0,
          insights: ['No text responses available for sentiment analysis']
        });
        setLoading(false);
        return;
      }

      // Analyze each text response
      const sentiments = textResponses.map(text => analyzeTextSentiment(text));
      
      // Calculate overall metrics
      const sentimentCounts = sentiments.reduce((acc, s) => {
        acc[s.sentiment]++;
        return acc;
      }, { positive: 0, neutral: 0, negative: 0 });

      const averageScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const averageConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

      // Determine overall sentiment
      let overallSentiment = 'neutral';
      if (sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral) {
        overallSentiment = 'positive';
      } else if (sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral) {
        overallSentiment = 'negative';
      }

      // Generate insights
      const insights = [];
      if (sentimentCounts.positive > sentimentCounts.negative) {
        insights.push('Overall positive sentiment detected in responses');
      } else if (sentimentCounts.negative > sentimentCounts.positive) {
        insights.push('Overall negative sentiment detected in responses');
      } else {
        insights.push('Mixed sentiment with neutral overall tone');
      }

      if (averageConfidence > 0.7) {
        insights.push('High confidence in sentiment analysis results');
      } else if (averageConfidence < 0.3) {
        insights.push('Low confidence - responses may be too short or ambiguous');
      }

      setSentimentData({
        overallSentiment,
        sentimentDistribution: sentimentCounts,
        averageScore,
        confidence: averageConfidence,
        totalResponses: textResponses.length,
        insights
      });
    } catch (error) {
      setError('Failed to analyze sentiment data');
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

  if (!sentimentData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No sentiment analysis data available</p>
        </div>
      </div>
    );
  }

  const { overallSentiment, sentimentDistribution, averageScore, confidence, totalResponses, insights } = sentimentData;

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
              {totalResponses > 0 ? Math.round((sentimentDistribution.positive / totalResponses) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Positive ({sentimentDistribution.positive})</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Meh className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {totalResponses > 0 ? Math.round((sentimentDistribution.neutral / totalResponses) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Neutral ({sentimentDistribution.neutral})</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Frown className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {totalResponses > 0 ? Math.round((sentimentDistribution.negative / totalResponses) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Negative ({sentimentDistribution.negative})</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
            <span className="text-sm text-gray-500">Confidence: {Math.round(confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                averageScore > 0.1 ? 'bg-green-500' : 
                averageScore < -0.1 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(100, Math.abs(averageScore) * 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Score: {averageScore.toFixed(3)} ({overallSentiment})
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Heart className="w-5 h-5 text-blue-500 mt-0.5" />
                </div>
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Data Quality</h4>
            <p className="text-sm text-gray-600">
              Analyzed {totalResponses} text responses with {Math.round(confidence * 100)}% confidence
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Overall Sentiment</h4>
            <p className="text-sm text-gray-600">
              {overallSentiment.charAt(0).toUpperCase() + overallSentiment.slice(1)} sentiment 
              with score {averageScore.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Question-by-Question Sentiment - Disabled for now */}
      {false && false && (
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

    </div>
  );
};

export default SentimentAnalysis;

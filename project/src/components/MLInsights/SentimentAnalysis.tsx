import React from 'react';
import { Heart, Frown, Meh, Smile, TrendingUp, AlertCircle } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
  compound: number;
}

interface SentimentAnalysisProps {
  results: SurveyResults;
}

// Simple sentiment analysis function
const analyzeSentiment = (text: string): SentimentScore => {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'outstanding', 'wonderful', 'fantastic', 'awesome', 'satisfied', 'happy', 'pleased', 'impressed', 'recommend'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'poor', 'worst', 'disappointed', 'frustrated', 'angry', 'annoying', 'useless', 'broken', 'slow', 'expensive'];
  const neutralWords = ['okay', 'fine', 'average', 'normal', 'standard', 'basic', 'typical', 'regular', 'moderate'];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) {
      positiveCount++;
    } else if (negativeWords.some(neg => word.includes(neg))) {
      negativeCount++;
    } else if (neutralWords.some(neu => word.includes(neu))) {
      neutralCount++;
    }
  });

  const total = positiveCount + negativeCount + neutralCount;
  if (total === 0) {
    return { positive: 0.33, neutral: 0.34, negative: 0.33, compound: 0 };
  }

  const positive = positiveCount / total;
  const negative = negativeCount / total;
  const neutral = neutralCount / total;
  const compound = (positiveCount - negativeCount) / total;

  return { positive, neutral, negative, compound };
};

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ results }) => {
  // Extract text responses
  const textResponses = results.questions
    .filter(q => q.question_type === 'TEXT')
    .flatMap(question => 
      results.responses
        .map(r => r.responses[question.question_id])
        .filter(Boolean)
        .map(response => ({
          questionId: question.question_id,
          questionText: question.question_text,
          response: response as string
        }))
    );

  // Analyze sentiment for each text response
  const sentimentResults = textResponses.map(item => ({
    ...item,
    sentiment: analyzeSentiment(item.response)
  }));

  // Calculate overall sentiment
  const overallSentiment = sentimentResults.reduce(
    (acc, item) => ({
      positive: acc.positive + item.sentiment.positive,
      neutral: acc.neutral + item.sentiment.neutral,
      negative: acc.negative + item.sentiment.negative,
      compound: acc.compound + item.sentiment.compound
    }),
    { positive: 0, neutral: 0, negative: 0, compound: 0 }
  );

  if (sentimentResults.length > 0) {
    overallSentiment.positive /= sentimentResults.length;
    overallSentiment.neutral /= sentimentResults.length;
    overallSentiment.negative /= sentimentResults.length;
    overallSentiment.compound /= sentimentResults.length;
  }

  // Group sentiments by question
  const sentimentByQuestion = results.questions
    .filter(q => q.question_type === 'TEXT')
    .map(question => {
      const questionSentiments = sentimentResults.filter(s => s.questionId === question.question_id);
      const avgSentiment = questionSentiments.reduce(
        (acc, item) => ({
          positive: acc.positive + item.sentiment.positive,
          neutral: acc.neutral + item.sentiment.neutral,
          negative: acc.negative + item.sentiment.negative,
          compound: acc.compound + item.sentiment.compound
        }),
        { positive: 0, neutral: 0, negative: 0, compound: 0 }
      );

      if (questionSentiments.length > 0) {
        avgSentiment.positive /= questionSentiments.length;
        avgSentiment.neutral /= questionSentiments.length;
        avgSentiment.negative /= questionSentiments.length;
        avgSentiment.compound /= questionSentiments.length;
      }

      return {
        question: question.question_text,
        sentiment: avgSentiment,
        responseCount: questionSentiments.length,
        responses: questionSentiments
      };
    });

  const getSentimentIcon = (compound: number) => {
    if (compound > 0.1) return <Smile className="w-5 h-5 text-green-500" />;
    if (compound < -0.1) return <Frown className="w-5 h-5 text-red-500" />;
    return <Meh className="w-5 h-5 text-yellow-500" />;
  };

  const getSentimentLabel = (compound: number) => {
    if (compound > 0.1) return 'Positive';
    if (compound < -0.1) return 'Negative';
    return 'Neutral';
  };

  const getSentimentColor = (compound: number) => {
    if (compound > 0.1) return 'text-green-600';
    if (compound < -0.1) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (textResponses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Text Responses</h3>
          <p className="text-gray-600">
            Sentiment analysis requires text responses. This survey only contains multiple choice questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Summary */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Heart className="w-6 h-6 text-pink-500" />
          <span>Overall Sentiment Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Overall Mood</span>
              <div className="flex items-center space-x-2">
                {getSentimentIcon(overallSentiment.compound)}
                <span className={`font-semibold ${getSentimentColor(overallSentiment.compound)}`}>
                  {getSentimentLabel(overallSentiment.compound)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Positive</span>
                  <span className="text-sm font-medium text-green-600">
                    {(overallSentiment.positive * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallSentiment.positive * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Neutral</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {(overallSentiment.neutral * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallSentiment.neutral * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Negative</span>
                  <span className="text-sm font-medium text-red-600">
                    {(overallSentiment.negative * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallSentiment.negative * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Smile className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-800">Positive Responses</span>
                </div>
                <span className="font-bold text-green-800">
                  {sentimentResults.filter(s => s.sentiment.compound > 0.1).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Meh className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium text-yellow-800">Neutral Responses</span>
                </div>
                <span className="font-bold text-yellow-800">
                  {sentimentResults.filter(s => s.sentiment.compound >= -0.1 && s.sentiment.compound <= 0.1).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Frown className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-800">Negative Responses</span>
                </div>
                <span className="font-bold text-red-800">
                  {sentimentResults.filter(s => s.sentiment.compound < -0.1).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment by Question */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <span>Sentiment by Question</span>
        </h3>
        
        {sentimentByQuestion.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex-1">{item.question}</h4>
              <div className="flex items-center space-x-2 ml-4">
                {getSentimentIcon(item.sentiment.compound)}
                <span className={`font-semibold ${getSentimentColor(item.sentiment.compound)}`}>
                  {getSentimentLabel(item.sentiment.compound)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(item.sentiment.positive * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-green-700">Positive</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(item.sentiment.neutral * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-yellow-700">Neutral</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {(item.sentiment.negative * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-red-700">Negative</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              Based on {item.responseCount} text responses
            </div>
            
            {/* Sample responses */}
            {item.responses.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Sample Responses:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {item.responses.slice(0, 3).map((response, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Response {idx + 1}</span>
                        <div className="flex items-center space-x-1">
                          {getSentimentIcon(response.sentiment.compound)}
                          <span className={`text-xs font-medium ${getSentimentColor(response.sentiment.compound)}`}>
                            {getSentimentLabel(response.sentiment.compound)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{response.response}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentAnalysis;
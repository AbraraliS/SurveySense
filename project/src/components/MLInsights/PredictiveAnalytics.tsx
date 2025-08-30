import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, BarChart3, Loader2, AlertCircle, Zap, Lightbulb } from 'lucide-react';
import { SurveyResults, MLInsights, getMLInsights } from '../../services/api';

interface PredictiveAnalyticsProps {
  results: SurveyResults;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ results }) => {
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
      console.error('Error fetching ML insights:', error);
      setError('Failed to load predictive analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading predictive analytics...</p>
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
          <p className="text-gray-600">No predictive analytics data available</p>
        </div>
      </div>
    );
  }

  const { predictions } = mlInsights;
  const { nextResponseTime, expectedCompletionRate, qualityScore, trendPredictions, recommendations } = predictions;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const formatNextResponseTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Within the next hour';
    if (diffHours < 24) return `In ${diffHours} hours`;
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      {/* Predictive Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Analytics Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {formatNextResponseTime(nextResponseTime)}
            </div>
            <div className="text-sm text-gray-600">Next Expected Response</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {Math.round(expectedCompletionRate)}%
            </div>
            <div className="text-sm text-gray-600">Expected Completion Rate</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(qualityScore)}%
            </div>
            <div className="text-sm text-gray-600">Predicted Quality Score</div>
          </div>
        </div>
      </div>

      {/* Trend Predictions */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Predictions</h3>
        
        <div className="space-y-4">
          {trendPredictions.map((prediction, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{prediction.metric}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {typeof prediction.predicted === 'number' && prediction.predicted > 100 
                      ? Math.round(prediction.predicted) 
                      : prediction.predicted.toFixed(1)}
                  </div>
                  <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}% confidence
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((prediction.predicted / (prediction.metric.includes('Rate') || prediction.metric.includes('Score') ? 100 : 300)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>AI-Powered Recommendations</span>
        </h3>
        
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.type}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                  Priority {rec.priority}/10
                </span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Expected Impact:</span>
                  <span className="text-sm text-blue-800">{rec.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Performance Forecast</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Expected completion rate: {Math.round(expectedCompletionRate)}%</li>
              <li>• Predicted quality score: {Math.round(qualityScore)}%</li>
              <li>• Next response expected: {formatNextResponseTime(nextResponseTime)}</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Optimization Opportunities</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {recommendations.filter(r => r.priority >= 8).length} high-priority improvements</li>
              <li>• {recommendations.filter(r => r.priority >= 6).length} actionable recommendations</li>
              <li>• Average confidence: {Math.round(trendPredictions.reduce((acc, p) => acc + p.confidence, 0) / trendPredictions.length)}%</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Confidence */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Confidence</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Prediction Confidence</span>
              <span className="font-medium">
                {Math.round(trendPredictions.reduce((acc, p) => acc + p.confidence, 0) / trendPredictions.length)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${trendPredictions.reduce((acc, p) => acc + p.confidence, 0) / trendPredictions.length}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {trendPredictions.filter(p => p.confidence >= 85).length}
              </div>
              <div className="text-gray-600">High Confidence</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {trendPredictions.filter(p => p.confidence < 85).length}
              </div>
              <div className="text-gray-600">Needs Review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
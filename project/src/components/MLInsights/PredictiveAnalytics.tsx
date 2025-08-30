import React from 'react';
import { Target, TrendingUp, Calendar, BarChart3, Lightbulb, AlertTriangle } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface PredictionsData {
  nextResponseTime: string;
  expectedCompletionRate: number;
  qualityScore: number;
  trendPredictions: Array<{ metric: string; predicted: number; confidence: number }>;
  recommendations: Array<{ type: string; suggestion: string; impact: string; priority: number }>;
}

interface PredictiveAnalyticsProps {
  predictionsData: PredictionsData;
  results: SurveyResults;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ predictionsData, results }) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority > 7) return 'bg-red-100 text-red-800 border-red-200';
    if (priority > 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 85) return 'text-green-600';
    if (confidence > 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Prediction Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Target className="w-6 h-6 text-blue-500" />
          <span>Predictive Analytics</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-600">
              {formatDateTime(predictionsData.nextResponseTime)}
            </div>
            <div className="text-sm text-blue-700">Next Expected Response</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {Math.round(predictionsData.expectedCompletionRate)}%
            </div>
            <div className="text-sm text-green-700">Expected Completion Rate</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(predictionsData.qualityScore)}%
            </div>
            <div className="text-sm text-purple-700">Predicted Quality Score</div>
          </div>
        </div>
      </div>

      {/* Trend Predictions */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <span>Trend Predictions</span>
        </h4>
        
        <div className="space-y-4">
          {predictionsData.trendPredictions.map((prediction, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">{prediction.metric}</h5>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}% confidence
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-blue-600">
                    {prediction.metric.includes('Time') 
                      ? `${Math.round(prediction.predicted)}s`
                      : `${Math.round(prediction.predicted)}${prediction.metric.includes('Rate') || prediction.metric.includes('Score') ? '%' : ''}`
                    }
                  </span>
                  <span className="text-sm text-gray-500 ml-2">predicted value</span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="font-semibold">
                    {prediction.metric === 'Response Rate' && `${results.analytics.completion_rate}%`}
                    {prediction.metric === 'Completion Time' && `${results.analytics.average_completion_time}s`}
                    {prediction.metric === 'Quality Score' && '75%'}
                    {prediction.metric === 'User Satisfaction' && '78%'}
                  </div>
                </div>
              </div>
              
              {/* Trend Indicator */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {prediction.predicted > (
                    prediction.metric === 'Response Rate' ? results.analytics.completion_rate :
                    prediction.metric === 'Completion Time' ? results.analytics.average_completion_time :
                    75
                  ) ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Improving trend</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                      <span className="text-sm text-red-600">Declining trend</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>AI-Generated Recommendations</span>
        </h4>
        
        <div className="space-y-4">
          {predictionsData.recommendations
            .sort((a, b) => b.priority - a.priority)
            .map((rec, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">{rec.type}</h5>
                    <p className="text-sm text-gray-700">{rec.suggestion}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                    Priority {rec.priority}/10
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600">
                      Expected Impact: {rec.impact}
                    </span>
                  </div>
                  
                  {rec.priority > 7 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">High Priority</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Prediction Accuracy */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Prediction Model Performance</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Model Confidence</h5>
            <div className="space-y-3">
              {predictionsData.trendPredictions.map((pred, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{pred.metric}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getConfidenceColor(pred.confidence) === 'text-green-600' ? 'bg-green-500' : 
                          getConfidenceColor(pred.confidence) === 'text-yellow-600' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getConfidenceColor(pred.confidence)}`}>
                      {pred.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Model Insights</h5>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>
                  Model uses {results.responses.length} data points for predictions
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>
                  High confidence predictions are based on established patterns
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                <span>
                  Recommendations prioritize actionable improvements
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
import React, { useState } from 'react';
import { BarChart3, PieChart, LineChart, TrendingUp, Activity } from 'lucide-react';
import { SurveyResults, MLInsights } from '../../services/api';

interface DataVisualizationProps {
  mlInsights: MLInsights;
  results: SurveyResults;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ mlInsights, results }) => {
  const [selectedChart, setSelectedChart] = useState<'sentiment' | 'clustering' | 'patterns' | 'trends'>('sentiment');

  const renderSentimentChart = () => {
    const sentimentData = mlInsights.sentimentAnalysis.overall;
    const maxValue = Math.max(sentimentData.positive, sentimentData.neutral, sentimentData.negative);
    
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Sentiment Distribution</h4>
        <div className="space-y-3">
          {[
            { label: 'Positive', value: sentimentData.positive, color: 'bg-green-500' },
            { label: 'Neutral', value: sentimentData.neutral, color: 'bg-yellow-500' },
            { label: 'Negative', value: sentimentData.negative, color: 'bg-red-500' }
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium text-gray-700">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className={`${item.color} h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">
                    {Math.round(item.value * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Sentiment Trend Chart */}
        <div className="mt-6">
          <h5 className="font-medium text-gray-900 mb-3">Sentiment Trend (7 days)</h5>
          <div className="flex items-end space-x-2 h-32">
            {mlInsights.sentimentAnalysis.trends.map((trend: { date: string; sentiment: number }, index: number) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all duration-500 ${
                    trend.sentiment > 0 ? 'bg-green-400' : 
                    trend.sentiment < -0.1 ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
                  style={{ 
                    height: `${Math.max(10, Math.abs(trend.sentiment) * 60 + 20)}px` 
                  }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(trend.date).getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderClusteringChart = () => {
    const clusterData = mlInsights.clustering.userGroups;
    const totalUsers = clusterData.reduce((sum: number, group: any) => sum + group.size, 0);
    
    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">User Clustering Analysis</h4>
        
        {/* Pie Chart Representation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Cluster Distribution</h5>
            <div className="space-y-3">
              {clusterData.map((cluster: any, index: number) => {
                const percentage = (cluster.size / totalUsers) * 100;
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];
                return (
                  <div key={cluster.id} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{cluster.name}</span>
                        <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Behavior Profiles</h5>
            <div className="space-y-4">
              {clusterData.map((cluster: any, index: number) => (
                <div key={cluster.id} className="bg-gray-50 rounded-lg p-4">
                  <h6 className="font-medium text-gray-900 mb-2">{cluster.name}</h6>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium ml-2">
                        {Math.round(cluster.behaviorProfile.avgCompletionTime / 60)}m
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-medium ml-2">{cluster.behaviorProfile.responseQuality}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Engagement:</span>
                      <span className={`font-medium ml-2 capitalize ${
                        cluster.behaviorProfile.engagementLevel === 'high' ? 'text-green-600' :
                        cluster.behaviorProfile.engagementLevel === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {cluster.behaviorProfile.engagementLevel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPatternsChart = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Response Patterns Analysis</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Most Common Responses</h5>
            <div className="space-y-3">
              {mlInsights.responsePatterns.mostCommonAnswers.slice(0, 5).map((pattern: any, index: number) => (
                <div key={index} className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-gray-900 text-sm">
                      {pattern.question.substring(0, 40)}...
                    </h6>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {pattern.frequency}x
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">"{pattern.answer}"</p>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, pattern.confidence)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Confidence: {Math.round(pattern.confidence)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Question Correlations</h5>
            <div className="space-y-3">
              {mlInsights.responsePatterns.correlations.slice(0, 5).map((corr: any, index: number) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Correlation: {corr.correlation.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {corr.question1.substring(0, 30)}... ↔ {corr.question2.substring(0, 30)}...
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${corr.correlation * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {Math.round(corr.significance * 100)}% significant
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsChart = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Predictive Trends</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">ML Predictions</h5>
            <div className="space-y-4">
              {mlInsights.predictions.trendPredictions.map((pred: any, index: number) => (
                <div key={index} className="bg-purple-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{pred.metric}</span>
                    <span className="text-lg font-bold text-purple-600">
                      {typeof pred.predicted === 'number' && pred.predicted > 100 
                        ? `${Math.round(pred.predicted)}s`
                        : `${Math.round(pred.predicted)}${pred.metric.includes('Rate') || pred.metric.includes('Score') ? '%' : ''}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {pred.confidence}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Performance Metrics</h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(mlInsights.modelMetrics.accuracy)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {mlInsights.modelMetrics.f1Score.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">F1 Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(mlInsights.modelMetrics.dataQuality)}%
                  </div>
                  <div className="text-sm text-gray-600">Data Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(mlInsights.modelMetrics.processingTime)}ms
                  </div>
                  <div className="text-sm text-gray-600">Process Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Chart Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-wrap gap-4">
          {[
            { id: 'sentiment', label: 'Sentiment Analysis', icon: Activity },
            { id: 'clustering', label: 'User Clustering', icon: PieChart },
            { id: 'patterns', label: 'Response Patterns', icon: BarChart3 },
            { id: 'trends', label: 'Predictive Trends', icon: TrendingUp }
          ].map(chart => (
            <button
              key={chart.id}
              onClick={() => setSelectedChart(chart.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedChart === chart.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <chart.icon className="w-4 h-4" />
              <span>{chart.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        {selectedChart === 'sentiment' && renderSentimentChart()}
        {selectedChart === 'clustering' && renderClusteringChart()}
        {selectedChart === 'patterns' && renderPatternsChart()}
        {selectedChart === 'trends' && renderTrendsChart()}
      </div>
    </div>
  );
};

export default DataVisualization;
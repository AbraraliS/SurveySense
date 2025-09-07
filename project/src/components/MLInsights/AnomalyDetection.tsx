import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Clock, Shield, Loader2, AlertCircle as AlertIcon } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface AnomalyDetectionProps {
  results: SurveyResults;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ results }) => {
  const [anomalyData, setAnomalyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);

  useEffect(() => {
    generateAnomalyData();
  }, [results.survey.survey_id]);

  const generateAnomalyData = () => {
    try {
      setLoading(true);
      setError('');
      
      if (!results.responses || results.responses.length === 0) {
        setAnomalyData({
          anomalies: [],
          summary: { total: 0, critical: 0, warning: 0, info: 0 },
          insights: ['No response data available for anomaly detection']
        });
        setLoading(false);
        return;
      }

      const anomalies = [];
      const completionTimes = results.responses
        .filter(r => r.completion_time && r.completion_time > 0)
        .map(r => r.completion_time);
      
      // Advanced statistical analysis
      const avgCompletionTime = completionTimes.length > 0 
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;
      
      const stdCompletionTime = completionTimes.length > 1 
        ? Math.sqrt(completionTimes.reduce((sum, time) => sum + Math.pow(time - avgCompletionTime, 2), 0) / completionTimes.length)
        : 0;

      // 1. Statistical Outlier Detection (Z-score based)
      const zScoreThreshold = 2.5; // 99% confidence interval
      const timeOutliers = results.responses.filter(r => {
        if (!r.completion_time || r.completion_time <= 0) return false;
        const zScore = Math.abs((r.completion_time - avgCompletionTime) / stdCompletionTime);
        return zScore > zScoreThreshold;
      });
      
      if (timeOutliers.length > 0) {
        anomalies.push({
          id: 'time_outliers',
          type: 'Performance',
          severity: timeOutliers.length > results.responses.length * 0.1 ? 'critical' : 'warning',
          title: 'Statistical Time Outliers',
          description: `${timeOutliers.length} responses show extreme completion times (Z-score > ${zScoreThreshold})`,
          confidence: Math.min(95, 70 + timeOutliers.length * 5),
          affectedUsers: timeOutliers.length,
          recommendation: 'Investigate potential technical issues or survey complexity',
          affectedResponses: timeOutliers.map(r => r.response_id || 'unknown')
        });
      }

      // 2. Response Pattern Anomalies (Duplicate Detection)
      const responsePatterns = results.responses.map(r => 
        r.responses?.map(resp => resp.answer).join('|') || ''
      );
      const patternCounts = responsePatterns.reduce((acc, pattern) => {
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const duplicatePatterns = Object.entries(patternCounts)
        .filter(([pattern, count]) => count > 2 && pattern.length > 0)
        .sort(([,a], [,b]) => b - a);
      
      if (duplicatePatterns.length > 0) {
        const totalDuplicates = duplicatePatterns.reduce((sum, [,count]) => sum + count, 0);
        anomalies.push({
          id: 'duplicate_patterns',
          type: 'Data Quality',
          severity: totalDuplicates > results.responses.length * 0.2 ? 'critical' : 'warning',
          title: 'Duplicate Response Patterns',
          description: `${duplicatePatterns.length} identical response patterns detected (${totalDuplicates} total responses)`,
          confidence: Math.min(90, 60 + duplicatePatterns.length * 10),
          affectedUsers: totalDuplicates,
          recommendation: 'Check for bot activity or survey design issues',
          affectedResponses: duplicatePatterns.slice(0, 5).map(([pattern]) => pattern.substring(0, 50) + '...')
        });
      }

      // 3. Response Quality Anomalies
      const qualityScores = results.responses.map(response => {
        const totalQuestions = results.questions.length;
        const answeredQuestions = response.responses?.length || 0;
        const textResponses = response.responses?.filter(r => 
          typeof r.answer === 'string' && r.answer.trim().length > 5
        ).length || 0;
        
        return {
          responseId: response.response_id,
          completionRate: answeredQuestions / totalQuestions,
          textQuality: textResponses / Math.max(answeredQuestions, 1),
          overallScore: (answeredQuestions / totalQuestions) * 0.7 + (textResponses / Math.max(answeredQuestions, 1)) * 0.3
        };
      });

      const avgQualityScore = qualityScores.reduce((sum, q) => sum + q.overallScore, 0) / qualityScores.length;
      const lowQualityResponses = qualityScores.filter(q => q.overallScore < avgQualityScore * 0.5);
      
      if (lowQualityResponses.length > 0) {
        anomalies.push({
          id: 'low_quality_responses',
          type: 'Data Quality',
          severity: lowQualityResponses.length > results.responses.length * 0.3 ? 'critical' : 'warning',
          title: 'Low Quality Responses',
          description: `${lowQualityResponses.length} responses show significantly lower quality scores`,
          confidence: Math.min(85, 65 + lowQualityResponses.length * 3),
          affectedUsers: lowQualityResponses.length,
          recommendation: 'Review question clarity and user engagement strategies',
          affectedResponses: lowQualityResponses.slice(0, 5).map(r => r.responseId)
        });
      }

      // 4. Temporal Anomalies (Response Burst Detection)
      const responseTimes = results.responses
        .map(r => new Date(r.submitted_at).getTime())
        .sort((a, b) => a - b);
      
      const timeGaps = responseTimes.slice(1).map((time, i) => time - responseTimes[i]);
      const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
      
      // Detect response bursts (multiple responses within short time)
      const burstThreshold = avgGap * 0.1; // 10% of average gap
      const bursts = [];
      let currentBurst = [responseTimes[0]];
      
      for (let i = 1; i < responseTimes.length; i++) {
        if (responseTimes[i] - responseTimes[i-1] < burstThreshold) {
          currentBurst.push(responseTimes[i]);
        } else {
          if (currentBurst.length > 3) {
            bursts.push(currentBurst);
          }
          currentBurst = [responseTimes[i]];
        }
      }
      
      if (currentBurst.length > 3) {
        bursts.push(currentBurst);
      }
      
      if (bursts.length > 0) {
        const totalBurstResponses = bursts.reduce((sum, burst) => sum + burst.length, 0);
        anomalies.push({
          id: 'response_bursts',
          type: 'Engagement',
          severity: totalBurstResponses > results.responses.length * 0.15 ? 'critical' : 'warning',
          title: 'Response Burst Activity',
          description: `${bursts.length} response bursts detected (${totalBurstResponses} responses in rapid succession)`,
          confidence: Math.min(80, 50 + bursts.length * 8),
          affectedUsers: totalBurstResponses,
          recommendation: 'Investigate potential coordinated responses or technical issues',
          affectedResponses: bursts.slice(0, 3).map(burst => `${burst.length} responses in ${Math.round((burst[burst.length-1] - burst[0]) / 1000)}s`)
        });
      }

      // 5. Empty or Incomplete Response Anomalies
      const emptyResponses = results.responses.filter(r => 
        !r.responses || r.responses.length === 0
      );
      
      if (emptyResponses.length > 0) {
        anomalies.push({
          id: 'empty_responses',
          type: 'Data Quality',
          severity: 'critical',
          title: 'Empty Response Sessions',
          description: `${emptyResponses.length} response sessions contain no answers`,
          confidence: 95,
          affectedUsers: emptyResponses.length,
          recommendation: 'Check survey functionality and user flow',
          affectedResponses: emptyResponses.map(r => r.response_id || 'unknown')
        });
      }

      // 6. No responses anomaly
      if (results.responses.length === 0) {
        anomalies.push({
          id: 'no_responses',
          type: 'Engagement',
          severity: 'critical',
          title: 'No Survey Responses',
          description: 'Survey has received no responses yet',
          confidence: 100,
          affectedUsers: 0,
          recommendation: 'Promote survey and check accessibility',
          affectedResponses: []
        });
      }

      const summary = {
        total: anomalies.length,
        critical: anomalies.filter(a => a.severity === 'critical').length,
        warning: anomalies.filter(a => a.severity === 'warning').length,
        info: anomalies.filter(a => a.severity === 'info').length
      };

      const insights = [];
      if (anomalies.length === 0) {
        insights.push('No anomalies detected - survey is performing normally');
      } else {
        insights.push(`Detected ${anomalies.length} potential issues requiring attention`);
        if (summary.critical > 0) {
          insights.push(`${summary.critical} critical issues need immediate attention`);
        }
        if (summary.warning > 0) {
          insights.push(`${summary.warning} warning issues should be monitored`);
        }
      }

      setAnomalyData({
        anomalies,
        summary,
        insights
      });
    } catch (error) {
      setError('Failed to generate anomaly detection data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading anomaly detection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <AlertIcon className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!anomalyData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No anomaly detection data available</p>
        </div>
      </div>
    );
  }

  const { anomalies, summary, insights } = anomalyData;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time': return <Clock className="w-4 h-4" />;
      case 'response': return <AlertCircle className="w-4 h-4" />;
      case 'pattern': return <Shield className="w-4 h-4" />;
      case 'quality': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'time': return 'bg-blue-100 text-blue-800';
      case 'response': return 'bg-purple-100 text-purple-800';
      case 'pattern': return 'bg-green-100 text-green-800';
      case 'quality': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  const highAnomalies = anomalies.filter(a => a.severity === 'high');
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium');
  const lowAnomalies = anomalies.filter(a => a.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Anomaly Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Detection Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{criticalAnomalies.length}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{highAnomalies.length}</div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{mediumAnomalies.length}</div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{lowAnomalies.length}</div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Detection Status</span>
            <span className="text-sm text-gray-500">
              {anomalies.length === 0 ? 'No anomalies detected' : 
               `${anomalies.length} anomaly${anomalies.length !== 1 ? 'ies' : ''} found`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                anomalies.length === 0 ? 'bg-green-500' :
                criticalAnomalies.length > 0 ? 'bg-red-500' :
                highAnomalies.length > 0 ? 'bg-orange-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min((anomalies.length / Math.max(results.responses.length / 10, 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {anomalies.length === 0 ? 'All responses appear normal' : 
             'Anomaly detection active - review flagged items'}
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Anomalies</h3>
        
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Anomalies Detected</h3>
            <p className="text-gray-600">
              All survey responses appear to be within normal parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedAnomaly === `${anomaly.type}-${index}` 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAnomaly(selectedAnomaly === `${anomaly.type}-${index}` ? null : `${anomaly.type}-${index}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(anomaly.severity)}
                    <div>
                      <h4 className="font-medium text-gray-900">{anomaly.description}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(anomaly.type)}`}>
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(anomaly.type)}
                            <span>{anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}</span>
                          </div>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {anomaly.confidence}% confidence
                    </div>
                    <div className="text-xs text-gray-500">
                      {anomaly.affectedResponses.length} affected
                    </div>
                  </div>
                </div>

                {selectedAnomaly === `${anomaly.type}-${index}` && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested Action:</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                          {anomaly.suggestedAction}
                        </p>
                      </div>
                      
                      {anomaly.affectedResponses.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Affected Responses:</h5>
                          <div className="bg-gray-50 rounded p-3">
                            <div className="text-sm text-gray-600">
                              {anomaly.affectedResponses.length} response{anomaly.affectedResponses.length !== 1 ? 's' : ''} affected
                            </div>
                            {anomaly.affectedResponses.length <= 5 && (
                              <div className="mt-2 space-y-1">
                                {anomaly.affectedResponses.map((responseId, respIndex) => (
                                  <div key={respIndex} className="text-xs text-gray-500 bg-white rounded px-2 py-1">
                                    Response ID: {responseId}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anomaly Insights */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">High Priority Issues</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {criticalAnomalies.length > 0 && (
                  <li>• {criticalAnomalies.length} critical anomaly{criticalAnomalies.length !== 1 ? 'ies' : ''} requiring immediate attention</li>
                )}
                {highAnomalies.length > 0 && (
                  <li>• {highAnomalies.length} high-severity issue{highAnomalies.length !== 1 ? 's' : ''} to investigate</li>
                )}
                <li>• Average confidence: {Math.round(anomalies.reduce((acc, a) => acc + a.confidence, 0) / anomalies.length)}%</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Review all critical and high-severity anomalies first</li>
                <li>• Investigate patterns in affected responses</li>
                <li>• Consider survey design improvements based on findings</li>
                <li>• Monitor for similar anomalies in future surveys</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Detection Methods */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Methods</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Time-based Detection</div>
                <div className="text-sm text-gray-600">Identifies unusual completion times</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Response Pattern Analysis</div>
                <div className="text-sm text-gray-600">Detects duplicate or suspicious patterns</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Quality Assessment</div>
                <div className="text-sm text-gray-600">Evaluates response completeness and consistency</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">Statistical Outliers</div>
                <div className="text-sm text-gray-600">Uses statistical methods to identify outliers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;

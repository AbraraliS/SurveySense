import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Clock, Shield, Loader2, AlertCircle as AlertIcon } from 'lucide-react';
import { SurveyResults, MLInsights, getMLInsights } from '../../services/api';

interface AnomalyDetectionProps {
  results: SurveyResults;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ results }) => {
  const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);

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
      
      setError('Failed to load anomaly detection data');
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

  if (!mlInsights) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No anomaly detection data available</p>
        </div>
      </div>
    );
  }

  const { anomalies } = mlInsights;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <AlertCircle className="w-5 h-5 text-blue-600" />;
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

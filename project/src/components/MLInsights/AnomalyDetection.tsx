import React, { useState } from 'react';
import { AlertTriangle, Shield, Clock, Eye, Search, Filter } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface AnomalyDetectionProps {
  anomaliesData: Array<{
    type: 'time' | 'response' | 'pattern' | 'quality';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedResponses: string[];
    confidence: number;
    suggestedAction: string;
  }>;
  results: SurveyResults;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ anomaliesData, results }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedAnomaly, setExpandedAnomaly] = useState<number | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time': return Clock;
      case 'response': return Eye;
      case 'pattern': return Search;
      case 'quality': return Shield;
      default: return AlertTriangle;
    }
  };

  const filteredAnomalies = anomaliesData.filter(anomaly => {
    const severityMatch = selectedSeverity === 'all' || anomaly.severity === selectedSeverity;
    const typeMatch = selectedType === 'all' || anomaly.type === selectedType;
    return severityMatch && typeMatch;
  });

  const severityCounts = anomaliesData.reduce((acc, anomaly) => {
    acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Anomaly Overview */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-sm border p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Anomaly Detection</h3>
            <p className="text-gray-600">Machine learning-powered detection of unusual patterns and outliers</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { severity: 'critical', label: 'Critical', count: severityCounts.critical || 0 },
            { severity: 'high', label: 'High', count: severityCounts.high || 0 },
            { severity: 'medium', label: 'Medium', count: severityCounts.medium || 0 },
            { severity: 'low', label: 'Low', count: severityCounts.low || 0 }
          ].map(item => (
            <div key={item.severity} className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{getSeverityIcon(item.severity)}</div>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="time">Time Anomalies</option>
              <option value="response">Response Anomalies</option>
              <option value="pattern">Pattern Anomalies</option>
              <option value="quality">Quality Anomalies</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAnomalies.length} anomal{filteredAnomalies.length !== 1 ? 'ies' : 'y'} found
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Anomalies Found</h3>
            <p className="text-gray-600">
              {selectedSeverity !== 'all' || selectedType !== 'all' 
                ? 'No anomalies match the selected filters.'
                : 'Your survey data appears to be clean and consistent!'
              }
            </p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly, index) => {
            const TypeIcon = getTypeIcon(anomaly.type);
            const isExpanded = expandedAnomaly === index;
            
            return (
              <div 
                key={index}
                className={`border-l-4 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer ${getSeverityColor(anomaly.severity)}`}
                onClick={() => setExpandedAnomaly(isExpanded ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <TypeIcon className="w-5 h-5" />
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {anomaly.type} Anomaly
                      </h4>
                      <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{anomaly.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{anomaly.confidence}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Affected:</span>
                        <span className="font-medium">{anomaly.affectedResponses.length} responses</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="text-2xl mb-2">{getSeverityIcon(anomaly.severity)}</div>
                    <div className="text-xs text-gray-600">
                      {isExpanded ? 'Click to collapse' : 'Click to expand'}
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Detection Confidence</span>
                    <span>{anomaly.confidence}%</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                    <div 
                      className="bg-current h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${anomaly.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Suggested Action</h5>
                        <div className="bg-white bg-opacity-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{anomaly.suggestedAction}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Affected Responses</h5>
                        <div className="bg-white bg-opacity-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                          {anomaly.affectedResponses.length > 0 ? (
                            <div className="space-y-1">
                              {anomaly.affectedResponses.slice(0, 10).map((responseId, idx) => (
                                <div key={idx} className="text-xs font-mono text-gray-600">
                                  {responseId.substring(0, 8)}...
                                </div>
                              ))}
                              {anomaly.affectedResponses.length > 10 && (
                                <div className="text-xs text-gray-500">
                                  ...and {anomaly.affectedResponses.length - 10} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No specific responses identified</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Detection Details</h5>
                      <div className="bg-white bg-opacity-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Algorithm:</span>
                            <span className="font-medium ml-2">
                              {anomaly.type === 'time' ? 'Statistical Outlier Detection' :
                               anomaly.type === 'pattern' ? 'Isolation Forest' :
                               anomaly.type === 'quality' ? 'Data Quality Analysis' :
                               'Response Pattern Analysis'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Detection Time:</span>
                            <span className="font-medium ml-2">{new Date().toLocaleTimeString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium ml-2 capitalize">{anomaly.severity} Priority</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AnomalyDetection;
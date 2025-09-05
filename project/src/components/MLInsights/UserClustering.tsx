import React, { useState, useEffect } from 'react';
import { Users, GitBranch, Target, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { SurveyResults, MLInsights, getMLInsights } from '../../services/api';

interface UserClusteringProps {
  results: SurveyResults;
}

const UserClustering: React.FC<UserClusteringProps> = ({ results }) => {
  const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
      
      setError('Failed to load clustering data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user clustering analysis...</p>
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
          <p className="text-gray-600">No clustering data available</p>
        </div>
      </div>
    );
  }

  const { clustering } = mlInsights;
  const { userGroups, clusteringAccuracy, silhouetteScore } = clustering;

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSilhouetteColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Clustering Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Clustering Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <GitBranch className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{userGroups.length}</div>
            <div className="text-sm text-gray-600">User Groups</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{Math.round(clusteringAccuracy)}%</div>
            <div className="text-sm text-gray-600">Clustering Accuracy</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getSilhouetteColor(silhouetteScore)}`}>
              {silhouetteScore.toFixed(3)}
            </div>
            <div className="text-sm text-gray-600">Silhouette Score</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Model Quality</span>
            <span className="text-sm text-gray-500">
              {silhouetteScore > 0.7 ? 'Excellent' : 
               silhouetteScore > 0.5 ? 'Good' : 
               silhouetteScore > 0.3 ? 'Fair' : 'Poor'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                silhouetteScore > 0.7 ? 'bg-green-500' : 
                silhouetteScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(silhouetteScore * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Silhouette score ranges from -1 to 1, where higher values indicate better clustering
          </div>
        </div>
      </div>

      {/* User Groups */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified User Groups</h3>
        
        {userGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No User Groups Found</h3>
            <p className="text-gray-600">
              Insufficient data to perform meaningful clustering analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userGroups.map((group, index) => (
              <div 
                key={group.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedGroup === group.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <h4 className="font-semibold text-gray-900">{group.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {group.size} users
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((group.size / results.responses.length) * 100)}% of total
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Characteristics:</h5>
                    <div className="flex flex-wrap gap-2">
                      {group.characteristics.map((char, charIndex) => (
                        <span 
                          key={charIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Behavior Profile:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg. Completion Time:</span>
                        <span className="font-medium">{group.behaviorProfile.avgCompletionTime}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Quality:</span>
                        <span className="font-medium">{group.behaviorProfile.responseQuality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engagement Level:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(group.behaviorProfile.engagementLevel)}`}>
                          {group.behaviorProfile.engagementLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedGroup === group.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Responses:</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {group.responses.slice(0, 3).map((response, respIndex) => (
                        <div key={respIndex} className="bg-gray-50 rounded p-2 text-sm">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>User {response.response_id}</span>
                            <span>{response.completion_time}s</span>
                          </div>
                          <div className="text-gray-700">
                            {Object.keys(response.responses).length} questions answered
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clustering Insights */}
      {userGroups.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clustering Insights</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Model Performance</h4>
              <p className="text-sm text-blue-800">
                The clustering algorithm identified {userGroups.length} distinct user groups with 
                {clusteringAccuracy > 80 ? ' excellent' : clusteringAccuracy > 60 ? ' good' : ' fair'} accuracy. 
                The silhouette score of {silhouetteScore.toFixed(3)} indicates 
                {silhouetteScore > 0.7 ? ' well-separated clusters' : 
                 silhouetteScore > 0.5 ? ' reasonably separated clusters' : 
                 ' overlapping clusters that may need refinement'}.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Key Findings</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {userGroups.length} distinct user behavior patterns identified</li>
                <li>• Largest group: {userGroups.reduce((max, group) => group.size > max.size ? group : max).name} ({Math.round((userGroups.reduce((max, group) => group.size > max.size ? group : max).size / results.responses.length) * 100)}%)</li>
                <li>• Average engagement level: {userGroups.reduce((sum, group) => sum + (group.behaviorProfile.responseQuality), 0) / userGroups.length}%</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Tailor survey design for the largest user group</li>
                <li>• Consider different question formats for different engagement levels</li>
                <li>• Optimize completion time based on user behavior patterns</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserClustering;

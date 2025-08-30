import React, { useState } from 'react';
import { Users, GitBranch, Target, TrendingUp, Zap, Clock, Star } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface ClusteringData {
  userGroups: Array<{
    id: string;
    name: string;
    characteristics: string[];
    size: number;
    centroid: number[];
    responses: any[];
    behaviorProfile: {
      avgCompletionTime: number;
      responseQuality: number;
      engagementLevel: string;
    };
  }>;
  clusteringAccuracy: number;
  silhouetteScore: number;
}

interface UserClusteringProps {
  clusteringData: ClusteringData;
  results: SurveyResults;
}

const UserClustering: React.FC<UserClusteringProps> = ({ clusteringData, results }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGroupColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Clustering Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <GitBranch className="w-6 h-6 text-blue-500" />
          <span>User Clustering Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{clusteringData.userGroups.length}</div>
            <div className="text-sm text-blue-700">User Groups</div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{Math.round(clusteringData.clusteringAccuracy)}%</div>
            <div className="text-sm text-green-700">Clustering Accuracy</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{clusteringData.silhouetteScore.toFixed(3)}</div>
            <div className="text-sm text-purple-700">Silhouette Score</div>
          </div>
        </div>

        {/* Cluster Distribution */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Group Size Distribution</h4>
          {clusteringData.userGroups.map((group, index) => {
            const percentage = (group.size / results.responses.length) * 100;
            return (
              <div key={group.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{group.name}</span>
                  <span className="font-medium">{group.size} users ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getGroupColor(index)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Group Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clusteringData.userGroups.map((group, index) => (
          <div key={group.id} className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-4 h-4 rounded-full ${getGroupColor(index)}`}></div>
              <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {group.size} users
              </span>
            </div>

            {/* Behavior Profile */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">
                    {formatTime(group.behaviorProfile.avgCompletionTime)}
                  </div>
                  <div className="text-xs text-gray-600">Avg. Time</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">
                    {group.behaviorProfile.responseQuality}%
                  </div>
                  <div className="text-xs text-gray-600">Quality Score</div>
                </div>
              </div>
              
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(group.behaviorProfile.engagementLevel)}`}>
                  {group.behaviorProfile.engagementLevel.toUpperCase()} Engagement
                </span>
              </div>
            </div>

            {/* Characteristics */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Key Characteristics</h5>
              <div className="space-y-2">
                {group.characteristics.map((characteristic, charIndex) => (
                  <div key={charIndex} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">{characteristic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Responses */}
            {group.responses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">Sample Responses</h5>
                <div className="text-xs text-gray-500">
                  {Math.min(3, group.responses.length)} of {group.responses.length} responses
                </div>
                <div className="mt-2 space-y-1">
                  {group.responses.slice(0, 3).map((response, respIndex) => (
                    <div key={respIndex} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                      User {respIndex + 1}: {response.user_name || 'Anonymous'} • 
                      {formatTime(response.completion_time || 0)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clustering Insights */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>Clustering Insights</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div></div>
            <h5 className="font-semibold text-gray-900 mb-3">Key Findings</h5>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>
                  {clusteringData.userGroups[0]?.name || 'Primary group'} represents the largest segment 
                  ({Math.max(...clusteringData.userGroups.map(g => g.size))} users)
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                <span>
                  High clustering accuracy ({Math.round(clusteringData.clusteringAccuracy)}%) 
                  indicates distinct user behavior patterns
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                <span>
                  Silhouette score of {clusteringData.silhouetteScore.toFixed(3)} suggests 
                  {clusteringData.silhouetteScore > 0.7 ? 'excellent' : 
                   clusteringData.silhouetteScore > 0.5 ? 'good' : 'fair'} cluster separation
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Recommendations</h5>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                <span>
                  Customize survey experience for each user group to improve engagement
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                <span>
                  Focus retention strategies on groups with higher dropout rates
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                <span>
                  Leverage insights from high-engagement groups to improve overall experience
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserClustering;
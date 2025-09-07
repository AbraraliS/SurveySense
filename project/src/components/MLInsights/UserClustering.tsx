import React, { useState, useEffect } from 'react';
import { Users, GitBranch, Target, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface UserClusteringProps {
  results: SurveyResults;
}

const UserClustering: React.FC<UserClusteringProps> = ({ results }) => {
  const [clusteringData, setClusteringData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    generateClusteringData();
  }, [results.survey.survey_id]);

  // Advanced clustering algorithm using multiple features
  const generateClusteringData = () => {
    try {
      setLoading(true);
      setError('');
      
      if (!results || !Array.isArray(results.responses) || results.responses.length === 0) {
        setClusteringData({
          clusters: [],
          totalUsers: 0,
          insights: ['No response data available for clustering analysis']
        });
        setLoading(false);
        return;
      }

      const questionsLen = Array.isArray(results.questions) ? results.questions.length : 0;

      // Extract comprehensive user features for clustering (handle array or object response shapes)
      const responsePatterns = results.responses.map((response, index) => {
        const rawResponses: any = response?.responses ?? [];
        const responseValues: any[] = Array.isArray(rawResponses)
          ? rawResponses.map((r: any) => (r ? r.answer : undefined)).filter((v: any) => v !== undefined && v !== null)
          : Object.values(rawResponses).filter((v: any) => v !== undefined && v !== null);

        const uniqueResponses = new Set(responseValues).size;
        const textResponses = responseValues.filter((val: any) => typeof val === 'string' && val.trim().length > 10);
        const avgTextLength = textResponses.length > 0 
          ? textResponses.reduce((sum: number, text: string) => sum + text.length, 0) / textResponses.length 
          : 0;
        
        return {
          id: `user_${index + 1}`,
          name: response.respondent_name || `Respondent ${index + 1}`,
          email: response.respondent_email || null,
          age: response.respondent_age || null,
          occupation: response.respondent_occupation || null,
          completionTime: typeof response.completion_time === 'number' ? response.completion_time : 0,
          responseCount: Array.isArray(rawResponses) ? rawResponses.length : Object.keys(rawResponses || {}).length,
          patterns: responseValues,
          // Advanced features for clustering
          responseVariety: uniqueResponses / Math.max(responseValues.length, 1), // 0-1 scale
          textEngagement: avgTextLength / 100, // Normalized text length
          completionRate: (Array.isArray(rawResponses) ? rawResponses.length : Object.keys(rawResponses || {}).length) / Math.max(1, questionsLen),
          isAnonymous: !response.respondent_name || response.respondent_name.includes('Respondent')
        };
      });

      // Calculate statistics for clustering thresholds
      const completionTimes = responsePatterns.map(r => r.completionTime || 0).filter(t => t > 0);
      const avgCompletionTime = completionTimes.length > 0 
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
        : 0;
      const stdCompletionTime = completionTimes.length > 1 
        ? Math.sqrt(completionTimes.reduce((sum, time) => sum + Math.pow(time - avgCompletionTime, 2), 0) / completionTimes.length)
        : 0;

      const clusters = [];
      
      // Advanced clustering based on multiple features
      
      // Cluster 1: Engaged Experts (high variety, detailed responses, reasonable time)
      const engagedExperts = responsePatterns.filter(r => 
        r.responseVariety > 0.7 && 
        r.textEngagement > 0.5 && 
        r.completionTime > avgCompletionTime * 0.5 && 
        r.completionTime < avgCompletionTime * 2
      );
      if (engagedExperts.length > 0) {
        clusters.push({
          id: 'engaged_experts',
          name: 'Engaged Experts',
          description: 'Highly engaged users providing detailed, varied responses',
          size: engagedExperts.length,
          percentage: Math.round((engagedExperts.length / responsePatterns.length) * 100),
          characteristics: [
            'High response variety',
            'Detailed text responses',
            'Thoughtful engagement',
            'Quality feedback providers'
          ],
          users: engagedExperts,
          color: 'green',
          avgCompletionTime: Math.round(engagedExperts.reduce((sum, u) => sum + u.completionTime, 0) / engagedExperts.length),
          avgResponseVariety: (engagedExperts.reduce((sum, u) => sum + u.responseVariety, 0) / engagedExperts.length).toFixed(2)
        });
      }

      // Cluster 2: Quick Decision Makers (fast completion, moderate variety)
      const quickDecisionMakers = responsePatterns.filter(r => 
        r.completionTime > 0 && 
        r.completionTime < avgCompletionTime * 0.7 && 
        r.responseVariety > 0.3
      );
      if (quickDecisionMakers.length > 0) {
        clusters.push({
          id: 'quick_decision_makers',
          name: 'Quick Decision Makers',
          description: 'Fast responders with clear preferences',
          size: quickDecisionMakers.length,
          percentage: Math.round((quickDecisionMakers.length / responsePatterns.length) * 100),
          characteristics: [
            'Fast completion times',
            'Clear preferences',
            'Efficient decision making',
            'High engagement'
          ],
          users: quickDecisionMakers,
          color: 'blue',
          avgCompletionTime: Math.round(quickDecisionMakers.reduce((sum, u) => sum + u.completionTime, 0) / quickDecisionMakers.length),
          avgResponseVariety: (quickDecisionMakers.reduce((sum, u) => sum + u.responseVariety, 0) / quickDecisionMakers.length).toFixed(2)
        });
      }

      // Cluster 3: Thoughtful Analyzers (slow completion, high variety)
      const thoughtfulAnalyzers = responsePatterns.filter(r => 
        r.completionTime > avgCompletionTime * 1.5 && 
        r.responseVariety > 0.6
      );
      if (thoughtfulAnalyzers.length > 0) {
        clusters.push({
          id: 'thoughtful_analyzers',
          name: 'Thoughtful Analyzers',
          description: 'Users who take time to provide comprehensive responses',
          size: thoughtfulAnalyzers.length,
          percentage: Math.round((thoughtfulAnalyzers.length / responsePatterns.length) * 100),
          characteristics: [
            'Careful consideration',
            'High response variety',
            'Comprehensive answers',
            'Quality over speed'
          ],
          users: thoughtfulAnalyzers,
          color: 'purple',
          avgCompletionTime: Math.round(thoughtfulAnalyzers.reduce((sum, u) => sum + u.completionTime, 0) / thoughtfulAnalyzers.length),
          avgResponseVariety: (thoughtfulAnalyzers.reduce((sum, u) => sum + u.responseVariety, 0) / thoughtfulAnalyzers.length).toFixed(2)
        });
      }

      // Cluster 4: Privacy-Conscious Users (anonymous, moderate engagement)
      const privacyConscious = responsePatterns.filter(r => 
        r.isAnonymous && 
        r.completionRate > 0.5
      );
      if (privacyConscious.length > 0) {
        clusters.push({
          id: 'privacy_conscious',
          name: 'Privacy-Conscious Users',
          description: 'Users who prioritize privacy but still engage meaningfully',
          size: privacyConscious.length,
          percentage: Math.round((privacyConscious.length / responsePatterns.length) * 100),
          characteristics: [
            'Privacy focused',
            'Anonymous participation',
            'Content-focused feedback',
            'Moderate engagement'
          ],
          users: privacyConscious,
          color: 'gray',
          avgCompletionTime: Math.round(privacyConscious.reduce((sum, u) => sum + u.completionTime, 0) / privacyConscious.length),
          avgResponseVariety: (privacyConscious.reduce((sum, u) => sum + u.responseVariety, 0) / privacyConscious.length).toFixed(2)
        });
      }

      // Cluster 5: Casual Responders (low variety, moderate time)
      const casualResponders = responsePatterns.filter(r => 
        r.responseVariety < 0.4 && 
        r.completionTime > avgCompletionTime * 0.3 && 
        r.completionTime < avgCompletionTime * 1.5 &&
        !r.isAnonymous
      );
      if (casualResponders.length > 0) {
        clusters.push({
          id: 'casual_responders',
          name: 'Casual Responders',
          description: 'Users with consistent but less varied response patterns',
          size: casualResponders.length,
          percentage: Math.round((casualResponders.length / responsePatterns.length) * 100),
          characteristics: [
            'Consistent responses',
            'Moderate engagement',
            'Predictable patterns',
            'Steady participation'
          ],
          users: casualResponders,
          color: 'orange',
          avgCompletionTime: Math.round(casualResponders.reduce((sum, u) => sum + u.completionTime, 0) / casualResponders.length),
          avgResponseVariety: (casualResponders.reduce((sum, u) => sum + u.responseVariety, 0) / casualResponders.length).toFixed(2)
        });
      }

      // Generate insights
      const insights = [];
      if (clusters.length > 1) {
        insights.push(`Identified ${clusters.length} distinct user segments`);
      }
      
      const largestCluster = clusters.reduce((max, cluster) => 
        cluster.size > max.size ? cluster : max, clusters[0] || { size: 0 }
      );
      
      if (largestCluster.size > 0) {
        insights.push(`${largestCluster.name} is the largest segment (${largestCluster.percentage}%)`);
      }

      const quickCount = typeof quickDecisionMakers !== 'undefined' ? quickDecisionMakers.length : 0;
      const thoughtfulCount = typeof thoughtfulAnalyzers !== 'undefined' ? thoughtfulAnalyzers.length : 0;
      if (quickCount > thoughtfulCount) {
        insights.push('Survey appears user-friendly with many quick completions');
      } else if (thoughtfulCount > quickCount) {
        insights.push('Survey requires careful consideration from most users');
      }

      setClusteringData({
        clusters,
        totalUsers: responsePatterns.length,
        insights
      });
    } catch (error) {
      console.error('UserClustering generateClusteringData error:', error);
      setError('Failed to generate clustering data');
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

  if (!clusteringData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No clustering data available</p>
        </div>
      </div>
    );
  }

  const { clusters, totalUsers, insights } = clusteringData;

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
            <div className="text-2xl font-bold text-blue-600">{clusters.length}</div>
            <div className="text-sm text-gray-600">User Groups</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {clusters.length > 0 ? Math.round(clusters.reduce((sum, c) => sum + c.percentage, 0) / clusters.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Group Size</div>
          </div>
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Key Insights</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Groups */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified User Groups</h3>
        
        {clusters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No User Groups Found</h3>
            <p className="text-gray-600">
              Insufficient data to perform meaningful clustering analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clusters.map((cluster, index) => (
              <div 
                key={cluster.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedGroup === cluster.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedGroup(selectedGroup === cluster.id ? null : cluster.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${cluster.color}-500`}></div>
                    <h4 className="font-semibold text-gray-900">{cluster.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {cluster.size} users
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {cluster.percentage}% of total
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Characteristics:</h5>
                    <div className="flex flex-wrap gap-2">
                      {cluster.characteristics.map((char, charIndex) => (
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
                        <span className="font-medium">
                          {cluster.users.length > 0 
                            ? Math.round(cluster.users.reduce((sum, user) => sum + (user.completionTime || 0), 0) / cluster.users.length)
                            : 0}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Count:</span>
                        <span className="font-medium">
                          {cluster.users.length > 0 
                            ? Math.round(cluster.users.reduce((sum, user) => sum + (user.responseCount || 0), 0) / cluster.users.length)
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group Size:</span>
                        <span className="font-medium">{cluster.size} users</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedGroup === cluster.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Users:</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {cluster.users.slice(0, 3).map((user, userIndex) => (
                        <div key={userIndex} className="bg-gray-50 rounded p-2 text-sm">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{user.name}</span>
                            <span>{user.completionTime}s</span>
                          </div>
                          <div className="text-gray-700">
                            {user.email ? `Email: ${user.email}` : 'Anonymous user'}
                            {user.age && ` • Age: ${user.age}`}
                            {user.occupation && ` • ${user.occupation}`}
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
      {clusters.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clustering Insights</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Model Performance</h4>
              <p className="text-sm text-blue-800">
                The clustering algorithm identified {clusters.length} distinct user groups with 
                {totalUsers > 10 ? ' good' : totalUsers > 5 ? ' fair' : ' limited'} data quality. 
                The analysis is based on {totalUsers} total users and their response patterns.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Key Findings</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {clusters.length} distinct user behavior patterns identified</li>
                <li>• Largest group: {clusters.length > 0 ? clusters.reduce((max, cluster) => cluster.size > max.size ? cluster : max).name : 'None'} ({clusters.length > 0 ? clusters.reduce((max, cluster) => cluster.size > max.size ? cluster : max).percentage : 0}%)</li>
                <li>• Total users analyzed: {totalUsers}</li>
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

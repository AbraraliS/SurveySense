import React from 'react';
import { Users, Activity, PieChart, User, Edit3, List, MessageSquare } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface OverviewTabProps {
  results: SurveyResults;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ results }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Analytics calculations
  const questionTypes = results.questions.reduce((acc, q) => {
    acc[q.question_type] = (acc[q.question_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const registeredUsers = results.responses.filter(r => r.user_id).length;
  const anonymousUsers = results.responses.length - registeredUsers;

  return (
    <div className="space-y-8">
      {/* Survey Summary */}
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Survey Summary</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(results.survey.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{results.survey.questions_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target Audience:</span>
                <span className="font-medium">{results.survey.audience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Survey ID:</span>
                <span className="font-mono text-sm">{results.survey.survey_id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Responses:</span>
                <span className="font-medium text-blue-600">{results.analytics.total_responses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registered Users:</span>
                <span className="font-medium text-green-600">{registeredUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Anonymous Users:</span>
                <span className="font-medium text-purple-600">{anonymousUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium text-orange-600">{results.analytics.completion_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Types Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            <span>Question Types</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(questionTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  {type === 'MCQ' ? <List className="w-4 h-4 text-green-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                  <span className="text-gray-600">{type === 'MCQ' ? 'Multiple Choice' : 'Text Response'}</span>
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>User Distribution</span>
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Registered Users</span>
                <span className="font-semibold">{registeredUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${results.analytics.total_responses > 0 ? (registeredUsers / results.analytics.total_responses) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Anonymous Users</span>
                <span className="font-semibold">{anonymousUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${results.analytics.total_responses > 0 ? (anonymousUsers / results.analytics.total_responses) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Responses */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600" />
          <span>Recent Activity</span>
        </h3>
        {results.responses.length > 0 ? (
          <div className="space-y-3">
            {results.responses.slice(0, 5).map((response) => (
              <div key={response.response_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{response.user_name || 'Anonymous User'}</p>
                    <p className="text-xs text-gray-500">{formatDate(response.submitted_at)}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {response.user_id ? 'Registered' : 'Anonymous'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No responses yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;

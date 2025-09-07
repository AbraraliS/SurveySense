import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface AnalyticsTabProps {
  results: SurveyResults;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ results }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create response trend from actual response data
  const createResponseTrend = () => {
    if (!results.responses || results.responses.length === 0) return [];
    
    // Group responses by date
    const dateGroups: { [key: string]: number } = {};
    results.responses.forEach(response => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });
    
    return Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const responseTrend = createResponseTrend();

  // Calculate completion time analytics
  const completionTimes = results.responses
    ?.filter(r => r.completion_time && r.completion_time > 0)
    ?.map(r => r.completion_time) || [];
  
  const avgCompletionTime = completionTimes.length > 0 
    ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
    : 0;

  // Calculate response rate
  const totalPossibleResponses = results.questions?.length || 0;
  const actualResponses = results.responses?.length || 0;
  const responseRate = totalPossibleResponses > 0 ? Math.round((actualResponses / totalPossibleResponses) * 100) : 0;

  const questionAnalytics = results.questions?.map(question => {
    // Extract responses for this specific question from all response sessions
    const responses = results.responses?.flatMap(r => 
      r.responses?.filter(resp => resp.question_id === question.question_id).map(resp => resp.answer) || []
    ).filter(Boolean) || [];
    
    if (question.question_type === 'MCQ' && question.options) {
      const optionCounts = question.options.reduce((acc, option) => {
        acc[option] = responses.filter(r => r === option).length;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        question_id: question.question_id,
        question_text: question.question_text,
        type: 'MCQ',
        total_responses: responses.length,
        data: {
          labels: Object.keys(optionCounts),
          values: Object.values(optionCounts)
        }
      };
    } else {
      return {
        question_id: question.question_id,
        question_text: question.question_text,
        type: 'TEXT',
        total_responses: responses.length,
        responses: responses
      };
    }
  }) || [];

  return (
    <div className="space-y-8">
      {/* Summary Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Responses</h3>
          <p className="text-3xl font-bold text-blue-600">{actualResponses}</p>
          <p className="text-sm text-gray-500 mt-1">respondents</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Completion Time</h3>
          <p className="text-3xl font-bold text-green-600">{avgCompletionTime}s</p>
          <p className="text-sm text-gray-500 mt-1">per survey</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Response Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{responseRate}%</p>
          <p className="text-sm text-gray-500 mt-1">completion rate</p>
        </div>
      </div>

      {/* Response Trend */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Response Trend</span>
        </h3>
        {responseTrend.length > 0 ? (
          <div className="space-y-3">
            {responseTrend.map(({ date, count }) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-gray-600">{formatDate(date)}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${responseTrend.length > 0 ? Math.max(10, (count / Math.max(...responseTrend.map(t => t.count))) * 100) : 10}%` 
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No trend data available</p>
        )}
      </div>

      {/* Completion Time Distribution */}
      {completionTimes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>Completion Time Distribution</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Time</span>
              <span className="font-semibold text-green-600">{avgCompletionTime}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fastest Completion</span>
              <span className="font-semibold text-green-600">{Math.min(...completionTimes)}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Slowest Completion</span>
              <span className="font-semibold text-green-600">{Math.max(...completionTimes)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Question Analytics */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <span>Question Analysis</span>
        </h3>
        
        {questionAnalytics.length > 0 ? questionAnalytics.map((question) => (
          <div key={question.question_id} className="bg-white rounded-2xl shadow-sm border p-6">
            <h4 className="font-semibold text-gray-900 mb-4">{question.question_text}</h4>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                {question.type === 'MCQ' ? 'Multiple Choice' : 'Text Response'}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {question.total_responses} responses
              </span>
            </div>
            
            {question.type === 'MCQ' && question.data ? (
              <div className="space-y-3">
                {question.data.labels.map((label, index) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-700">{label}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${question.total_responses > 0 ? (question.data.values[index] / question.total_responses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold w-8 text-right">{question.data.values[index]}</span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {question.total_responses > 0 ? Math.round((question.data.values[index] / question.total_responses) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Sample responses:</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {question.responses?.slice(0, 3).map((response, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{response}</p>
                    </div>
                  ))}
                </div>
                {(question.responses?.length || 0) > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    And {(question.responses?.length || 0) - 3} more responses...
                  </p>
                )}
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <p className="text-gray-500 text-center py-8">No question data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;

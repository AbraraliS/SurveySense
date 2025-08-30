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

  // Analytics calculations
  const responseTrend = Object.entries(results.analytics.response_by_date).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const questionAnalytics = results.questions.map(question => {
    const responses = results.responses.map(r => r.responses[question.question_id]).filter(Boolean);
    
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
  });

  return (
    <div className="space-y-8">
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
                        width: `${Math.max(10, (count / Math.max(...responseTrend.map(t => t.count))) * 100)}%` 
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

      {/* Question Analytics */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <span>Question Analysis</span>
        </h3>
        
        {questionAnalytics.map((question) => (
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
        ))}
      </div>
    </div>
  );
};

export default AnalyticsTab;
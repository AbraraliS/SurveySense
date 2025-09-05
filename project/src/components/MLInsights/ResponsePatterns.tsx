import React, { useMemo } from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Timer,
  MousePointer,
  Eye
} from 'lucide-react';
import { SurveyResults, SurveyResponse } from '../../services/api';

interface ResponsePatternMetrics {
  avgResponseTime: number;
  responseDistribution: { [key: string]: number };
  completionPatterns: {
    quickResponders: number;
    normalResponders: number;
    slowResponders: number;
  };
  questionSkipRate: { [questionId: string]: number };
  responseLength: {
    avg: number;
    min: number;
    max: number;
    distribution: { short: number; medium: number; long: number };
  };
  userBehaviorPatterns: {
    straightLiners: number;
    thoughtfulResponders: number;
    speedRunners: number;
    abandonmentRate: number;
  };
  temporalPatterns: {
    hourlyDistribution: { [hour: string]: number };
    dayOfWeekDistribution: { [day: string]: number };
    peakResponseTimes: string[];
  };
  responseQuality: {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    averageScore: number;
  };
}

interface ResponsePatternsProps {
  results: SurveyResults;
}

const ResponsePatterns: React.FC<ResponsePatternsProps> = ({ results }) => {
  
  const patterns = useMemo((): ResponsePatternMetrics => {
    if (!results.responses.length) {
      return {
        avgResponseTime: 0,
        responseDistribution: {},
        completionPatterns: { quickResponders: 0, normalResponders: 0, slowResponders: 0 },
        questionSkipRate: {},
        responseLength: { avg: 0, min: 0, max: 0, distribution: { short: 0, medium: 0, long: 0 } },
        userBehaviorPatterns: { straightLiners: 0, thoughtfulResponders: 0, speedRunners: 0, abandonmentRate: 0 },
        temporalPatterns: { hourlyDistribution: {}, dayOfWeekDistribution: {}, peakResponseTimes: [] },
        responseQuality: { highQuality: 0, mediumQuality: 0, lowQuality: 0, averageScore: 0 }
      };
    }

    // 1. Average Response Time Analysis
    const responseTimes = results.responses
      .map(r => r.completion_time)
      .filter((time): time is number => typeof time === 'number' && time > 0);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // 2. Response Distribution by Question Type
    const responseDistribution: { [key: string]: number } = {};
    results.questions.forEach(question => {
      const responseCount = results.responses.filter(r => 
        r.responses[question.question_id] && 
        r.responses[question.question_id].toString().trim() !== ''
      ).length;
      responseDistribution[question.question_type] = 
        (responseDistribution[question.question_type] || 0) + responseCount;
    });

    // 3. Completion Patterns (based on response time)
    const timeThresholds = {
      quick: avgResponseTime * 0.7,
      slow: avgResponseTime * 1.5
    };
    
    const completionPatterns = responseTimes.reduce(
      (acc, time) => {
        if (time <= timeThresholds.quick) acc.quickResponders++;
        else if (time >= timeThresholds.slow) acc.slowResponders++;
        else acc.normalResponders++;
        return acc;
      },
      { quickResponders: 0, normalResponders: 0, slowResponders: 0 }
    );

    // 4. Question Skip Rate Analysis
    const questionSkipRate: { [questionId: string]: number } = {};
    results.questions.forEach(question => {
      const totalResponses = results.responses.length;
      const answeredResponses = results.responses.filter(r => 
        r.responses[question.question_id] && 
        r.responses[question.question_id].toString().trim() !== ''
      ).length;
      questionSkipRate[question.question_id] = totalResponses > 0 
        ? ((totalResponses - answeredResponses) / totalResponses) * 100 
        : 0;
    });

    // 5. Response Length Analysis (for text responses)
    const textResponses = results.responses.flatMap(response =>
      results.questions
        .filter(q => q.question_type === 'TEXT')
        .map(q => response.responses[q.question_id])
        .filter(text => text && typeof text === 'string')
        .map(text => text.length)
    );

    const responseLength = textResponses.length > 0 ? {
      avg: textResponses.reduce((a, b) => a + b, 0) / textResponses.length,
      min: Math.min(...textResponses),
      max: Math.max(...textResponses),
      distribution: textResponses.reduce(
        (acc, length) => {
          if (length < 50) acc.short++;
          else if (length < 200) acc.medium++;
          else acc.long++;
          return acc;
        },
        { short: 0, medium: 0, long: 0 }
      )
    } : { avg: 0, min: 0, max: 0, distribution: { short: 0, medium: 0, long: 0 } };

    // 6. User Behavior Pattern Analysis
    const userBehaviorPatterns = results.responses.reduce(
      (acc, response) => {
        const responseValues = Object.values(response.responses).filter(Boolean);
        const uniqueResponses = new Set(responseValues).size;
        const totalResponses = responseValues.length;
        
        // Straight-liner: gives same/similar answers repeatedly
        if (uniqueResponses <= totalResponses * 0.3 && totalResponses > 3) {
          acc.straightLiners++;
        }
        // Speed runner: completes very quickly
        else if (response.completion_time && response.completion_time < avgResponseTime * 0.5) {
          acc.speedRunners++;
        }
        // Thoughtful responder: takes time and gives varied responses
        else if (response.completion_time && response.completion_time > avgResponseTime * 0.8 && uniqueResponses > totalResponses * 0.7) {
          acc.thoughtfulResponders++;
        }
        
        return acc;
      },
      { straightLiners: 0, thoughtfulResponders: 0, speedRunners: 0, abandonmentRate: 0 }
    );

    // Calculate abandonment rate (responses with missing answers)
    const completeResponses = results.responses.filter(response => {
      const answeredQuestions = Object.values(response.responses).filter(Boolean).length;
      return answeredQuestions >= results.questions.length * 0.8; // 80% completion threshold
    }).length;
    userBehaviorPatterns.abandonmentRate = results.responses.length > 0 
      ? ((results.responses.length - completeResponses) / results.responses.length) * 100 
      : 0;

    // 7. Temporal Patterns Analysis
    const temporalPatterns = results.responses.reduce(
      (acc, response) => {
        const date = new Date(response.submitted_at);
        const hour = date.getHours().toString();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        acc.hourlyDistribution[hour] = (acc.hourlyDistribution[hour] || 0) + 1;
        acc.dayOfWeekDistribution[day] = (acc.dayOfWeekDistribution[day] || 0) + 1;
        
        return acc;
      },
      { 
        hourlyDistribution: {} as { [hour: string]: number }, 
        dayOfWeekDistribution: {} as { [day: string]: number },
        peakResponseTimes: [] as string[]
      }
    );

    // Find peak response times
    const sortedHours = Object.entries(temporalPatterns.hourlyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour);
        return h === 0 ? '12 AM' : h <= 12 ? `${h} AM` : `${h - 12} PM`;
      });
    temporalPatterns.peakResponseTimes = sortedHours;

    // 8. Response Quality Analysis
    const responseQuality = results.responses.reduce(
      (acc, response) => {
        let qualityScore = 0;
        let maxScore = 0;
        
        results.questions.forEach(question => {
          const answer = response.responses[question.question_id];
          maxScore += 3; // Max 3 points per question
          
          if (answer && answer.toString().trim() !== '') {
            qualityScore += 1; // 1 point for answering
            
            if (question.question_type === 'TEXT') {
              const textLength = answer.toString().length;
              if (textLength > 10) qualityScore += 1; // 1 point for substantial text
              if (textLength > 50) qualityScore += 1; // 1 point for detailed text
            } else {
              qualityScore += 2; // 2 points for MCQ (assuming valid choice)
            }
          }
        });
        
        const scorePercentage = maxScore > 0 ? (qualityScore / maxScore) * 100 : 0;
        
        if (scorePercentage >= 80) acc.highQuality++;
        else if (scorePercentage >= 50) acc.mediumQuality++;
        else acc.lowQuality++;
        
        return acc;
      },
      { highQuality: 0, mediumQuality: 0, lowQuality: 0, averageScore: 0 }
    );

    // Calculate average quality score
    const totalQualityResponses = responseQuality.highQuality + responseQuality.mediumQuality + responseQuality.lowQuality;
    if (totalQualityResponses > 0) {
      responseQuality.averageScore = (
        (responseQuality.highQuality * 90 + responseQuality.mediumQuality * 65 + responseQuality.lowQuality * 25) 
        / totalQualityResponses
      );
    }

    return {
      avgResponseTime,
      responseDistribution,
      completionPatterns,
      questionSkipRate,
      responseLength,
      userBehaviorPatterns,
      temporalPatterns,
      responseQuality
    };
  }, [results]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!results.responses.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Response Data</h3>
          <p className="text-gray-600">Response patterns will appear here once users start responding to your survey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Time Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-blue-500" />
          <span>Response Time Patterns</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{formatTime(patterns.avgResponseTime)}</div>
            <div className="text-sm text-blue-700">Average Time</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{patterns.completionPatterns.quickResponders}</div>
            <div className="text-sm text-green-700">Quick Responders</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <MousePointer className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{patterns.completionPatterns.normalResponders}</div>
            <div className="text-sm text-yellow-700">Normal Pace</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{patterns.completionPatterns.slowResponders}</div>
            <div className="text-sm text-purple-700">Thoughtful Responders</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(patterns.completionPatterns).map(([type, count]) => {
            const total = Object.values(patterns.completionPatterns).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const colors = {
              quickResponders: 'bg-green-500',
              normalResponders: 'bg-yellow-500',
              slowResponders: 'bg-purple-500'
            };
            
            return (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-gray-600">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${colors[type as keyof typeof colors]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Behavior Patterns */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Users className="w-6 h-6 text-purple-500" />
          <span>User Behavior Patterns</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{patterns.userBehaviorPatterns.thoughtfulResponders}</span>
            </div>
            <div className="text-sm text-blue-700 font-medium">Thoughtful Responders</div>
            <div className="text-xs text-blue-600 mt-1">Take time to provide detailed answers</div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{patterns.userBehaviorPatterns.speedRunners}</span>
            </div>
            <div className="text-sm text-yellow-700 font-medium">Speed Runners</div>
            <div className="text-xs text-yellow-600 mt-1">Complete surveys very quickly</div>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{patterns.userBehaviorPatterns.straightLiners}</span>
            </div>
            <div className="text-sm text-red-700 font-medium">Straight Liners</div>
            <div className="text-xs text-red-600 mt-1">Give similar answers repeatedly</div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{patterns.userBehaviorPatterns.abandonmentRate.toFixed(1)}%</span>
            </div>
            <div className="text-sm text-orange-700 font-medium">Abandonment Rate</div>
            <div className="text-xs text-orange-600 mt-1">Incomplete responses</div>
          </div>
        </div>
      </div>

      {/* Response Quality Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-green-500" />
          <span>Response Quality Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">Overall Quality Score</span>
                <div className={`text-2xl font-bold ${getQualityColor(patterns.responseQuality.averageScore)}`}>
                  {patterns.responseQuality.averageScore.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    patterns.responseQuality.averageScore >= 80 ? 'bg-green-500' :
                    patterns.responseQuality.averageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${patterns.responseQuality.averageScore}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">High Quality</span>
                </div>
                <span className="font-bold text-green-800">{patterns.responseQuality.highQuality}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Medium Quality</span>
                </div>
                <span className="font-bold text-yellow-800">{patterns.responseQuality.mediumQuality}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Low Quality</span>
                </div>
                <span className="font-bold text-red-800">{patterns.responseQuality.lowQuality}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Text Response Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Length</span>
                <span className="font-semibold">{patterns.responseLength.avg.toFixed(0)} chars</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shortest Response</span>
                <span className="font-semibold">{patterns.responseLength.min} chars</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Longest Response</span>
                <span className="font-semibold">{patterns.responseLength.max} chars</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <h5 className="font-medium text-gray-900">Response Length Distribution</h5>
              {Object.entries(patterns.responseLength.distribution).map(([type, count]) => {
                const total = Object.values(patterns.responseLength.distribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const colors = {
                  short: 'bg-red-400',
                  medium: 'bg-yellow-400',
                  long: 'bg-green-400'
                };
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600">{type} (
                        {type === 'short' ? '<50' : type === 'medium' ? '50-200' : '>200'} chars)
                      </span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${colors[type as keyof typeof colors]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Temporal Patterns */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-indigo-500" />
          <span>Temporal Response Patterns</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Response Times</h4>
            <div className="space-y-3">
              {patterns.temporalPatterns.peakResponseTimes.map((time, index) => (
                <div key={time} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-indigo-800">{time}</span>
                  </div>
                  <span className="text-indigo-600 font-semibold">
                    {patterns.temporalPatterns.hourlyDistribution[
                      Object.keys(patterns.temporalPatterns.hourlyDistribution).find(hour => {
                        const h = parseInt(hour);
                        const timeStr = h === 0 ? '12 AM' : h <= 12 ? `${h} AM` : `${h - 12} PM`;
                        return timeStr === time;
                      }) || '0'
                    ] || 0} responses
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Day of Week Distribution</h4>
            <div className="space-y-2">
              {Object.entries(patterns.temporalPatterns.dayOfWeekDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(patterns.temporalPatterns.dayOfWeekDistribution));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{day}</span>
                        <span className="font-medium">{count} responses</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Skip Rate Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <span>Question Skip Rate Analysis</span>
        </h3>
        
        <div className="space-y-4">
          {results.questions.map((question, index) => {
            const skipRate = patterns.questionSkipRate[question.question_id] || 0;
            const skipColor = skipRate > 20 ? 'text-red-600' : skipRate > 10 ? 'text-yellow-600' : 'text-green-600';
            const skipBgColor = skipRate > 20 ? 'bg-red-500' : skipRate > 10 ? 'bg-yellow-500' : 'bg-green-500';
            
            return (
              <div key={question.question_id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      Question {index + 1}: {question.question_text}
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {question.question_type}
                    </span>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${skipColor}`}>
                      {skipRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Skip Rate</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${skipBgColor}`}
                    style={{ width: `${skipRate}%` }}
                  ></div>
                </div>
                
                {skipRate > 20 && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    ⚠️ High skip rate detected - consider reviewing question clarity or placement
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResponsePatterns;

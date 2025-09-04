import axios from 'axios';

// Get API base URL from environment, fallback to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 🔥 Increased from 10000ms to 60000ms (60 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Request data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Interfaces
export interface Survey {
  survey_id: string;
  topic: string;
  audience: string;
  num_questions: number;
  created_at: string;
  questions_count: number;
  responses_count: number;
}

export interface CreateSurveyRequest {
  topic: string;
  audience: string;
  num_questions: number;
}

export interface SurveyResponse {
  response_id: string;
  survey_id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_ip?: string;
  responses: Record<string, any>;
  submitted_at: string;
  completion_time?: number;
}

export interface SurveyResults {
  survey: {
    survey_id: string;
    topic: string;
    audience: string;
    created_at: string;
    questions_count: number;
    responses_count: number;
  };
  questions: Array<{
    type: string;
    question: string;
    question_id: string;
    question_text: string;
    question_type: string;
    options?: string[];
  }>;
  responses: SurveyResponse[];
  analytics: {
    total_responses: number;
    completion_rate: number;
    average_completion_time: number;
    response_by_date: Record<string, number>;
  };
}

export interface MLInsights {
  responsePatterns: {
    mostCommonAnswers: Array<{ question: string; answer: string; frequency: number; confidence: number }>;
    leastCommonAnswers: Array<{ question: string; answer: string; frequency: number; confidence: number }>;
    correlations: Array<{ question1: string; question2: string; correlation: number; significance: number }>;
  };
  userBehavior: {
    completionTimeCategories: {
      fast: number;
      average: number;
      slow: number;
    };
    dropoffPoints: Array<{ questionIndex: number; dropoffRate: number; confidence: number }>;
    engagementScore: number;
    qualityMetrics: {
      responseLength: number;
      completeness: number;
      consistency: number;
    };
  };
  sentimentAnalysis: {
    overall: {
      positive: number;
      neutral: number;
      negative: number;
      compound: number;
      confidence: number;
    };
    byQuestion: Array<{ 
      questionId: string; 
      sentiment: any; 
      keywords: string[];
      emotions: Array<{ emotion: string; intensity: number }>;
    }>;
    trends: Array<{ date: string; sentiment: number }>;
  };
  clustering: {
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
  };
  predictions: {
    nextResponseTime: string;
    expectedCompletionRate: number;
    qualityScore: number;
    trendPredictions: Array<{ metric: string; predicted: number; confidence: number }>;
    recommendations: Array<{ type: string; suggestion: string; impact: string; priority: number }>;
  };
  anomalies: Array<{
    type: 'time' | 'response' | 'pattern' | 'quality';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedResponses: string[];
    confidence: number;
    suggestedAction: string;
  }>;
  modelMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    processingTime: number;
    dataQuality: number;
    algorithmUsed: string[];
  };
}

// API Functions - NO MORE MOCK DATA
export const getAllSurveys = async () => {
  const response = await api.get('/surveys');
  return response.data;
};

// Update the createSurvey function to match backend expectations
export const createSurvey = async (surveyData: CreateSurveyRequest) => {
  // Format the data to match what the backend expects
  const formattedData = {
    topic: surveyData.topic,
    audience: surveyData.audience,
    num_questions: surveyData.num_questions
  };
  
  console.log('Sending survey data:', formattedData); // Debug log
  
  const response = await api.post('/create_survey', formattedData);
  return response.data;
};

export const getSurvey = async (surveyId: string) => {
  const response = await api.get(`/survey/${surveyId}`);
  return { data: response.data };
};

export const updateSurvey = async (surveyId: string, surveyData: Partial<CreateSurveyRequest>) => {
  const response = await api.put(`/survey/${surveyId}`, surveyData);
  return response.data;
};

export const deleteSurvey = async (surveyId: string) => {
  const response = await api.delete(`/survey/${surveyId}`);
  return response.data;
};

export const getSurveyResults = async (surveyId: string): Promise<{ data: SurveyResults }> => {
  const response = await api.get(`/surveys/${surveyId}/results`);
  return { data: response.data };
};

export const getMLInsights = async (surveyId: string): Promise<{ data: MLInsights }> => {
  const response = await api.get(`/surveys/${surveyId}/ml-insights`);
  return { data: response.data };
};

export const submitSurveyResponse = async (surveyId: string, responseData: {
  user_name?: string;
  user_email?: string;
  responses: Record<string, any>;
  completion_time?: number;
}) => {
  // Format data to match backend expectations
  const formattedData = {
    survey_id: surveyId,
    user_details: {
      name: responseData.user_name || 'Anonymous',
      age: 25, // Default age - you might want to collect this
      contact: responseData.user_email || 'unknown',
      occupation: 'Not specified'
    },
    responses: Object.entries(responseData.responses).map(([question_id, answer]) => ({
      question_id,
      answer
    }))
  };

  const response = await api.post('/submit_response', formattedData);
  return response.data;
};

// Alias for backward compatibility
export const submitResponse = submitSurveyResponse;

export default api;
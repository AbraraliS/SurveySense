import axios from 'axios';

// Get API base URL from environment, fallback to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
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
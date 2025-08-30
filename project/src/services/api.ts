import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const createSurvey = (data: {
  topic: string;
  audience: string;
  num_questions: number;
}) => api.post('/create_survey', data);

export const getSurvey = (surveyId: string) => api.get(`/survey/${surveyId}`);

export const submitResponse = (data: {
  survey_id: string;
  responses: Array<{
    question_id: string;
    answer: string;
  }>;
}) => api.post('/submit_response', data);

// Fix: Use the correct endpoint that matches your backend
export const getSurveyAnalysis = (surveyId: string) => api.get(`/analysis/${surveyId}`);

// Remove the duplicate function
// export async function getSurveyAnalysis(surveyId: string) {
//   return fetch(`/api/surveys/${surveyId}/analysis`).then(res => res.json());
// }
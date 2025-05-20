import axios from 'axios';
// Import error handling utilities, commented out until used
// import { formatApiError, shouldRetryRequest } from './errorHandling';

// Create an axios instance with default settings
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // const originalRequest = error.config; // Commented out until needed
    
    // Handle specific error codes
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Error:', error.response.data);
      
      // Handle unauthorized errors (401)
      if (error.response.status === 401) {
        // Handle authentication errors
        console.log('Unauthorized request');
      }
      
      // Handle forbidden errors (403)
      if (error.response.status === 403) {
        console.log('Forbidden request');
      }
      
      // Handle not found errors (404)
      if (error.response.status === 404) {
        console.log('Resource not found');
      }
      
      // Handle server errors (5xx)
      if (error.response.status >= 500) {
        console.log('Server error, please try again later');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// File upload services
const fileService = {
  uploadFiles: async (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    try {
      const response = await api.post('/files/upload', formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Interview services
const interviewService = {
  startInterview: async (data) => {
    try {
      const response = await api.post('/interview/start', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  sendAnswer: async (sessionId, answer) => {
    try {
      const response = await api.post('/interview/answer', { sessionId, answer });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  endInterview: async (sessionId) => {
    try {
      const response = await api.post('/interview/end', { sessionId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getFeedback: async (sessionId) => {
    try {
      const response = await api.get(`/interview/feedback/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export { api, fileService, interviewService };

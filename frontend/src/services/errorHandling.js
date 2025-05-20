// Common error handling utilities for API requests

/**
 * Formats an error message based on the API error response
 * 
 * @param {Error} error - The error object from axios
 * @param {Object} options - Additional options for error handling
 * @param {string} options.defaultMessage - Default message if none can be derived from the error
 * @param {Object} options.statusMessages - Custom messages for specific status codes
 * @returns {string} A user-friendly error message
 */
export const formatApiError = (error, options = {}) => {
  const defaultMessage = options.defaultMessage || 'An error occurred. Please try again.';
  const statusMessages = options.statusMessages || {};

  // No response means network error
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  // Get status code specific message or use the message from the response
  const statusCode = error.response.status;
  if (statusMessages[statusCode]) {
    return statusMessages[statusCode];
  }

  // Common status code messages
  if (statusCode === 400) {
    return error.response.data?.message || 'Invalid request. Please check your input.';
  } else if (statusCode === 401) {
    return 'Authentication required. Please log in again.';
  } else if (statusCode === 403) {
    return 'You do not have permission to perform this action.';
  } else if (statusCode === 404) {
    return 'The requested resource was not found.';
  } else if (statusCode === 413) {
    return 'The file is too large. Please upload a smaller file.';
  } else if (statusCode === 415) {
    return 'Unsupported file type. Please check the allowed file formats.';
  } else if (statusCode === 429) {
    return 'Too many requests. Please try again later.';
  } else if (statusCode >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  // Use the message from the response or fallback to the default
  return error.response.data?.message || defaultMessage;
};

/**
 * Returns a boolean indicating if the request should be retried based on the error
 * 
 * @param {Error} error - The error object from axios
 * @param {number} retryCount - Current retry count
 * @param {number} maxRetries - Maximum number of retries
 * @returns {boolean} Whether the request should be retried
 */
export const shouldRetryRequest = (error, retryCount, maxRetries = 3) => {
  if (retryCount >= maxRetries) {
    return false;
  }

  // Retry on network errors or certain status codes
  if (!error.response) {
    return true;
  }

  const statusCode = error.response.status;
  // Retry on server errors (5xx) or certain service unavailable responses
  return statusCode >= 500 && statusCode !== 501;
};

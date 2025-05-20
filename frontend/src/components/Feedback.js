import React, { useEffect, useState } from 'react';
import { interviewService } from '../services/api';
import ReactMarkdown from 'react-markdown';

const Feedback = ({ sessionId, onReset }) => {
  const [feedback, setFeedback] = useState('');
  const [duration, setDuration] = useState(0);
  const [questions, setQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await interviewService.getFeedback(sessionId);
        setFeedback(response.feedback);
        setDuration(response.duration);
        setQuestions(response.questions);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        
        if (!error.response) {
          setError('Network error. Please check your connection and try again.');
        } else if (error.response.status === 404) {
          setError('Interview feedback not found. Please try again later.');
        } else if (error.response.status === 400) {
          // Feedback might not be ready yet, retry after a delay
          if (retryCount < 3) {
            setError('Preparing your feedback...');
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000); // retry after 2 seconds
            return;
          } else {
            setError('Feedback is taking longer than expected. Please try again later.');
          }
        } else {
          setError('Error loading feedback. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchFeedback();
    }
  }, [sessionId, retryCount]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Interview Feedback</h2>
      
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">{retryCount > 0 ? "Still generating your feedback..." : "Loading feedback..."}</p>
        </div>
      ) : error && !error.includes('Preparing') ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : error && error.includes('Preparing') ? (
        <div className="flex flex-col justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between mb-6 text-sm text-gray-500">
            <div>Interview duration: {formatDuration(duration)}</div>
            <div>Questions answered: {questions}</div>
          </div>
          
          <div className="prose max-w-none">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onReset}
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
            >
              Start New Interview
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300 transition-colors print:hidden"
            >
              Print Feedback
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Feedback;

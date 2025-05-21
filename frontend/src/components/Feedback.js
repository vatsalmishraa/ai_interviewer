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
    <div className="bg-white rounded-xl shadow-card p-8 max-w-3xl mx-auto border border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6 mb-6">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-900">Interview Feedback</h2>
        <div className="text-sm px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
          Session ID: {sessionId.substring(0, 8)}...
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative h-24 w-24">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-neutral-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-primary-600 animate-spin"></div>
          </div>
          <p className="mt-6 text-neutral-600 text-lg">{retryCount > 0 ? "Still generating your feedback..." : "Loading feedback..."}</p>
          <p className="text-neutral-500 max-w-md text-center mt-2">
            We're analyzing your interview responses and preparing detailed feedback. This may take a moment.
          </p>
        </div>
      ) : error && !error.includes('Preparing') ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : error && error.includes('Preparing') ? (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative h-24 w-24">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-neutral-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-primary-600 animate-spin"></div>
          </div>
          <p className="mt-6 text-neutral-600 text-lg">{error}</p>
          <p className="text-neutral-500 max-w-md text-center mt-2">
            Our AI is analyzing your interview performance. This comprehensive feedback will be worth the wait!
          </p>
        </div>
      ) : (
        <>
          <div className="bg-neutral-50 rounded-lg p-4 mb-8 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center justify-center bg-white p-4 rounded-md shadow-sm border border-neutral-200 h-full">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Interview Duration</div>
                  <div className="text-2xl font-semibold text-neutral-800">{formatDuration(duration)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center justify-center bg-white p-4 rounded-md shadow-sm border border-neutral-200 h-full">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Questions Answered</div>
                  <div className="text-2xl font-semibold text-neutral-800">{questions}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="prose prose-primary max-w-none bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-200">
            <button
              onClick={onReset}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-6 rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Start New Interview
              </div>
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white border border-neutral-300 text-neutral-800 py-3 px-6 rounded-lg hover:bg-neutral-50 transition-colors duration-200 font-medium print:hidden shadow-sm"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print Feedback
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Feedback;

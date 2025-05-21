import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary-700 to-primary-900 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
              <svg className="w-10 h-10 mr-3 text-white" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="8" width="28" height="24" rx="4" fill="currentColor" fillOpacity="0.9"/>
                <path d="M30 18L38 14V26L30 22V18Z" fill="currentColor" fillOpacity="0.9"/>
                <circle cx="11" cy="16" r="2" fill="white"/>
                <circle cx="19" cy="16" r="2" fill="white"/>
                <path d="M8 22C10 25 14 25 16 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 22C16 25 20 25 22 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              AI Interviewer
            </h1>
            <p className="text-primary-100 mt-1 text-sm md:text-base">
              Prepare for your next job interview with AI assistance
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-500 text-white">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              AI-Powered Interview Practice
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

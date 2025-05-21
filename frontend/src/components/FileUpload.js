import React, { useState } from 'react';
import { fileService, interviewService } from '../services/api';

const FileUpload = ({ files, setFiles, onInterviewStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState({ resume: false, jobDescription: false });

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles(prev => ({ ...prev, [name]: fileList[0] }));
  };

  const handleDrag = (e, field, active) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: active }));
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragActive(prev => ({ ...prev, [field]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.dataTransfer.files[0] }));
    }
  };

  const validateFiles = () => {
    if (!files.resume || !files.jobDescription) {
      setError('Please upload both resume and job description files');
      return false;
    }
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(files.resume.type) || !allowedTypes.includes(files.jobDescription.type)) {
      setError('Please upload PDF, DOC, DOCX, or TXT files only');
      return false;
    }
    
    if (files.resume.size > 5 * 1024 * 1024 || files.jobDescription.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploadProgress(0);
    
    if (!validateFiles()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', files.resume);
      formData.append('jobDescription', files.jobDescription);
      
      // Upload files with progress tracking
      const uploadResponse = await fileService.uploadFiles(formData);
      setUploadProgress(100);
      
      // Start interview with file paths
      const startResponse = await interviewService.startInterview({
        resumePath: uploadResponse.data.resume,
        jobDescriptionPath: uploadResponse.data.jobDescription
      });
      
      onInterviewStart(startResponse);
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Handle specific errors
      if (error.response?.status === 413) {
        setError('Files too large. Please upload files smaller than 5MB each.');
      } else if (error.response?.status === 415) {
        setError('Invalid file format. Please upload PDF, DOC, DOCX, or TXT files only.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Please check your files and try again.');
      } else if (!error.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.response?.data?.message || 'Error uploading files. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-neutral-800">Upload Your Documents</h2>
      <p className="text-neutral-600 mb-6">Let's tailor the interview to your profile and job requirements</p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 animate-pulse-slow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Resume (PDF, DOC, DOCX, TXT)</label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              dragActive.resume 
                ? 'border-primary-500 bg-primary-50' 
                : files.resume 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-neutral-300 hover:border-primary-400'
            }`}
            onDragEnter={(e) => handleDrag(e, 'resume', true)}
            onDragLeave={(e) => handleDrag(e, 'resume', false)}
            onDragOver={(e) => handleDrag(e, 'resume', true)}
            onDrop={(e) => handleDrop(e, 'resume')}
          >
            <div className="text-center">
              {files.resume ? (
                <div className="flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-2 text-sm font-medium text-neutral-700">{files.resume.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-neutral-500">
                    Drag and drop your resume, or <span className="text-primary-600">browse</span>
                  </p>
                </div>
              )}
              <input
                type="file"
                name="resume"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                disabled={isLoading}
                id="resume-input"
              />
              <button 
                type="button"
                onClick={() => document.getElementById('resume-input').click()}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                Select File
              </button>
            </div>
          </div>
          {files.resume && (
            <p className="mt-2 text-xs text-neutral-500">Size: {(files.resume.size / (1024 * 1024)).toFixed(2)} MB</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Job Description (PDF, DOC, DOCX, TXT)</label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              dragActive.jobDescription 
                ? 'border-primary-500 bg-primary-50' 
                : files.jobDescription 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-neutral-300 hover:border-primary-400'
            }`}
            onDragEnter={(e) => handleDrag(e, 'jobDescription', true)}
            onDragLeave={(e) => handleDrag(e, 'jobDescription', false)}
            onDragOver={(e) => handleDrag(e, 'jobDescription', true)}
            onDrop={(e) => handleDrop(e, 'jobDescription')}
          >
            <div className="text-center">
              {files.jobDescription ? (
                <div className="flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-2 text-sm font-medium text-neutral-700">{files.jobDescription.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-neutral-500">
                    Drag and drop job description, or <span className="text-primary-600">browse</span>
                  </p>
                </div>
              )}
              <input
                type="file"
                name="jobDescription"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                disabled={isLoading}
                id="jd-input"
              />
              <button 
                type="button"
                onClick={() => document.getElementById('jd-input').click()}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                Select File
              </button>
            </div>
          </div>
          {files.jobDescription && (
            <p className="mt-2 text-xs text-neutral-500">Size: {(files.jobDescription.size / (1024 * 1024)).toFixed(2)} MB</p>
          )}
        </div>
        
        {isLoading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-600 text-center">
              {uploadProgress < 100 ? 'Uploading files...' : 'Starting interview...'}
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-neutral-400 disabled:to-neutral-500"
          disabled={isLoading || (!files.resume || !files.jobDescription)}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Preparing Interview...
            </>
          ) : (
            <>
              Start Interview
              <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;

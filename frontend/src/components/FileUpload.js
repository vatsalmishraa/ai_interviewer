import React, { useState } from 'react';
import { fileService, interviewService } from '../services/api';

const FileUpload = ({ files, setFiles, onInterviewStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles(prev => ({ ...prev, [name]: fileList[0] }));
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
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Upload Your Documents</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Resume (PDF, DOC, DOCX, TXT)</label>
          <input
            type="file"
            name="resume"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-2 rounded"
            accept=".pdf,.doc,.docx,.txt"
            disabled={isLoading}
          />
          {files.resume && (
            <p className="mt-2 text-sm text-gray-600">Selected: {files.resume.name}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Job Description (PDF, DOC, DOCX, TXT)</label>
          <input
            type="file"
            name="jobDescription"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-2 rounded"
            accept=".pdf,.doc,.docx,.txt"
            disabled={isLoading}
          />
          {files.jobDescription && (
            <p className="mt-2 text-sm text-gray-600">Selected: {files.jobDescription.name}</p>
          )}
        </div>
        
        {isLoading && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {uploadProgress < 100 ? 'Uploading files...' : 'Starting interview...'}
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors w-full disabled:bg-blue-300"
          disabled={isLoading || (!files.resume || !files.jobDescription)}
        >
          {isLoading ? 'Preparing Interview...' : 'Start Interview'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;

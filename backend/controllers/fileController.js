const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * @desc    Validate uploaded files
 * @route   Middleware
 * @access  Public
 */
const validateFile = (req, res, next) => {
  if (!req.files || !req.files.resume || !req.files.jobDescription) {
    return res.status(400).json({
      message: 'Please upload both resume and job description files'
    });
  }
  
  next();
};

/**
 * @desc    Upload resume and job description
 * @route   POST /api/files/upload
 * @access  Public
 */
const uploadFile = asyncHandler(async (req, res) => {
  const resumeFile = req.files.resume[0];
  const jobDescriptionFile = req.files.jobDescription[0];
  
  // Store file paths in session or return them - use absolute paths
  // Convert relative paths to absolute paths
  const absoluteResumePath = path.resolve(resumeFile.path);
  const absoluteJobDescPath = path.resolve(jobDescriptionFile.path);
  
  // Verify files exist
  if (!fs.existsSync(absoluteResumePath)) {
    res.status(500);
    throw new Error(`Resume file does not exist at path: ${absoluteResumePath}`);
  }
  
  if (!fs.existsSync(absoluteJobDescPath)) {
    res.status(500);
    throw new Error(`Job description file does not exist at path: ${absoluteJobDescPath}`);
  }
  
  console.log('File paths verified:', { 
    resume: absoluteResumePath, 
    jobDescription: absoluteJobDescPath 
  });
  
  res.status(200).json({
    message: 'Files uploaded successfully',
    data: {
      resume: absoluteResumePath,
      jobDescription: absoluteJobDescPath
    }
  });
});

module.exports = {
  uploadFile,
  validateFile
};

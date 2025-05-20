const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs/promises');
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const InterviewSession = require('../models/InterviewSession');

// Load environment variables for this module
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// For debugging only - safe logging
console.log('GEMINI_API_KEY status:', process.env.GEMINI_API_KEY ? 'API Key is set' : 'API Key is undefined');
// Store active interview sessions in memory for quick access
const interviewSessions = new Map();

/**
 * @desc    Start a new interview session
 * @route   POST /api/interview/start
 * @access  Public
 */
const startInterview = asyncHandler(async (req, res) => {
  const { resumePath, jobDescriptionPath } = req.body;
  
  if (!resumePath || !jobDescriptionPath) {
    res.status(400);
    throw new Error('Resume and job description paths are required');
  }
  
  try {
    // Read the resume and job description files
    let resumeContent, jobDescriptionContent;
    
    // Helper function to read file content based on file type
    const readFileContent = async (filePath) => {
      console.log(`Reading file: ${filePath}`);
      
      // Check if file exists
      if (!fsSync.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      // Determine file type by extension
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.pdf') {
        // Handle PDF file
        console.log('Processing PDF file');
        const dataBuffer = await fs.readFile(filePath);
        
        try {
          const pdfData = await pdfParse(dataBuffer);
          const text = pdfData.text;
          
          // Validate PDF content
          if (!text || text.trim().length < 50) {
            throw new Error(`The PDF file appears to be empty or contains too little text (${text ? text.length : 0} characters). Please check the file.`);
          }
          
          console.log(`Successfully extracted ${text.length} characters from PDF`);
          return text;
        } catch (pdfError) {
          console.error('Error parsing PDF:', pdfError);
          throw new Error(`Failed to parse PDF file: ${pdfError.message}`);
        }
      } else if (ext === '.doc' || ext === '.docx') {
        // For simplicity, we're treating Word docs as unsupported in this version
        throw new Error(`Word document format (${ext}) is not supported yet. Please convert to PDF or plain text.`);
      } else {
        // Handle text files
        console.log('Processing text file');
        const text = await fs.readFile(filePath, 'utf-8');
        
        // Validate text content
        if (!text || text.trim().length < 50) {
          throw new Error(`The text file appears to be empty or contains too little text (${text ? text.length : 0} characters). Please check the file.`);
        }
        
        return text;
      }
    };
    
    try {
      console.log(`Attempting to read resume from ${resumePath}`);
      resumeContent = await readFileContent(resumePath);
      console.log('Resume content length:', resumeContent.length);
    } catch (fileError) {
      console.error(`Error reading resume file at path ${resumePath}:`, fileError);
      res.status(400);
      throw new Error(`Unable to read resume file: ${fileError.message}. Please check that the file exists and is accessible.`);
    }
    
    try {
      console.log(`Attempting to read job description from ${jobDescriptionPath}`);
      jobDescriptionContent = await readFileContent(jobDescriptionPath);
      console.log('Job description content length:', jobDescriptionContent.length);
    } catch (fileError) {
      console.error(`Error reading job description file at path ${jobDescriptionPath}:`, fileError);
      res.status(400);
      throw new Error(`Unable to read job description file: ${fileError.message}. Please check that the file exists and is accessible.`);
    }
    
    // Create a new session ID
    const sessionId = uuidv4();
    
    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create initial prompt
    const prompt = `
      You are an AI interviewer conducting a job interview. 
      
      Here is information about the candidate's resume:
      ${resumeContent}
      
      Here is the job description the candidate is applying for:
      ${jobDescriptionContent}
      
      Based on the resume and job description, please introduce yourself as the interviewer and ask your first question.
      Keep the introduction brief and professional.
    `;
    
    // Generate the first response from the AI
    let firstMessage;
    try {
      console.log('Sending prompt to Gemini API...');
      // Format the prompt properly for the Gemini API
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const response = await result.response;
      firstMessage = response.text();
      console.log('Successfully received response from Gemini API');
    } catch (apiError) {
      console.error('Error from Gemini API:', apiError);
      res.status(500);
      throw new Error(`Error generating interview content: ${apiError.message}`);
    }
    
    // Prepare session data
    const sessionData = {
      sessionId,
      resumeContent,
      jobDescriptionContent,
      history: [
        { role: "system", content: prompt },
        { role: "model", content: firstMessage }
      ],
      startTime: new Date(),
      questions: 1,
    };
    
    // Store session in MongoDB
    await InterviewSession.create(sessionData);
    
    // Also store in memory for quick access
    interviewSessions.set(sessionId, {
      ...sessionData,
      // Store formatted history for API calls (not stored in MongoDB)
      formattedHistory: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "model", parts: [{ text: firstMessage }] }
      ],
      model,
    });
    
    res.status(200).json({
      sessionId,
      message: firstMessage
    });
    
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500);
    throw new Error(`Error starting interview session: ${error.message}`);
  }
});

/**
 * @desc    Process candidate answer and generate next question
 * @route   POST /api/interview/answer
 * @access  Public
 */
const processAnswer = asyncHandler(async (req, res) => {
  const { sessionId, answer } = req.body;
  
  if (!sessionId || !answer) {
    res.status(400);
    throw new Error('Session ID and answer are required');
  }
  
  // Get the session from memory
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    res.status(404);
    throw new Error('Interview session not found');
  }
  
  try {
    // Add user's answer to history
    session.history.push({ role: "user", content: answer });
    session.formattedHistory.push({ role: "user", parts: [{ text: answer }] });
    
    // Determine if we should end the interview
    let shouldEnd = session.questions >= 3; // End after 3 questions
    let interviewerResponse;
    
    if (shouldEnd) {
      // Generate concluding message
      const endPrompt = `
        Based on our conversation so far, please conclude the interview. 
        Thank the candidate for their time and let them know that they will receive feedback shortly.
      `;
      
      try {
        // Create a new prompt for concluding the interview
        const endMessage = { role: "user", parts: [{ text: endPrompt }] };
        
        // Generate the content using the correctly formatted history
        const result = await session.model.generateContent({
          contents: [...session.formattedHistory, endMessage]
        });
        
        interviewerResponse = result.response.text();
      } catch (apiError) {
        console.error('Error generating concluding message:', apiError);
        throw new Error(`Error generating interview conclusion: ${apiError.message}`);
      }
    } else {
      // Generate next question
      const nextPrompt = `
        Based on the candidate's previous answer, please ask the next relevant interview question. 
        Make your questions increasingly challenging but relevant to the job description.
      `;
      
      try {
        // Create a new prompt for the next question
        const nextMessage = { role: "user", parts: [{ text: nextPrompt }] };
        
        // Generate the content using the correctly formatted history
        const result = await session.model.generateContent({
          contents: [...session.formattedHistory, nextMessage]
        });
        
        interviewerResponse = result.response.text();
      } catch (apiError) {
        console.error('Error generating next question:', apiError);
        throw new Error(`Error generating next interview question: ${apiError.message}`);
      }
      
      // Add AI response to history
      session.history.push({ role: "model", content: interviewerResponse });
      session.formattedHistory.push({ role: "model", parts: [{ text: interviewerResponse }] });
      session.questions++;
    }
    
    // Update the session in memory
    interviewSessions.set(sessionId, session);
    
    // Update the session in MongoDB
    await InterviewSession.findOneAndUpdate(
      { sessionId },
      { 
        history: session.history,
        questions: session.questions
      }
    );
    
    res.status(200).json({
      message: interviewerResponse,
      shouldEnd: shouldEnd
    });
    
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500);
    throw new Error('Error processing candidate answer');
  }
});

/**
 * @desc    End interview and generate feedback
 * @route   POST /api/interview/end
 * @access  Public
 */
const endInterview = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    res.status(400);
    throw new Error('Session ID is required');
  }
  
  // Get the session
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    res.status(404);
    throw new Error('Interview session not found');
  }
  
  try {
    // Generate feedback
    const feedbackPrompt = `
      Based on the entire interview conversation, please provide comprehensive feedback for the candidate.
      Include:
      1. Overall impression
      2. Strengths demonstrated
      3. Areas for improvement
      4. Technical skills assessment
      5. Communication skills assessment
      6. Fit for the role based on the job description
      
      Format your response in markdown.
    `;
    
    let feedback;
    try {
      // Create a new prompt for generating feedback
      const feedbackMessage = { role: "user", parts: [{ text: feedbackPrompt }] };
      
      // Generate the content using the correctly formatted history
      const result = await session.model.generateContent({
        contents: [...session.formattedHistory, feedbackMessage]
      });
      
      feedback = result.response.text();
    } catch (apiError) {
      console.error('Error generating interview feedback:', apiError);
      throw new Error(`Error generating interview feedback: ${apiError.message}`);
    }
    
    // Update session in memory
    session.feedback = feedback;
    session.endTime = new Date();
    session.completed = true;
    interviewSessions.set(sessionId, session);
    
    // Update session in MongoDB
    await InterviewSession.findOneAndUpdate(
      { sessionId },
      { 
        feedback,
        endTime: new Date(),
        completed: true
      }
    );
    
    res.status(200).json({
      message: 'Interview completed successfully',
      sessionId
    });
    
  } catch (error) {
    console.error('Error ending interview:', error);
    res.status(500);
    throw new Error('Error generating interview feedback');
  }
});

/**
 * @desc    Get interview feedback
 * @route   GET /api/interview/feedback/:sessionId
 * @access  Public
 */
const getInterviewFeedback = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Try to get from memory first for better performance
  let session = interviewSessions.get(sessionId);
  
  // If not in memory, get from database
  if (!session) {
    const dbSession = await InterviewSession.findOne({ sessionId });
    if (!dbSession) {
      res.status(404);
      throw new Error('Interview session not found');
    }
    session = dbSession;
  }
  
  if (!session.feedback) {
    res.status(400);
    throw new Error('Feedback not available. Please end the interview first');
  }
  
  res.status(200).json({
    feedback: session.feedback,
    duration: Math.floor((session.endTime - session.startTime) / 1000), // Duration in seconds
    questions: session.questions
  });
});

module.exports = {
  startInterview,
  processAnswer,
  endInterview,
  getInterviewFeedback
};

const express = require('express');
const router = express.Router();
const { 
  startInterview, 
  processAnswer, 
  endInterview,
  getInterviewFeedback
} = require('../controllers/interviewController');

// Routes
router.post('/start', startInterview);
router.post('/answer', processAnswer);
router.post('/end', endInterview);
router.get('/feedback/:sessionId', getInterviewFeedback);

module.exports = router;

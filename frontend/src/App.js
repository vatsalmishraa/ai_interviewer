import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import InterviewChat from './components/InterviewChat';
import Feedback from './components/Feedback';

function App() {
  const [step, setStep] = useState('upload'); // upload, interview, feedback
  const [sessionId, setSessionId] = useState(null);
  const [files, setFiles] = useState({ resume: null, jobDescription: null });
  
  const [firstMessage, setFirstMessage] = useState('');
  
  const startInterview = (sessionData) => {
    setSessionId(sessionData.sessionId);
    setFirstMessage(sessionData.message);
    setStep('interview');
  };
  
  const endInterview = () => {
    setStep('feedback');
  };
  
  const resetInterview = () => {
    setStep('upload');
    setSessionId(null);
    setFiles({ resume: null, jobDescription: null });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {step === 'upload' && (
          <FileUpload 
            files={files} 
            setFiles={setFiles} 
            onInterviewStart={startInterview} 
          />
        )}
        
        {step === 'interview' && (
          <InterviewChat 
            sessionId={sessionId} 
            onInterviewEnd={endInterview}
            firstMessage={firstMessage}
          />
        )}
        
        {step === 'feedback' && (
          <Feedback 
            sessionId={sessionId} 
            onReset={resetInterview} 
          />
        )}
      </div>
    </div>
  );
}

export default App;

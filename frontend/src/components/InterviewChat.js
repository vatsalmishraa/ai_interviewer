import React, { useState, useEffect, useRef } from 'react';
import { interviewService } from '../services/api';

const InterviewChat = ({ sessionId, onInterviewEnd, firstMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Initialize speech recognition
  const initSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        setInputValue(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Error with speech recognition. Please try again or type your answer.');
        setIsListening(false);
      };
      
      return true;
    } else {
      setError('Speech recognition not supported in your browser');
      return false;
    }
  };
  
  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      const isAvailable = initSpeechRecognition();
      if (!isAvailable) return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputValue('');
      recognitionRef.current.start();
    }
    
    setIsListening(!isListening);
  };
  
  // Speak the interview question
  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.7;
        
        // Load voices properly - this is where the problem likely is
        let voices = window.speechSynthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them to load
        if (voices.length === 0) {
          // Set up a one-time event listener for when voices are ready
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            setUpVoiceAndSpeak();
          };
        } else {
          setUpVoiceAndSpeak();
        }
        
        function setUpVoiceAndSpeak() {
          // First try to find the Eddy voice specifically
          const eddyVoice = voices.find(voice => 
            voice.name.includes('Eddy') && voice.lang === 'en-US'
          );
          
          // If Eddy voice not found, fall back to other English voices
          const preferredVoices = voices.filter(voice => 
            voice.lang.startsWith('en-') && 
            (voice.name.includes('Google') || voice.name.includes('Natural') || voice.localService === false)
          );
          
          const englishVoice = eddyVoice || (preferredVoices.length > 0 
            ? preferredVoices[0] 
            : voices.find(voice => voice.lang.startsWith('en-')));
          
          if (englishVoice) {
            console.log('Using voice:', englishVoice.name);
            utterance.voice = englishVoice;
          } else {
            console.log('No English voice found, using default');
          }
          
          // Set up callbacks
          utterance.onstart = () => {
            console.log('Speech started');
            setIsSpeaking(true);
          };
          
          utterance.onend = () => {
            console.log('Speech ended');
            setIsSpeaking(false);
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            setError('Error with text-to-speech. Please read the message instead.');
          };
          
          speechSynthesisRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('Text-to-speech setup error:', error);
        setError('Cannot initialize text-to-speech. Please read the message instead.');
      }
    } else {
      setError('Text-to-speech is not supported in your browser.');
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Initialize speech synthesis voices
  useEffect(() => {
    // Pre-load the voices as soon as possible
    if ('speechSynthesis' in window) {
      // Get voices
      const voices = window.speechSynthesis.getVoices();
      
      // If voices array is empty, set up an event listener for when voices become available
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
        };
      } else {
        console.log('Voices available on init:', voices.length);
      }
    }
  }, []);
  
  // Set initial message on component mount
  useEffect(() => {
    if (sessionId && firstMessage) {
      setMessages([{ type: 'ai', content: firstMessage }]);
      // Speak the first message - with a slight delay to ensure browser is ready
      setTimeout(() => {
        speakMessage(firstMessage);
      }, 500);
    }
    
    return () => {
      // Cancel any ongoing speech when component unmounts
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      
      // Stop speech recognition when component unmounts
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sessionId, firstMessage]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Send candidate answer
  const sendAnswer = async () => {
    if (!inputValue.trim()) return;
    
    if (isListening) {
      toggleListening();
    }
    
    // If we're currently speaking, stop
    if (isSpeaking) {
      try {
        window.speechSynthesis.cancel();
        console.log('Speech canceled');
      } catch (error) {
        console.error('Error canceling speech:', error);
      }
      setIsSpeaking(false);
    }
    
    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      const response = await interviewService.sendAnswer(sessionId, userMessage);
      
      const aiMessage = response.message;
      setMessages(prev => [...prev, { type: 'ai', content: aiMessage }]);
      
      // Speak the AI response
      speakMessage(aiMessage);
      
      // Check if interview should end
      if (response.shouldEnd) {
        // End the interview
        await interviewService.endInterview(sessionId);
        
        setTimeout(() => {
          onInterviewEnd();
        }, 3000); // Give user a moment to read the final message
      }
      
    } catch (error) {
      console.error('Error processing answer:', error);
      
      if (!error.response) {
        setError('Network error. Please check your connection and try again.');
      } else if (error.response.status === 404) {
        setError('Interview session not found. Please start a new interview.');
      } else {
        setError(error.response?.data?.message || 'Error sending your answer. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendAnswer();
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };
  
  // Debug function for text-to-speech
  const testTextToSpeech = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      // Log information about each voice
      voices.forEach((voice, index) => {
        console.log(`Voice ${index}: ${voice.name} (${voice.lang}) - Default: ${voice.default}, Local: ${voice.localService}`);
      });
      
      // Test speech with a simple message
      const testMessage = "This is a test of the speech synthesis system.";
      console.log('Testing speech with message:', testMessage);
      speakMessage(testMessage);
      
      return voices.length > 0;
    } catch (error) {
      console.error('Speech synthesis test error:', error);
      return false;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md max-w-3xl mx-auto flex flex-col h-[600px]">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Interview Session</h2>
          <p className="text-sm text-gray-500">Respond to the interviewer's questions</p>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3 flex space-x-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-600'}`}
            title={isListening ? 'Stop recording' : 'Start recording'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 border border-gray-300 rounded-lg p-2 resize-none"
            rows={2}
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white rounded-lg p-2 disabled:bg-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewChat;

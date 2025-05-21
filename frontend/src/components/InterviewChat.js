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
  const speechFlag = useRef({}); // Add this ref to track which messages have been spoken

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
  const speakMessage = (text, messageId) => {
    if ('speechSynthesis' in window) {
      try {
        // Check if this specific message has already been spoken
        if (speechFlag.current[messageId]) {
          console.log('Message already spoken, skipping:', messageId);
          return;
        }
        
        // Mark this message as being spoken
        speechFlag.current[messageId] = true;
        
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.3;
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
            console.log('Speech started for message:', messageId);
            setIsSpeaking(true);
          };
          
          utterance.onend = () => {
            console.log('Speech ended for message:', messageId);
            setIsSpeaking(false);
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            
            // Don't show error message for interrupted speech as this is expected behavior
            // when switching between utterances or canceling speech
            if (event.error === 'interrupted') {
              console.log('Speech was interrupted - this is normal when starting new speech or canceling');
              setIsSpeaking(false);
            } else {
              setIsSpeaking(false);
              setError('Error with text-to-speech. Please read the message instead.');
            }
          };
          
          speechSynthesisRef.current = utterance;
          
          // Ensure any previous speech is properly canceled before starting new speech
          window.speechSynthesis.cancel();
          
          // Small delay before starting new speech to prevent potential race conditions
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 50);
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
        speakMessage(firstMessage, 'first-message');
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
      speakMessage(aiMessage, `msg-${messages.length}`);
      
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
  
  // Additional UI helper functions
  const renderTypingIndicator = () => (
    <div className="flex space-x-2 p-3 bg-neutral-100 rounded-lg w-16 justify-center">
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-card max-w-3xl mx-auto flex flex-col h-[600px] border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-gradient-to-r from-primary-700 to-primary-900 text-white">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
            Interview Session
          </h2>
          <p className="text-sm text-primary-100">Respond to the interviewer's questions</p>
        </div>
        
        <div className="flex items-center">
          {isSpeaking && (
            <div className="flex items-center px-2 py-1 bg-primary-600 rounded-full mr-2">
              <div className="relative flex items-center justify-center">
                <div className="w-1.5 h-4 bg-white rounded-full animate-pulse-slow mx-px"></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-pulse-slow mx-px"></div>
                <div className="w-1.5 h-3 bg-white rounded-full animate-pulse-slow mx-px"></div>
              </div>
              <span className="ml-1 text-xs">Speaking</span>
            </div>
          )}
          
          <button 
            type="button"
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-500 transition"
            onClick={() => {
              if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
            }}
            title="Stop speaking"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${index === messages.length - 1 ? 'animate-fadeIn' : ''}`}
          >
            <div className={msg.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            {renderTypingIndicator()}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm flex items-center">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t border-neutral-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-full flex-shrink-0 transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-neutral-100 text-primary-700 hover:bg-neutral-200'
            }`}
            title={isListening ? 'Stop recording' : 'Start recording'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <div className="relative flex-1">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="w-full border border-neutral-300 rounded-lg p-3 pr-12 resize-none focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 transition-all duration-200"
              rows={2}
              disabled={isLoading}
            />
            {isListening && (
              <div className="absolute bottom-3 right-3 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                Recording...
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-primary-600 text-white rounded-full p-3 disabled:bg-neutral-300 disabled:text-neutral-500 transition-all duration-200 hover:bg-primary-700 transform hover:scale-105 active:scale-95 flex-shrink-0"
            title="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewChat;

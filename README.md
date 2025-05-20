# AI Interviewer

An intelligent interview preparation platform that conducts realistic job interviews using Google Gemini 2.5 Flash, providing personalized questions based on your resume and the job description.

## Features

- **Resume & Job Description Analysis**: Upload your resume and job description to get tailored interview questions
- **Interactive Chat Interface**: Natural conversation flow between AI interviewer and candidate
- **Speech Capabilities**: Text-to-speech for interview questions and speech-to-text for answering
- **Adaptive Questioning**: Questions evolve based on your previous answers
- **Automatic Interview Management**: AI determines when to conclude the interview
- **Comprehensive Feedback**: Detailed assessment provided at the end of the interview

## Tech Stack

- **Frontend**: React.js, TailwindCSS
- **Backend**: Node.js, Express
- **AI**: Google Gemini 2.5 Flash
- **Speech Services**: Web Speech API
- **File Handling**: Multer
- **Environment**: dotenv

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai_interviewer.git
   cd ai_interviewer
   ```

2. Install dependencies
   ```bash
   # Install all dependencies (backend & frontend)
   npm run install-all
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Application

1. Start both backend and frontend in development mode
   ```bash
   npm run dev
   ```

2. For separate processes:
   ```bash
   # Start backend only
   npm run server
   
   # Start frontend only
   npm run client
   ```

3. Access the application at `http://localhost:3000`

## Usage

1. **Upload Documents**: 
   - Submit your resume (PDF, DOCX, TXT) and the job description
   
2. **Begin Interview**:
   - The AI will introduce itself and start asking questions

3. **During Interview**:
   - Use the microphone button to speak your answers or type them
   - The AI will ask relevant follow-up questions based on your responses
   
4. **Conclude Interview**:
   - The AI will automatically determine when to end the interview
   - A summary with feedback will be provided at the end

## Project Structure

```
ai_interviewer/
├── frontend/               # React frontend
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/     # UI components
│       └── App.js          # Main application component
├── backend/                # Node.js backend
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── uploads/            # Storage for uploaded files
│   └── server.js           # Express server setup
├── .env                    # Environment variables
├── package.json            # Project metadata and dependencies
└── README.md               # Project documentation

# AI Interviewer

An intelligent interview preparation platform using Google Gemini 1.5 Flash.

## Demo

Check out the live demo:
- Frontend: [https://gemini-interviewer.vercel.app/](https://gemini-interviewer.vercel.app/)
- Backend API: [https://ai-interviewer-cxey.onrender.com](https://ai-interviewer-cxey.onrender.com)

## Setup Instructions

### Prerequisites
- Node.js
- MongoDB
- Google Gemini API key

### Backend Setup
1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:
```
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
```

### Frontend Setup
1. Create a `.env` file in the `frontend` directory with the following variables:
```
REACT_APP_API_URL=http://localhost:5001/api
```

### Installation
```bash
# Install all dependencies (backend and frontend)
npm run install-all

# Run both backend and frontend in development mode
npm run dev
```

## Features
- AI-powered mock interviews
- Resume parsing
- Voice interaction with speech recognition and text-to-speech
- Interview feedback and analysis

## Technologies Used
- React.js
- Node.js
- Express
- MongoDB
- Google Gemini AI

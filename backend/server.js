const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const fileRoutes = require('./routes/fileRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables - using the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('SERVER - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'API Key is set' : 'API Key is undefined');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/interview', interviewRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

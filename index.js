const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import in-memory database for demo
const db = require('./services/database');

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const tenantsRoutes = require('./routes/tenants');
const usersRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration for Vercel deployment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, /\.vercel\.app$/] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize in-memory database for demo
console.log('🚀 Starting NotesSpace - Multi-Tenant SaaS Application');
console.log('💾 Using in-memory database for demo purposes');

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', authenticateToken, notesRoutes);
app.use('/api/tenants', authenticateToken, tenantsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message
  });
});

// Root welcome route for base path
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', name: 'NotesSpace API', version: '1.0.0' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// On Vercel, export the app for the serverless function runtime.
// Only start a listener when running locally (not on Vercel).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;

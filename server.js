require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initializeDatabase } = require('./src/database/init');
const authRoutes = require('./src/routes/auth');
const notesRoutes = require('./src/routes/notes');
const tenantsRoutes = require('./src/routes/tenants');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notes', authenticateToken, notesRoutes);
app.use('/api/v1/tenants', authenticateToken, tenantsRoutes);

// Create public directory if it doesn't exist
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Create a basic index.html if it doesn't exist
const indexPath = path.join(publicPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Notes App</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <h1>Notes App</h1>
        <p>The application is running successfully.</p>
      </body>
    </html>
  `);
}

// Serve static files
app.use(express.static(publicPath));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist'
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

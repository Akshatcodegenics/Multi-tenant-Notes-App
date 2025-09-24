require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initializeDatabase } = require('./src/database/init');
const authRoutes = require('./src/routes/auth');
const notesRoutes = require('./src/routes/notes');
const tenantsRoutes = require('./src/routes/tenants');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
const publicPath = path.join(__dirname, 'public');
const indexPath = path.join(publicPath, 'index.html');

// Ensure the public directory exists
if (!require('fs').existsSync(publicPath)) {
  console.error('Public directory not found. Creating directory...');
  require('fs').mkdirSync(publicPath, { recursive: true });
}

// Serve static files with caching
app.use(express.static(publicPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/auth', authRoutes);
app.use('/notes', authenticateToken, notesRoutes);
app.use('/tenants', authenticateToken, tenantsRoutes);

// API 404 handler (for API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  // Check if index.html exists
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Application not built. Please run npm build first.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Frontend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

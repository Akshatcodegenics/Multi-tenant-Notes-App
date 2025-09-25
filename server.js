require('dotenv').config();require('dotenv').config();

const express = require('express');const express = require('express');

const cors = require('cors');const cors = require('cors');

const helmet = require('helmet');const helmet = require('helmet');

const rateLimit = require('express-rate-limit');const rateLimit = require('express-rate-limit');

const path = require('path');const path = require('path');

const fs = require('fs');const fs = require('fs');



const { initializeDatabase } = require('./src/database/init');const { initializeDatabase } = require('./src/database/init');

const authRoutes = require('./src/routes/auth');const authRoutes = require('./src/routes/auth');

const notesRoutes = require('./src/routes/notes');const notesRoutes = require('./src/routes/notes');

const tenantsRoutes = require('./src/routes/tenants');const tenantsRoutes = require('./src/routes/tenants');

const { authenticateToken } = require('./src/middleware/auth');const { authenticateToken } = require('./src/middleware/auth');



const app = express();const app = express();

const PORT = process.env.PORT || 3000;const PORT = process.env.PORT || 3000;



// Security middleware// Security middleware

app.use(helmet({app.use(helmet());

  contentSecurityPolicy: false // Disabled for development, enable in production

}));// Rate limiting

const limiter = rateLimit({

// Rate limiting  windowMs: 15 * 60 * 1000,

const limiter = rateLimit({  max: 100

  windowMs: 15 * 60 * 1000,});

  max: 100app.use(limiter);

});

app.use(limiter);// CORS configuration

app.use(cors({

// CORS configuration  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],

app.use(cors({  credentials: true,

  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  credentials: true,  allowedHeaders: ['Content-Type', 'Authorization']

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],}));

  allowedHeaders: ['Content-Type', 'Authorization']

}));// Body parsing middleware

app.use(express.json({ limit: '10mb' }));

// Body parsing middlewareapp.use(express.urlencoded({ extended: true }));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));// Health check endpoint

app.get('/health', (req, res) => {

// Health check endpoint  res.json({ status: 'ok' });

app.get('/health', (req, res) => {});

  res.json({ status: 'ok' });

});// API routes with versioning

app.use('/api/v1/auth', authRoutes);

// API routes with versioningapp.use('/api/v1/notes', authenticateToken, notesRoutes);

app.use('/api/v1/auth', authRoutes);app.use('/api/v1/tenants', authenticateToken, tenantsRoutes);

app.use('/api/v1/notes', authenticateToken, notesRoutes);

app.use('/api/v1/tenants', authenticateToken, tenantsRoutes);// Create public directory if it doesn't exist

const publicPath = path.join(__dirname, 'public');

// Serve static filesif (!fs.existsSync(publicPath)) {

const publicPath = path.join(__dirname, 'public');  fs.mkdirSync(publicPath, { recursive: true });

}

// Create public directory if it doesn't exist

if (!fs.existsSync(publicPath)) {// Create a basic index.html if it doesn't exist

  fs.mkdirSync(publicPath, { recursive: true });const indexPath = path.join(publicPath, 'index.html');

}if (!fs.existsSync(indexPath)) {

  fs.writeFileSync(indexPath, `

// Serve static files with proper caching    <!DOCTYPE html>

app.use(express.static(publicPath, {    <html>

  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0      <head>

}));        <title>Notes App</title>

        <meta charset="utf-8">

// API 404 handler        <meta name="viewport" content="width=device-width, initial-scale=1">

app.all('/api/*', (req, res) => {      </head>

  res.status(404).json({      <body>

    error: 'Not Found',        <h1>Notes App</h1>

    message: 'The requested API endpoint does not exist',        <p>The application is running successfully.</p>

    path: req.path      </body>

  });    </html>

});  `);

}

// Serve frontend for all other routes

app.get('*', (req, res) => {// Serve static files with proper caching

  const indexPath = path.join(publicPath, 'index.html');app.use(express.static(publicPath, {

    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0

  // Create a basic index.html if it doesn't exist}));

  if (!fs.existsSync(indexPath)) {

    const htmlContent = `// API routes 404 handler

      <!DOCTYPE html>app.use('/api/*', (req, res) => {

      <html>  res.status(404).json({

        <head>    error: 'Not Found',

          <title>Notes App</title>    message: 'The requested API endpoint does not exist',

          <meta charset="utf-8">    path: req.path

          <meta name="viewport" content="width=device-width, initial-scale=1">  });

        </head>});

        <body>

          <h1>Notes App</h1>// Serve frontend for all non-API routes

          <p>The application is running successfully.</p>app.get('*', (req, res) => {

        </body>  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {

      </html>    if (err) {

    `;      res.status(500).send('Error loading the application');

    fs.writeFileSync(indexPath, htmlContent);    });

  }    return;

    }

  res.sendFile(indexPath, err => {  

    if (err) {  // Serve index.html for all other routes (SPA support)

      res.status(500).send('Error loading the application');  res.sendFile(indexPath, err => {

    }    if (err) {

  });      next(err);

});    }

  });

// Error handling middleware});

app.use((err, req, res, next) => {

  console.error('Error:', err);// Error handling middleware

  res.status(err.status || 500).json({app.use((err, req, res, next) => {

    error: err.message || 'Internal server error',  console.error('Error:', err);

    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })  res.status(err.status || 500).json({

  });    error: err.message || 'Internal server error',

});    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })

  });

// Initialize database and start server});

async function startServer() {    status: 404,

  try {    error: 'Not Found',

    await initializeDatabase();    message: `Cannot ${req.method} ${req.path}`,

    console.log('Database initialized successfully');    timestamp: new Date().toISOString()

      });

    app.listen(PORT, () => {});

      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

      console.log(`Health check: http://localhost:${PORT}/health`);// Serve frontend for SPA routes

      console.log(`API Base URL: http://localhost:${PORT}/api/v1`);app.get('*', (req, res, next) => {

    });  if (fs.existsSync(indexPath)) {

  } catch (error) {    res.sendFile(indexPath, err => {

    console.error('Failed to start server:', error);      if (err) {

    process.exit(1);        console.error('Error sending index.html:', err);

  }        next(err);

}      }

    });

// Export the app for Vercel  } else {

module.exports = app;    res.status(404).json({

      status: 404,

// Start the server if we're not in a serverless environment      error: 'Not Found',

if (!process.env.VERCEL) {      message: 'Frontend assets not found'

  startServer();    });

}  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific types of errors
  if (err.name === 'NotFoundError' || err.status === 404) {
    return res.status(404).json({
      status: 404,
      error: 'Not Found',
      message: err.message || 'Resource not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Handle other errors
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: statusCode,
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    message: err.message || 'An unexpected error occurred',
    path: req.path,
    timestamp: new Date().toISOString(),
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

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Ensure required directories exist
const dirs = ['public', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir} directory`);
  }
});

// Environment validation
if (!fs.existsSync('.env')) {
  console.log('Creating .env file from .env.example...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
  } else {
    console.error('No .env.example file found. Please create a .env file manually.');
    process.exit(1);
  }
}

// Install production dependencies
console.log('Installing production dependencies...');
try {
  execSync('npm ci --only=production', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies:', error);
  process.exit(1);
}

// Additional production optimizations
console.log('Applying production optimizations...');

// Ensure all required environment variables are set
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'DATABASE_URL',
  'ALLOWED_ORIGINS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('Build completed successfully!');
console.log('You can now start the server in production mode with: npm start');
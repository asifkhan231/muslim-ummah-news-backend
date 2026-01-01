const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
database.connect().catch(error => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(cors({
  remote:'*' // Adjust this in production to restrict origins
}));

// Trust proxy for rate limiting (needed when behind reverse proxy/load balancer)
app.set('trust proxy', 1);

// Rate limiting with proper configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/articles', require('./src/routes/articles'));
app.use('/api/sources', require('./src/routes/sources'));
app.use('/api/scraping', require('./src/routes/scraping'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Ummah News Hub API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.getConnectionState()
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Ummah News Hub API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${database.getConnectionState()}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('� SIGTERM wreceived, shutting down gracefully');
  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
});

module.exports = app;
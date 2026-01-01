require('dotenv').config();

class EnvironmentConfig {
  constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.nodeEnv === 'development';
    this.isProduction = this.nodeEnv === 'production';
    this.isTest = this.nodeEnv === 'test';
  }

  // Database configuration
  getDatabase() {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ummah-news-hub',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      }
    };
  }

  // Server configuration
  getServer() {
    return {
      port: parseInt(process.env.PORT) || 5000,
      host: process.env.HOST || '0.0.0.0',
      cors: {
        origin: this.isDevelopment 
          ? ['http://localhost:3000', 'http://localhost:3001']
          : process.env.FRONTEND_URL?.split(',') || false
      }
    };
  }

  // Scraping configuration
  getScraping() {
    return {
      intervalHours: parseInt(process.env.SCRAPE_INTERVAL_HOURS) || 6,
      timeout: parseInt(process.env.SCRAPE_TIMEOUT) || 10000,
      delay: parseInt(process.env.SCRAPE_DELAY) || 2000,
      maxArticlesPerSource: parseInt(process.env.MAX_ARTICLES_PER_SOURCE) || 20,
      retryAttempts: parseInt(process.env.SCRAPE_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.SCRAPE_RETRY_DELAY) || 5000,
      userAgent: process.env.SCRAPE_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  // Security configuration
  getSecurity() {
    return {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
    };
  }

  // External APIs configuration
  getExternalApis() {
    return {
      newsApi: {
        key: process.env.NEWS_API_KEY,
        baseUrl: 'https://newsapi.org/v2'
      },
      guardian: {
        key: process.env.GUARDIAN_API_KEY,
        baseUrl: 'https://content.guardianapis.com'
      }
    };
  }

  // Logging configuration
  getLogging() {
    return {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      format: process.env.LOG_FORMAT || 'combined',
      file: {
        enabled: process.env.LOG_TO_FILE === 'true',
        path: process.env.LOG_FILE_PATH || './logs/app.log',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
      }
    };
  }

  // Email configuration (for notifications)
  getEmail() {
    return {
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.EMAIL_FROM || 'noreply@ummahnewshub.com'
    };
  }

  // Cache configuration
  getCache() {
    return {
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0
      },
      ttl: {
        articles: parseInt(process.env.CACHE_ARTICLES_TTL) || 300, // 5 minutes
        sources: parseInt(process.env.CACHE_SOURCES_TTL) || 3600, // 1 hour
        stats: parseInt(process.env.CACHE_STATS_TTL) || 1800 // 30 minutes
      }
    };
  }

  // Validation
  validate() {
    const required = [];
    
    if (this.isProduction) {
      if (!process.env.MONGODB_URI) required.push('MONGODB_URI');
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
        required.push('JWT_SECRET');
      }
    }

    if (required.length > 0) {
      throw new Error(`Missing required environment variables: ${required.join(', ')}`);
    }

    return true;
  }

  // Get all configuration
  getAll() {
    return {
      nodeEnv: this.nodeEnv,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isTest: this.isTest,
      database: this.getDatabase(),
      server: this.getServer(),
      scraping: this.getScraping(),
      security: this.getSecurity(),
      externalApis: this.getExternalApis(),
      logging: this.getLogging(),
      email: this.getEmail(),
      cache: this.getCache()
    };
  }
}

module.exports = new EnvironmentConfig();
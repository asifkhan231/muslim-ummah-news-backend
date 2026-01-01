# Ummah News Hub - Backend API

A comprehensive Node.js/Express API server for the Ummah News Hub platform, providing news aggregation, AI-enhanced content processing, and automated scraping capabilities for Muslim community news worldwide.

## Features

- **RESTful API**: Clean endpoints for articles, sources, and scraping operations
- **Automated News Scraping**: Intelligent web scraping from 50+ global news sources
- **AI Content Enhancement**: Integration with Groq AI for content refinement and fact extraction
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Smart Categorization**: Automatic article categorization by region and topic
- **Rate Limiting**: Built-in protection against API abuse
- **Scheduled Tasks**: Automated news collection with node-cron
- **Security**: Helmet, CORS, and comprehensive error handling
- **Health Monitoring**: API health checks and database connection status

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 4.18+
- **Database**: MongoDB with Mongoose 7.5+
- **AI Integration**: Groq SDK for content enhancement
- **Web Scraping**: Cheerio + Axios
- **Scheduling**: Node-cron for automated tasks
- **Security**: Helmet, CORS, Express Rate Limit
- **Development**: Nodemon for hot reloading

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- npm or yarn

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ummah-news-hub

# AI Services (Optional - for content enhancement)
GROQ_API_KEY=your_groq_api_key_here

# Scraping Configuration
SCRAPE_INTERVAL_HOURS=6
MAX_ARTICLES_PER_SOURCE=20
REQUEST_TIMEOUT=30000
DELAY_BETWEEN_REQUESTS=2000
```

### 3. Database Setup
```bash
# Seed news sources
npm run seed

# Optional: Check database connection
node scripts/check-muslim-news-db.js
```

### 4. Start Development Server
```bash
# Development with hot reload
npm run dev

# Production mode
npm start
```

## Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start with nodemon for development
- `npm run scrape` - Run news scraper once
- `npm run seed` - Seed database with news sources
- `npm run scheduler` - Start automated scheduling service

## API Endpoints

### Articles
- `GET /api/articles` - Get paginated articles
- `GET /api/articles/:id` - Get single article
- `GET /api/articles/category/:category` - Filter by category
- `PUT /api/articles/:id/view` - Increment article views

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Articles per page (default: 20, max: 100)
- `category` - Filter by category
- `source` - Filter by source name
- `search` - Search in title and content
- `hasVideo` - Filter articles with video content

### Sources
- `GET /api/sources` - Get all news sources
- `GET /api/sources/:id` - Get single source

### Scraping
- `POST /api/scraping/run` - Trigger manual scraping
- `GET /api/scraping/status` - Get scraping status

### Health & Monitoring
- `GET /api/health` - API health status and database connection

## News Sources

The platform scrapes from reputable international news sources:

- **Al Jazeera English** - International news with Middle East focus
- **Middle East Eye** - Independent Middle East journalism
- **The New Arab** - Pan-Arab news platform
- **Reuters Middle East** - International news agency
- **BBC Middle East** - British public broadcaster
- **Anadolu Agency** - Turkish state news agency
- **Jakarta Post** - Indonesian English-language daily
- **Muslim News UK** - British Muslim community news

## AI Content Enhancement

The platform uses Groq AI to enhance article quality:

- **Content Refinement**: Improves readability and structure
- **Fact Extraction**: Identifies key facts and context
- **Background Context**: Provides historical and contextual information
- **Sentiment Analysis**: Categorizes article sentiment

## Deployment

### Production Setup
```bash
# Set environment variables
export NODE_ENV=production
export MONGODB_URI=your_production_mongodb_uri
export PORT=5000

# Install production dependencies
npm ci --only=production

# Start server
npm start
```

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start server.js --name "ummah-news-api"

# Start scheduler
pm2 start scripts/scheduler.js --name "news-scheduler"

# Save configuration
pm2 save
pm2 startup
```

## License

MIT License - see LICENSE file for details
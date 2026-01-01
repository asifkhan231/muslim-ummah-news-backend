require('dotenv').config();
const cron = require('node-cron');
const database = require('../config/database');
const scrapingConfig = require('../config/scraping');
const scrapingService = require('../services/scrapingService');

class NewsScheduler {
  constructor() {
    this.isRunning = false;
  }

  async initialize() {
    try {
      await database.connect();
      console.log('📅 News scheduler initialized');
    } catch (error) {
      console.error('❌ Scheduler initialization error:', error);
      throw error;
    }
  }

  startScheduler() {
    const cronExpression = scrapingConfig.getCronSchedule();
    
    console.log(`⏰ Starting scheduler with expression: ${cronExpression}`);
    console.log(`🔄 Will run every ${scrapingConfig.scrapeIntervalHours} hours`);
    
    cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        console.log('⚠️ Scraper already running, skipping this cycle');
        return;
      }

      try {
        this.isRunning = true;
        console.log('🔍 Starting scheduled scraping...');
        const articlesCount = await scrapingService.scrapeAllSources();
        console.log(`✅ Scheduled scraping completed. Articles scraped: ${articlesCount}`);
      } catch (error) {
        console.error('❌ Scheduled scraping error:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Run once immediately
    this.runImmediate();
  }

  async runImmediate() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;
      console.log('🚀 Running immediate scraping...');
      const articlesCount = await scrapingService.scrapeAllSources();
      console.log(`✅ Immediate scraping completed. Articles scraped: ${articlesCount}`);
    } catch (error) {
      console.error('❌ Immediate scraping error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async stop() {
    console.log('🛑 Stopping scheduler...');
    await database.disconnect();
  }
}

// Run scheduler if called directly
if (require.main === module) {
  const scheduler = new NewsScheduler();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, stopping scheduler...');
    await scheduler.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, stopping scheduler...');
    await scheduler.stop();
    process.exit(0);
  });

  scheduler.initialize()
    .then(() => scheduler.startScheduler())
    .catch(error => {
      console.error('❌ Scheduler error:', error);
      process.exit(1);
    });
}

module.exports = NewsScheduler;
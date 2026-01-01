require('dotenv').config();
const database = require('../config/database');
const scrapingService = require('../services/scrapingService');

async function runScraper() {
  try {
    await database.connect();
    console.log('🔍 Starting news scraping process...');
    
    const articlesCount = await scrapingService.scrapeAllSources();
    console.log(`✅ Scraping finished. Total articles scraped: ${articlesCount}`);
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Scraper error:', error);
    await database.disconnect();
    process.exit(1);
  }
}

// Run scraper if called directly
if (require.main === module) {
  runScraper();
}

module.exports = { runScraper };
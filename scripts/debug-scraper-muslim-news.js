require('dotenv').config();
const database = require('../config/database');
const scrapingService = require('../services/scrapingService');
const Source = require('../models/Source');

async function scrapeMuslimNews() {
    try {
        await database.connect();
        console.log('🔍 Testing scraper for Muslim News...');

        const source = await Source.findOne({ name: 'Muslim News' });
        if (!source) {
            console.error('❌ Muslim News source not found in DB');
            process.exit(1);
        }

        console.log(`Found source: ${source.name} (${source.url})`);

        // Scrape just this source
        const count = await scrapingService.scrapeSource(source);
        console.log(`✅ Scraped ${count} articles.`);

        await database.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Scraper error:', error);
        await database.disconnect();
        process.exit(1);
    }
}

scrapeMuslimNews();

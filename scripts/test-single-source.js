require('dotenv').config();
const database = require('../config/database');
const scrapingService = require('../src/services/scrapingService');
const sourceService = require('../src/services/sourceService');

async function testScraping() {
    try {
        await database.connect();

        // Get headers to verify video/AI settings
        const sourceName = process.argv[2]; // Pass source name as arg

        if (!sourceName) {
            console.log('Please provide a source name fragment (e.g., "Jazeera", "TRT", "Uyghur")');
            const sources = await sourceService.getActiveSources();
            console.log('Available sources:', sources.map(s => s.name).join(', '));
            process.exit(0);
        }

        console.log(`Testing scraping for sources matching: "${sourceName}"`);

        // Find specific source to test
        const allSources = await sourceService.getActiveSources();
        const targetSource = allSources.find(s => s.name.toLowerCase().includes(sourceName.toLowerCase()));

        if (!targetSource) {
            console.error('Source not found!');
            process.exit(1);
        }

        console.log(`Targeting: ${targetSource.name} (${targetSource.url})`);

        // Run scraper for just this source
        // We'll modify the scraping service to optionally accept a single source, 
        // or we'll just manually call scrapeSource here if accessible, 
        // but scrapeSource is a method of the class instance.

        const count = await scrapingService.scrapeSource(targetSource);

        console.log(`\nTest completed. Found/Processed ${count} articles.`);

        await database.disconnect();
    } catch (error) {
        console.error('Test Failed:', error);
        await database.disconnect(); // Ensure disconnect on error
        process.exit(1);
    }
}

testScraping();

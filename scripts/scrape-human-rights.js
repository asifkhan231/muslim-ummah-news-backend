const mongoose = require('mongoose');
const Source = require('../src/models/Source');
const scrapingService = require('../src/services/scrapingService');
require('dotenv').config();

async function scrapeHumanRightsSources() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get human rights focused sources
    const humanRightsSources = await Source.find({
      isActive: true,
      $or: [
        { name: { $regex: /amnesty|human rights|holocaust|ohchr/i } },
        { categories: { $in: ['tragedy'] } },
        { url: { $regex: /human-rights|topics\/subjects\/human-rights/i } }
      ]
    });

    console.log(`📰 Found ${humanRightsSources.length} human rights sources to scrape`);

    let totalArticles = 0;
    for (const source of humanRightsSources) {
      try {
        console.log(`\n🔍 Scraping: ${source.name}`);
        const count = await scrapingService.scrapeSource(source);
        totalArticles += count;
        console.log(`✅ ${source.name}: ${count} articles scraped`);
        
        // Add delay between sources
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Human rights scraping completed!`);
    console.log(`📊 Total articles scraped: ${totalArticles}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
scrapeHumanRightsSources().then(() => {
  console.log('🎉 Human rights scraping completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Scraping failed:', error);
  process.exit(1);
});
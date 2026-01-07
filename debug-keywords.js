const scrapingConfig = require('./config/scraping');

const keywords = scrapingConfig.getCategoryKeywords();

console.log('Politics keywords:', keywords.politics);
console.log('\nMiddle-east keywords:', keywords['middle-east']);
console.log('\nAmericas keywords:', keywords.americas);
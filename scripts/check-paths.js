console.log('Starting checks...');
try {
    console.log('Checking database config...');
    require('../config/database');
    console.log('✅ Database config loaded');
} catch (e) {
    console.error('❌ Database config failed:', e.message);
}

try {
    console.log('Checking Source model...');
    require('../src/models/Source');
    console.log('✅ Source model loaded');
} catch (e) {
    console.error('❌ Source model failed:', e.message);
}

try {
    console.log('Checking Source Service...');
    require('../src/services/sourceService');
    console.log('✅ Source Service loaded');
} catch (e) {
    console.error('❌ Source Service failed:', e.message);
}

try {
    console.log('Checking Scraping Service...');
    require('../src/services/scrapingService');
    console.log('✅ Scraping Service loaded');
} catch (e) {
    console.error('❌ Scraping Service failed:', e.message);
}

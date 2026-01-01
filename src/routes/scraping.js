const express = require('express');
const router = express.Router();
const scrapingController = require('../controllers/scrapingController');

// Scrape all sources
router.post('/scrape-all', scrapingController.scrapeAll);

// Scrape specific source
router.post('/scrape/:sourceId', scrapingController.scrapeSource);

// Validate source scraping configuration
router.post('/validate/:sourceId', scrapingController.validateSource);

// Get scraping status for all sources
router.get('/status', scrapingController.getScrapingStatus);

// Test scraping with custom URL and selectors
router.post('/test', scrapingController.testScraping);

module.exports = router;
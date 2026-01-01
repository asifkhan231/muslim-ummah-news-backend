const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');

// Get all sources
router.get('/', sourceController.getAllSources);

// Get source statistics
router.get('/stats', sourceController.getSourceStats);

// Get sources by country
router.get('/country/:country', sourceController.getSourcesByCountry);

// Get sources by category
router.get('/category/:category', sourceController.getSourcesByCategory);

// Get source by ID
router.get('/:id', sourceController.getSourceById);

// Create new source (admin only - you might want to add authentication)
router.post('/', sourceController.createSource);

// Update source (admin only - you might want to add authentication)
router.put('/:id', sourceController.updateSource);

// Delete source (admin only - you might want to add authentication)
router.delete('/:id', sourceController.deleteSource);

// Validate source configuration and scraping
router.post('/:id/validate', sourceController.validateSource);

// Manually scrape a specific source
router.post('/:id/scrape', sourceController.scrapeSource);

module.exports = router;
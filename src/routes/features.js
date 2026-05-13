const express = require('express');
const router = express.Router();
const featuresController = require('../controllers/featuresController');

// @route   GET /api/features/prayer-times
// @desc    Get prayer times based on location
router.get('/prayer-times', featuresController.getPrayerTimes);

// @route   GET /api/features/qibla
// @desc    Get qibla direction based on location
router.get('/qibla', featuresController.getQibla);

module.exports = router;

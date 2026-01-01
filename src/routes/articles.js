const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Get all articles with pagination and filtering
router.get('/', articleController.getAllArticles);

// Get article statistics
router.get('/stats', articleController.getArticleStats);

// Get recent articles
router.get('/recent', articleController.getRecentArticles);

// Get popular articles
router.get('/popular', articleController.getPopularArticles);

// Search articles
router.get('/search', articleController.searchArticles);

// Get single article by ID
router.get('/:id', articleController.getArticleById);

// Get articles by category
router.get('/category/:category', articleController.getArticlesByCategory);

// Create new article (admin only - you might want to add authentication)
router.post('/', articleController.createArticle);

// Update article (admin only - you might want to add authentication)
router.put('/:id', articleController.updateArticle);

// Delete article (admin only - you might want to add authentication)
router.delete('/:id', articleController.deleteArticle);

module.exports = router;
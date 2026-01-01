const articleService = require('../services/articleService');

class ArticleController {
  async getAllArticles(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category,
        source: req.query.source,
        search: req.query.search,
        hasVideo: req.query.hasVideo === 'true'
      };

      const result = await articleService.getAllArticles(filters);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllArticles:', error);
      res.status(500).json({
        error: 'Failed to fetch articles',
        message: error.message
      });
    }
  }

  async getArticleById(req, res) {
    try {
      const { id } = req.params;
      const article = await articleService.getArticleById(id);
      res.json(article);
    } catch (error) {
      console.error('Error in getArticleById:', error);

      if (error.message === 'Article not found') {
        return res.status(404).json({
          error: 'Article not found',
          message: 'The requested article does not exist'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch article',
        message: error.message
      });
    }
  }

  async getArticlesByCategory(req, res) {
    try {
      const { category } = req.params;
      const filters = {
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await articleService.getArticlesByCategory(category, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in getArticlesByCategory:', error);
      res.status(500).json({
        error: 'Failed to fetch articles by category',
        message: error.message
      });
    }
  }

  async createArticle(req, res) {
    try {
      const articleData = req.body;
      const article = await articleService.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error in createArticle:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Article already exists',
          message: 'An article with this URL already exists'
        });
      }

      res.status(400).json({
        error: 'Failed to create article',
        message: error.message
      });
    }
  }

  async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const article = await articleService.updateArticle(id, updateData);
      res.json(article);
    } catch (error) {
      console.error('Error in updateArticle:', error);

      if (error.message === 'Article not found') {
        return res.status(404).json({
          error: 'Article not found',
          message: 'The requested article does not exist'
        });
      }

      res.status(400).json({
        error: 'Failed to update article',
        message: error.message
      });
    }
  }

  async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      const article = await articleService.deleteArticle(id);
      res.json({
        message: 'Article deleted successfully',
        article
      });
    } catch (error) {
      console.error('Error in deleteArticle:', error);

      if (error.message === 'Article not found') {
        return res.status(404).json({
          error: 'Article not found',
          message: 'The requested article does not exist'
        });
      }

      res.status(500).json({
        error: 'Failed to delete article',
        message: error.message
      });
    }
  }

  async getArticleStats(req, res) {
    try {
      const stats = await articleService.getArticleStats();
      res.json(stats);
    } catch (error) {
      console.error('Error in getArticleStats:', error);
      res.status(500).json({
        error: 'Failed to fetch article statistics',
        message: error.message
      });
    }
  }

  async searchArticles(req, res) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          error: 'Search term is required',
          message: 'Please provide a search term using the "q" parameter'
        });
      }

      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category
      };

      const result = await articleService.searchArticles(searchTerm, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in searchArticles:', error);
      res.status(500).json({
        error: 'Failed to search articles',
        message: error.message
      });
    }
  }

  async getRecentArticles(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const articles = await articleService.getRecentArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error('Error in getRecentArticles:', error);
      res.status(500).json({
        error: 'Failed to fetch recent articles',
        message: error.message
      });
    }
  }

  async getPopularArticles(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const articles = await articleService.getPopularArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error('Error in getPopularArticles:', error);
      res.status(500).json({
        error: 'Failed to fetch popular articles',
        message: error.message
      });
    }
  }
}

module.exports = new ArticleController();
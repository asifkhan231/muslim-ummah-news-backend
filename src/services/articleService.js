const Article = require('../models/Article');

class ArticleService {
  async getAllArticles(filters = {}) {
    const { page = 1, limit = 20, category, source, search } = filters;

    let query = { isActive: true };

    // Add filters
    if (category) query.category = category;
    if (source) query['source.name'] = source;
    if (filters.hasVideo) query.hasVideo = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Exclude full content for list view

    const total = await Article.countDocuments(query);

    return {
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };
  }

  async getArticleById(id) {
    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!article) {
      throw new Error('Article not found');
    }
    return article;
  }

  async getArticlesByCategory(category, filters = {}) {
    const { page = 1, limit = 20 } = filters;

    const articles = await Article.find({
      category,
      isActive: true
    })
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Article.countDocuments({ category, isActive: true });

    return {
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      category
    };
  }

  async createArticle(articleData) {
    const article = new Article(articleData);
    return await article.save();
  }

  async updateArticle(id, updateData) {
    const article = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!article) {
      throw new Error('Article not found');
    }

    return article;
  }

  async deleteArticle(id) {
    const article = await Article.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!article) {
      throw new Error('Article not found');
    }

    return article;
  }

  async getArticleStats() {
    const stats = await Article.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalArticles = await Article.countDocuments({ isActive: true });

    return {
      totalArticles,
      categoriesStats: stats
    };
  }

  async searchArticles(searchTerm, filters = {}) {
    const { page = 1, limit = 20, category } = filters;

    let query = {
      isActive: true,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    if (category) {
      query.category = category;
    }

    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Article.countDocuments(query);

    return {
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      searchTerm
    };
  }

  async getRecentArticles(limit = 10) {
    return await Article.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title summary publishedAt category source imageUrl');
  }

  async getPopularArticles(limit = 10) {
    // This could be enhanced with view counts or engagement metrics
    // Sort by views instead of scrapedAt
    return await Article.find({ isActive: true })
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .select('title summary publishedAt category source imageUrl views videoUrl hasVideo');
  }
}

module.exports = new ArticleService();
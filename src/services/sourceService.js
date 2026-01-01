const Source = require('../models/Source');

class SourceService {
  async getAllSources(filters = {}) {
    const { isActive = true } = filters;
    
    const sources = await Source.find({ isActive })
      .select('-scrapeConfig')
      .sort({ name: 1 });
    
    return sources;
  }

  async getSourceById(id) {
    const source = await Source.findById(id);
    if (!source) {
      throw new Error('Source not found');
    }
    return source;
  }

  async createSource(sourceData) {
    const source = new Source(sourceData);
    return await source.save();
  }

  async updateSource(id, updateData) {
    const source = await Source.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!source) {
      throw new Error('Source not found');
    }
    
    return source;
  }

  async deleteSource(id) {
    const source = await Source.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!source) {
      throw new Error('Source not found');
    }
    
    return source;
  }

  async getActiveSources() {
    return await Source.find({ isActive: true });
  }

  async updateLastScraped(sourceId, articlesCount = 0) {
    return await Source.findByIdAndUpdate(
      sourceId,
      { 
        lastScraped: new Date(),
        $inc: { articlesCount: articlesCount }
      },
      { new: true }
    );
  }

  async getSourceStats() {
    const stats = await Source.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
          totalArticles: { $sum: '$articlesCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalSources = await Source.countDocuments({ isActive: true });
    
    return {
      totalSources,
      countryStats: stats
    };
  }

  async getSourcesByCountry(country) {
    return await Source.find({ 
      country: { $regex: country, $options: 'i' }, 
      isActive: true 
    })
      .select('-scrapeConfig')
      .sort({ name: 1 });
  }

  async getSourcesByCategory(category) {
    return await Source.find({ 
      categories: category, 
      isActive: true 
    })
      .select('-scrapeConfig')
      .sort({ name: 1 });
  }

  async validateSourceConfig(sourceId) {
    const source = await Source.findById(sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    const requiredFields = ['titleSelector', 'contentSelector', 'linkSelector'];
    const missingFields = requiredFields.filter(field => 
      !source.scrapeConfig || !source.scrapeConfig[field]
    );

    return {
      isValid: missingFields.length === 0,
      missingFields,
      source
    };
  }
}

module.exports = new SourceService();
const sourceService = require('../services/sourceService');
const scrapingService = require('../services/scrapingService');

class SourceController {
  async getAllSources(req, res) {
    try {
      const filters = {
        isActive: req.query.isActive !== 'false' // Default to true unless explicitly false
      };

      const sources = await sourceService.getAllSources(filters);
      res.json(sources);
    } catch (error) {
      console.error('Error in getAllSources:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sources',
        message: error.message 
      });
    }
  }

  async getSourceById(req, res) {
    try {
      const { id } = req.params;
      const source = await sourceService.getSourceById(id);
      res.json(source);
    } catch (error) {
      console.error('Error in getSourceById:', error);
      
      if (error.message === 'Source not found') {
        return res.status(404).json({ 
          error: 'Source not found',
          message: 'The requested source does not exist' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch source',
        message: error.message 
      });
    }
  }

  async createSource(req, res) {
    try {
      const sourceData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'url', 'scrapeConfig'];
      const missingFields = requiredFields.filter(field => !sourceData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: `The following fields are required: ${missingFields.join(', ')}`
        });
      }

      const source = await sourceService.createSource(sourceData);
      res.status(201).json(source);
    } catch (error) {
      console.error('Error in createSource:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({ 
          error: 'Source already exists',
          message: 'A source with this name or URL already exists' 
        });
      }
      
      res.status(400).json({ 
        error: 'Failed to create source',
        message: error.message 
      });
    }
  }

  async updateSource(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const source = await sourceService.updateSource(id, updateData);
      res.json(source);
    } catch (error) {
      console.error('Error in updateSource:', error);
      
      if (error.message === 'Source not found') {
        return res.status(404).json({ 
          error: 'Source not found',
          message: 'The requested source does not exist' 
        });
      }
      
      res.status(400).json({ 
        error: 'Failed to update source',
        message: error.message 
      });
    }
  }

  async deleteSource(req, res) {
    try {
      const { id } = req.params;
      const source = await sourceService.deleteSource(id);
      res.json({ 
        message: 'Source deleted successfully',
        source 
      });
    } catch (error) {
      console.error('Error in deleteSource:', error);
      
      if (error.message === 'Source not found') {
        return res.status(404).json({ 
          error: 'Source not found',
          message: 'The requested source does not exist' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to delete source',
        message: error.message 
      });
    }
  }

  async getSourceStats(req, res) {
    try {
      const stats = await sourceService.getSourceStats();
      res.json(stats);
    } catch (error) {
      console.error('Error in getSourceStats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch source statistics',
        message: error.message 
      });
    }
  }

  async getSourcesByCountry(req, res) {
    try {
      const { country } = req.params;
      const sources = await sourceService.getSourcesByCountry(country);
      res.json(sources);
    } catch (error) {
      console.error('Error in getSourcesByCountry:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sources by country',
        message: error.message 
      });
    }
  }

  async getSourcesByCategory(req, res) {
    try {
      const { category } = req.params;
      const sources = await sourceService.getSourcesByCategory(category);
      res.json(sources);
    } catch (error) {
      console.error('Error in getSourcesByCategory:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sources by category',
        message: error.message 
      });
    }
  }

  async validateSource(req, res) {
    try {
      const { id } = req.params;
      
      // First validate the source configuration
      const configValidation = await sourceService.validateSourceConfig(id);
      
      if (!configValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid source configuration',
          message: `Missing required fields: ${configValidation.missingFields.join(', ')}`,
          validation: configValidation
        });
      }

      // Then test the actual scraping
      const scrapingValidation = await scrapingService.validateSource(configValidation.source);
      
      res.json({
        message: 'Source validation completed',
        configValidation,
        scrapingValidation
      });
    } catch (error) {
      console.error('Error in validateSource:', error);
      
      if (error.message === 'Source not found') {
        return res.status(404).json({ 
          error: 'Source not found',
          message: 'The requested source does not exist' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to validate source',
        message: error.message 
      });
    }
  }

  async scrapeSource(req, res) {
    try {
      const { id } = req.params;
      const source = await sourceService.getSourceById(id);
      
      const articlesCount = await scrapingService.scrapeSource(source);
      
      res.json({
        message: 'Source scraped successfully',
        source: source.name,
        articlesScraped: articlesCount
      });
    } catch (error) {
      console.error('Error in scrapeSource:', error);
      
      if (error.message === 'Source not found') {
        return res.status(404).json({ 
          error: 'Source not found',
          message: 'The requested source does not exist' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to scrape source',
        message: error.message 
      });
    }
  }
}

module.exports = new SourceController();
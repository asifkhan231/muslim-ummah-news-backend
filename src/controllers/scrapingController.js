const scrapingService = require('../services/scrapingService');
const sourceService = require('../services/sourceService');

class ScrapingController {
  async scrapeAll(req, res) {
    try {
      console.log('Starting manual scraping of all sources...');
      const articlesCount = await scrapingService.scrapeAllSources();
      
      res.json({
        message: 'Scraping completed successfully',
        totalArticlesScraped: articlesCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in scrapeAll:', error);
      res.status(500).json({ 
        error: 'Failed to scrape all sources',
        message: error.message 
      });
    }
  }

  async scrapeSource(req, res) {
    try {
      const { sourceId } = req.params;
      
      if (!sourceId) {
        return res.status(400).json({
          error: 'Source ID is required',
          message: 'Please provide a valid source ID'
        });
      }

      const source = await sourceService.getSourceById(sourceId);
      const articlesCount = await scrapingService.scrapeSource(source);
      
      res.json({
        message: 'Source scraped successfully',
        source: {
          id: source._id,
          name: source.name,
          url: source.url
        },
        articlesScraped: articlesCount,
        timestamp: new Date().toISOString()
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

  async validateSource(req, res) {
    try {
      const { sourceId } = req.params;
      
      if (!sourceId) {
        return res.status(400).json({
          error: 'Source ID is required',
          message: 'Please provide a valid source ID'
        });
      }

      const source = await sourceService.getSourceById(sourceId);
      const validation = await scrapingService.validateSource(source);
      
      res.json({
        message: 'Source validation completed',
        source: {
          id: source._id,
          name: source.name,
          url: source.url
        },
        validation,
        timestamp: new Date().toISOString()
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

  async getScrapingStatus(req, res) {
    try {
      const sources = await sourceService.getAllSources();
      
      const status = sources.map(source => ({
        id: source._id,
        name: source.name,
        url: source.url,
        isActive: source.isActive,
        lastScraped: source.lastScraped,
        articlesCount: source.articlesCount || 0,
        timeSinceLastScrape: source.lastScraped 
          ? Math.floor((new Date() - new Date(source.lastScraped)) / (1000 * 60 * 60)) + ' hours ago'
          : 'Never'
      }));

      const totalArticles = status.reduce((sum, source) => sum + source.articlesCount, 0);
      const activeSources = status.filter(source => source.isActive).length;
      
      res.json({
        message: 'Scraping status retrieved successfully',
        summary: {
          totalSources: sources.length,
          activeSources,
          totalArticlesScraped: totalArticles
        },
        sources: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getScrapingStatus:', error);
      res.status(500).json({ 
        error: 'Failed to get scraping status',
        message: error.message 
      });
    }
  }

  async testScraping(req, res) {
    try {
      const { url, selectors } = req.body;
      
      if (!url || !selectors) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'Please provide both URL and selectors object'
        });
      }

      // Create a temporary source object for testing
      const testSource = {
        name: 'Test Source',
        url,
        baseUrl: url,
        scrapeConfig: selectors
      };

      const validation = await scrapingService.validateSource(testSource);
      
      res.json({
        message: 'Scraping test completed',
        testSource: {
          url,
          selectors
        },
        validation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in testScraping:', error);
      res.status(500).json({ 
        error: 'Failed to test scraping',
        message: error.message 
      });
    }
  }
}

module.exports = new ScrapingController();
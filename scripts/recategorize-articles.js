const mongoose = require('mongoose');
const Article = require('../src/models/Article');
const scrapingConfig = require('../config/scraping');
require('dotenv').config();

class RecategorizationService {
  constructor() {
    this.categoryKeywords = scrapingConfig.getCategoryKeywords();
  }

  categorizeArticle(text) {
    const lowerText = text.toLowerCase();
    
    // Create a scoring system for better categorization
    const categoryScores = {};
    
    // Initialize scores
    for (const category of Object.keys(this.categoryKeywords)) {
      categoryScores[category] = 0;
    }
    
    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Count occurrences of keyword
        const matches = (lowerText.match(new RegExp(keywordLower, 'g')) || []).length;
        
        if (matches > 0) {
          // Give higher weight to longer, more specific keywords
          const weight = keyword.length > 10 ? 3 : keyword.length > 5 ? 2 : 1;
          categoryScores[category] += matches * weight;
        }
      }
    }
    
    // Find the category with the highest score
    let bestCategory = 'general';
    let highestScore = 0;
    
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Only assign a specific category if the score is significant enough
    if (highestScore >= 2) {
      return { category: bestCategory, score: highestScore };
    }
    
    return { category: 'general', score: 0 };
  }

  async recategorizeAllArticles() {
    try {
      console.log('🔄 Starting article recategorization...');
      
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      // Get all articles
      const articles = await Article.find({ isActive: true });
      console.log(`📊 Found ${articles.length} articles to recategorize`);

      let updated = 0;
      let unchanged = 0;

      for (const article of articles) {
        const text = `${article.title} ${article.content}`;
        const result = this.categorizeArticle(text);
        
        if (result.category !== article.category) {
          console.log(`📝 Updating "${article.title.substring(0, 50)}..."`);
          console.log(`   Old category: ${article.category} → New category: ${result.category} (score: ${result.score})`);
          
          await Article.findByIdAndUpdate(article._id, {
            category: result.category
          });
          updated++;
        } else {
          unchanged++;
        }
      }

      console.log('\n📈 Recategorization Summary:');
      console.log(`✅ Updated: ${updated} articles`);
      console.log(`➡️  Unchanged: ${unchanged} articles`);
      console.log(`📊 Total processed: ${articles.length} articles`);

      // Show category distribution
      const categoryStats = await Article.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      console.log('\n📊 New Category Distribution:');
      categoryStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} articles`);
      });

    } catch (error) {
      console.error('❌ Error during recategorization:', error);
    } finally {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the recategorization
const service = new RecategorizationService();
service.recategorizeAllArticles().then(() => {
  console.log('🎉 Recategorization completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Recategorization failed:', error);
  process.exit(1);
});
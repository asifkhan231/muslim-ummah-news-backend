const mongoose = require('mongoose');
const Article = require('../src/models/Article');
const scrapingConfig = require('../config/scraping');
require('dotenv').config();

class CategoryMigration {
  constructor() {
    this.categoryKeywords = scrapingConfig.getCategoryKeywords();
  }

  categorizeArticle(text) {
    const lowerText = text.toLowerCase();
    
    // Create a scoring system for better categorization
    const categoryScores = {};
    
    // Initialize scores for new categories
    const newCategories = ['human-rights', 'conflict', 'persecution'];
    for (const category of newCategories) {
      categoryScores[category] = 0;
    }
    
    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (!newCategories.includes(category)) continue;
      
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Use word boundaries for better matching
        const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = (lowerText.match(regex) || []).length;
        
        if (matches > 0) {
          // Give higher weight to longer, more specific keywords
          let weight = 1;
          if (keyword.length > 15) weight = 4;
          else if (keyword.length > 10) weight = 3;
          else if (keyword.length > 5) weight = 2;
          
          // Boost score for exact phrase matches
          if (keyword.includes(' ') && lowerText.includes(keywordLower)) {
            weight *= 2;
          }
          
          categoryScores[category] += matches * weight;
        }
      }
    }
    
    // Find the category with the highest score
    let bestCategory = null;
    let highestScore = 0;
    
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Only assign a specific category if the score is significant enough
    if (highestScore >= 3) {
      return bestCategory;
    }
    
    return null; // Keep original category
  }

  async migrateCategories() {
    try {
      console.log('🔄 Starting category migration...');
      
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      // Get all articles with "tragedy" category
      const tragedyArticles = await Article.find({ 
        category: 'tragedy',
        isActive: true 
      });
      
      console.log(`📊 Found ${tragedyArticles.length} articles with "tragedy" category`);

      let migrated = {
        'human-rights': 0,
        'conflict': 0,
        'persecution': 0,
        'unchanged': 0
      };

      for (const article of tragedyArticles) {
        const text = `${article.title} ${article.content}`;
        const newCategory = this.categorizeArticle(text);
        
        if (newCategory) {
          console.log(`📝 Migrating "${article.title.substring(0, 50)}..."`);
          console.log(`   tragedy → ${newCategory}`);
          
          await Article.findByIdAndUpdate(article._id, {
            category: newCategory
          });
          migrated[newCategory]++;
        } else {
          // Keep as general if no strong match
          await Article.findByIdAndUpdate(article._id, {
            category: 'general'
          });
          migrated.unchanged++;
        }
      }

      console.log('\n📈 Migration Summary:');
      console.log(`✅ Human Rights: ${migrated['human-rights']} articles`);
      console.log(`✅ Conflict & Security: ${migrated['conflict']} articles`);
      console.log(`✅ Persecution & Oppression: ${migrated['persecution']} articles`);
      console.log(`➡️  Moved to General: ${migrated.unchanged} articles`);

      // Show new category distribution
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
      console.error('❌ Error during migration:', error);
    } finally {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the migration
const migration = new CategoryMigration();
migration.migrateCategories().then(() => {
  console.log('🎉 Category migration completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
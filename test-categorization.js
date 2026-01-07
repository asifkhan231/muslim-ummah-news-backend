const scrapingConfig = require('./config/scraping');

class TestCategorization {
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
          console.log(`   Found "${keyword}" in ${category}: +${matches * weight} (total: ${categoryScores[category]})`);
        }
      }
    }
    
    // Apply category-specific rules and penalties
    
    // If it's clearly about war/conflict but not specifically Palestinian, don't categorize as Palestine
    if (lowerText.includes('war') || lowerText.includes('conflict') || lowerText.includes('attack')) {
      if (!lowerText.includes('gaza') && !lowerText.includes('west bank') && !lowerText.includes('israeli occupation')) {
        const oldScore = categoryScores['palestine'];
        categoryScores['palestine'] = Math.max(0, categoryScores['palestine'] - 3);
        if (oldScore !== categoryScores['palestine']) {
          console.log(`   Applied war/conflict penalty to Palestine: ${oldScore} -> ${categoryScores['palestine']}`);
        }
      }
    }
    
    // Boost politics for government/political terms
    if (lowerText.includes('president') || lowerText.includes('government') || lowerText.includes('minister') || 
        lowerText.includes('election') || lowerText.includes('parliament') || lowerText.includes('diplomatic')) {
      categoryScores['politics'] = (categoryScores['politics'] || 0) + 2;
      console.log(`   Applied politics boost: +2 (total: ${categoryScores['politics']})`);
    }
    
    // Boost technology for tech terms
    if (lowerText.includes('drone') || lowerText.includes('missile') || lowerText.includes('cyber') || 
        lowerText.includes('digital') || lowerText.includes('software') || lowerText.includes('app')) {
      // But only if it's actually about technology, not military
      if (!lowerText.includes('attack') && !lowerText.includes('military') && !lowerText.includes('war')) {
        categoryScores['technology'] = (categoryScores['technology'] || 0) + 3;
        console.log(`   Applied technology boost: +3 (total: ${categoryScores['technology']})`);
      }
    }
    
    // Find the category with the highest score
    let bestCategory = 'general';
    let highestScore = 0;
    
    console.log('\n   Final scores:');
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > 0) {
        console.log(`   ${category}: ${score}`);
      }
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Only assign a specific category if the score is significant enough
    if (highestScore >= 3) {
      console.log(`\n   ✅ Result: ${bestCategory} (score: ${highestScore})`);
      return bestCategory;
    }
    
    console.log(`\n   ✅ Result: general (no strong category match, highest: ${bestCategory}:${highestScore})`);
    return 'general';
  }
}

// Test with a problematic article
const tester = new TestCategorization();

console.log('Testing Ukraine article:');
const ukraineText = "Ukraine Reports Progress in Talks with Western Allies Ukraine's new chief of staff, Kyrylo Budanov, reported 'concrete results' in ongoing talks with Western allies over an end to the war and post-conflict security guarantees.";
tester.categorizeArticle(ukraineText);

console.log('\n\nTesting Venezuela article:');
const venezuelaText = "US President Trump claims Venezuela to hand over oil stocks worth billions US President Donald Trump has claimed that Venezuela is willing to hand over oil stocks worth billions of dollars to the United States.";
tester.categorizeArticle(venezuelaText);
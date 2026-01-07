const mongoose = require('mongoose');
const Source = require('../src/models/Source');
require('dotenv').config();

const humanRightsSources = [
  // International Human Rights Organizations
  {
    name: "Amnesty International",
    url: "https://www.amnesty.org/en/latest/news/",
    baseUrl: "https://www.amnesty.org",
    country: "International",
    language: "en",
    isActive: true,
    categories: ["human-rights", "politics", "middle-east", "south-asia", "africa", "europe"],
    scrapeConfig: {
      titleSelector: "h1, .article-title, .post-title",
      contentSelector: ".article-content, .post-content, .entry-content",
      linkSelector: "a[href*='/latest/news/']",
      imageSelector: ".article-image img, .post-image img",
      dateSelector: ".article-date, .post-date, time"
    }
  },
  {
    name: "Human Rights Watch",
    url: "https://www.hrw.org/news",
    baseUrl: "https://www.hrw.org",
    country: "International",
    language: "en",
    isActive: true,
    categories: ["human-rights", "politics", "middle-east", "south-asia", "africa", "europe", "americas"],
    scrapeConfig: {
      titleSelector: "h1, .article-title, .node-title",
      contentSelector: ".article-content, .field-name-body, .node-content",
      linkSelector: "a[href*='/news/']",
      imageSelector: ".article-image img, .field-name-field-image img",
      dateSelector: ".article-date, .date-display-single, time"
    }
  },
  {
    name: "UN Human Rights Office",
    url: "https://www.ohchr.org/en/news",
    baseUrl: "https://www.ohchr.org",
    country: "International",
    language: "en",
    isActive: true,
    categories: ["human-rights", "politics", "middle-east", "south-asia", "africa", "europe", "americas"],
    scrapeConfig: {
      titleSelector: "h1, .page-title, .article-title",
      contentSelector: ".article-content, .field-name-body, .content",
      linkSelector: "a[href*='/news/']",
      imageSelector: ".article-image img, .field-name-field-image img",
      dateSelector: ".article-date, .date-display-single, time"
    }
  },
  {
    name: "US Holocaust Memorial Museum",
    url: "https://www.ushmm.org/genocide-prevention/blog",
    baseUrl: "https://www.ushmm.org",
    country: "USA",
    language: "en",
    isActive: true,
    categories: ["persecution", "education", "politics"],
    scrapeConfig: {
      titleSelector: "h1, .blog-post-title, .article-title",
      contentSelector: ".blog-post-content, .article-content, .content",
      linkSelector: "a[href*='/blog/']",
      imageSelector: ".blog-post-image img, .article-image img",
      dateSelector: ".blog-post-date, .article-date, time"
    }
  },
  
  // Enhanced existing sources with better focus
  {
    name: "Middle East Eye - Human Rights",
    url: "https://www.middleeasteye.net/topics/human-rights",
    baseUrl: "https://www.middleeasteye.net",
    country: "UK",
    language: "en",
    isActive: true,
    categories: ["human-rights", "middle-east", "palestine", "politics"],
    scrapeConfig: {
      titleSelector: "h1, .article-title",
      contentSelector: ".article-content, .field-name-body",
      linkSelector: "a[href*='/news/']",
      imageSelector: ".article-image img",
      dateSelector: ".article-date, time"
    }
  },
  {
    name: "Al Jazeera - Human Rights",
    url: "https://www.aljazeera.com/topics/subjects/human-rights.html",
    baseUrl: "https://www.aljazeera.com",
    country: "Qatar",
    language: "en",
    isActive: true,
    categories: ["human-rights", "middle-east", "africa", "south-asia", "politics"],
    scrapeConfig: {
      titleSelector: "h1, .article-title",
      contentSelector: ".article-content, .wysiwyg",
      linkSelector: "a[href*='/news/']",
      imageSelector: ".article-image img, .responsive-image",
      dateSelector: ".article-date, .date-simple, time"
    }
  },
  {
    name: "Reuters - Human Rights",
    url: "https://www.reuters.com/world/human-rights/",
    baseUrl: "https://www.reuters.com",
    country: "International",
    language: "en",
    isActive: true,
    categories: ["human-rights", "politics", "middle-east", "south-asia", "africa", "europe", "americas"],
    scrapeConfig: {
      titleSelector: "h1, .ArticleHeader_headline",
      contentSelector: ".ArticleBody_body, .StandardArticleBody_body",
      linkSelector: "a[href*='/world/']",
      imageSelector: ".Media_image img, .ArticleMedia_image img",
      dateSelector: ".ArticleHeader_date, time"
    }
  },
  {
    name: "BBC - Human Rights",
    url: "https://www.bbc.com/news/topics/c77jz3md7q4t/human-rights",
    baseUrl: "https://www.bbc.com",
    country: "UK",
    language: "en",
    isActive: true,
    categories: ["human-rights", "politics", "middle-east", "south-asia", "africa", "europe"],
    scrapeConfig: {
      titleSelector: "h1, .story-headline",
      contentSelector: ".story-body, .article-body",
      linkSelector: "a[href*='/news/']",
      imageSelector: ".story-image img, .article-image img",
      dateSelector: ".story-date, .article-date, time"
    }
  }
];

async function addHumanRightsSources() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📰 Adding human rights sources...');
    
    for (const sourceData of humanRightsSources) {
      try {
        // Check if source already exists
        const existingSource = await Source.findOne({ 
          $or: [
            { name: sourceData.name },
            { url: sourceData.url }
          ]
        });

        if (existingSource) {
          console.log(`⚠️  Source "${sourceData.name}" already exists, updating...`);
          await Source.findByIdAndUpdate(existingSource._id, sourceData);
          console.log(`✅ Updated: ${sourceData.name}`);
        } else {
          const source = new Source(sourceData);
          await source.save();
          console.log(`✅ Added: ${sourceData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${sourceData.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary of all sources:');
    const allSources = await Source.find({ isActive: true });
    allSources.forEach(source => {
      console.log(`   ${source.name} (${source.country}) - ${source.categories.join(', ')}`);
    });

    console.log(`\n🎉 Total active sources: ${allSources.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
addHumanRightsSources().then(() => {
  console.log('🎉 Human rights sources setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
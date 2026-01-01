require('dotenv').config();
const database = require('../config/database');
const Source = require('../models/Source');

const sources = [
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/news/',
    baseUrl: 'https://www.aljazeera.com',
    country: 'Qatar',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .article-header__title',
      contentSelector: '.wysiwyg, .article-body',
      authorSelector: '.author-name, .byline',
      dateSelector: '.date-simple, time',
      imageSelector: '.article-featured-image img, .responsive-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['middle-east', 'africa', 'south-asia', 'politics', 'general']
  },
  {
    name: 'Middle East Eye',
    url: 'https://www.middleeasteye.net/news',
    baseUrl: 'https://www.middleeasteye.net',
    country: 'UK',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .article-title',
      contentSelector: '.field-name-body, .article-content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: '.article-image img, .field-name-field-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['middle-east', 'palestine', 'politics', 'culture', 'general']
  },
  {
    name: 'The New Arab',
    url: 'https://www.newarab.com/news',
    baseUrl: 'https://www.newarab.com',
    country: 'UK',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .article-title',
      contentSelector: '.article-body, .content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: '.article-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['middle-east', 'africa', 'culture', 'politics', 'general']
  },
  {
    name: 'Islamic Society of North America',
    url: 'https://www.isna.net/news/',
    baseUrl: 'https://www.isna.net',
    country: 'USA',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .entry-title',
      contentSelector: '.entry-content, .post-content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: '.featured-image img, .post-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['americas', 'community', 'culture', 'education', 'general']
  },
  {
    name: 'Muslim News',
    url: 'https://muslimnews.co.uk/news/',
    baseUrl: 'https://muslimnews.co.uk',
    country: 'UK',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.entry-title, .post-title a',
      contentSelector: '.entry-content p',
      authorSelector: '.meta-author, .author',
      dateSelector: '.meta-date, .date',
      imageSelector: '.featured-image img, .article-image img',
      linkSelector: 'h2.post-title a, h3.post-title a, .post-title a'
    },
    categories: ['europe', 'community', 'culture', 'politics', 'general']
  },
  {
    name: 'Anadolu Agency',
    url: 'https://www.aa.com.tr/en/world',
    baseUrl: 'https://www.aa.com.tr',
    country: 'Turkey',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .detay-spot',
      contentSelector: '.detay-icerik, .article-content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: '.detay-resim img, .article-image img',
      linkSelector: 'a[href*="/en/"]'
    },
    categories: ['middle-east', 'europe', 'politics', 'economics', 'general']
  },
  {
    name: 'Dawn News',
    url: 'https://www.dawn.com/news',
    baseUrl: 'https://www.dawn.com',
    country: 'Pakistan',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .story__title',
      contentSelector: '.story__content, .story-detail',
      authorSelector: '.story__byline, .author',
      dateSelector: '.story__time, .date',
      imageSelector: '.story__cover img, .lead-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['south-asia', 'politics', 'economics', 'culture', 'general']
  },
  {
    name: 'Jakarta Post',
    url: 'https://www.thejakartapost.com/news',
    baseUrl: 'https://www.thejakartapost.com',
    country: 'Indonesia',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .post-title',
      contentSelector: '.post-content, .article-content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: '.featured-image img, .post-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['southeast-asia', 'politics', 'economics', 'community', 'general']
  }
  ,
  {
    name: 'TRT World',
    url: 'https://www.trtworld.com/news',
    baseUrl: 'https://www.trtworld.com',
    country: 'Turkey',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.article-title, .title',
      contentSelector: '.article-content, .content',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: 'figure img, .image img',
      linkSelector: 'a[href*="/news/"], a[href*="/opinion/"]'
    },
    categories: ['middle-east', 'politics', 'general']
  },
  {
    name: 'Arab News',
    url: 'https://www.arabnews.com/middle-east',
    baseUrl: 'https://www.arabnews.com',
    country: 'Saudi Arabia',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1, .article-header',
      contentSelector: '.article-body, .field-name-body',
      authorSelector: '.author-name',
      dateSelector: '.date-display-single',
      imageSelector: '.main-image img, figure img',
      linkSelector: 'a[href*="/node/"]'
    },
    categories: ['middle-east', 'politics', 'culture']
  },
  {
    name: 'Al Araby',
    url: 'https://www.newarab.com/news',
    baseUrl: 'https://www.newarab.com',
    country: 'UK',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.title',
      contentSelector: '.body-content',
      authorSelector: '.author',
      dateSelector: 'time',
      imageSelector: '.hero-image img',
      linkSelector: 'a[href*="/news/"]'
    },
    categories: ['middle-east', 'palestine', 'politics']
  },
  {
    name: 'Palestine Chronicle',
    url: 'https://www.palestinechronicle.com/category/news/',
    baseUrl: 'https://www.palestinechronicle.com',
    country: 'USA',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      authorSelector: '.author-name',
      dateSelector: '.entry-date',
      imageSelector: '.post-thumbnail img',
      linkSelector: 'h3.entry-title a'
    },
    categories: ['palestine', 'politics', 'middle-east']
  },
  {
    name: 'Daily Sabah',
    url: 'https://www.dailysabah.com/mideast',
    baseUrl: 'https://www.dailysabah.com',
    country: 'Turkey',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.main_title',
      contentSelector: '.article_body',
      authorSelector: '.daily-reporter',
      dateSelector: '.date_time',
      imageSelector: '.main_image img',
      linkSelector: '.widget_content a'
    },
    categories: ['middle-east', 'politics', 'europe']
  }
];

async function seedSources() {
  try {
    await database.connect();
    console.log('🌱 Starting source seeding process...');

    // Clear existing sources
    await Source.deleteMany({});
    console.log('🗑️  Cleared existing sources');

    // Insert new sources
    await Source.insertMany(sources);
    console.log(`✅ Inserted ${sources.length} sources successfully`);

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sources:', error);
    await database.disconnect();
    process.exit(1);
  }
}

seedSources();
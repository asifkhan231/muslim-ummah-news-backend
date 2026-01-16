require('dotenv').config();
const database = require('../config/database');
const Source = require('../src/models/Source');

const sources = [
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/news/',
    baseUrl: 'https://www.aljazeera.com',
    country: 'Qatar',
    language: 'en',
    scrapeConfig: {
      // Updated selectors based on browser inspection
      titleSelector: 'h3.gc__title, .article-card__title, span.article-card__title',
      contentSelector: '.wysiwyg, .article-body, .txt-body', // txt-body is common in AJ
      authorSelector: '.author-link, .article-header-author',
      dateSelector: '.gc__date__date, .screen-reader-text',
      imageSelector: '.article-card__image-wrap img, .responsive-image img, figure img',
      linkSelector: 'a.u-clickable-card__link, a.article-card__link, a[href^="/news/20"]' // catch both card links and standard news links
    },
    categories: ['middle-east', 'africa', 'south-asia', 'politics', 'general']
  },
  {
    name: 'Al Jazeera China',
    url: 'https://www.aljazeera.com/where/asia-pacific/china/',
    baseUrl: 'https://www.aljazeera.com',
    country: 'China',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h3.gc__title, .article-card__title',
      contentSelector: '.wysiwyg, .article-body',
      authorSelector: '.author-link',
      dateSelector: '.gc__date__date',
      imageSelector: '.article-card__image-wrap img',
      linkSelector: 'a.u-clickable-card__link, a.article-card__link'
    },
    categories: ['asia', 'politics', 'human-rights']
  },
  {
    name: 'Al Jazeera Sudan',
    url: 'https://www.aljazeera.com/where/africa/sudan/',
    baseUrl: 'https://www.aljazeera.com',
    country: 'Sudan',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h3.gc__title, .article-card__title',
      contentSelector: '.wysiwyg, .article-body',
      authorSelector: '.author-link',
      dateSelector: '.gc__date__date',
      imageSelector: '.article-card__image-wrap img',
      linkSelector: 'a.u-clickable-card__link, a.article-card__link'
    },
    categories: ['africa', 'politics', 'human-rights']
  },
  {
    name: 'TRT World',
    url: 'https://www.trtworld.com/news',
    baseUrl: 'https://www.trtworld.com',
    country: 'Turkey',
    language: 'en',
    scrapeConfig: {
      // TRT uses unique link patterns, title is often inside the link or adjacent
      titleSelector: 'h1.article-title',
      contentSelector: '.article-content, .content, #article-body',
      authorSelector: '.author, .byline',
      dateSelector: '.date, time',
      imageSelector: 'figure img, .image img',
      linkSelector: 'a[href^="/article/"]'
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
  },
  {
    name: 'RFA Uyghur',
    url: 'https://www.rfa.org/english/news/uyghur',
    baseUrl: 'https://www.rfa.org',
    country: 'China',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1',
      contentSelector: '#storytext, .story-text',
      authorSelector: '.byline',
      dateSelector: '#story_date, .date',
      imageSelector: '#story_image img, .story-image img',
      linkSelector: 'a[href*="/english/news/uyghur/"]'
    },
    categories: ['asia', 'human-rights', 'politics']
  },
  {
    name: 'The Muslim Vibe',
    url: 'https://themuslimvibe.com/category/muslim-community',
    baseUrl: 'https://themuslimvibe.com',
    country: 'UK',
    language: 'en',
    scrapeConfig: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      authorSelector: '.author-name',
      dateSelector: '.date',
      imageSelector: '.featured-image img',
      linkSelector: 'h3.entry-title a, .entry-title a'
    },
    categories: ['community', 'culture', 'achievements']
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
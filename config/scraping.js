class ScrapingConfig {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.requestTimeout = parseInt(process.env.SCRAPE_TIMEOUT) || 10000;
    this.delayBetweenRequests = parseInt(process.env.SCRAPE_DELAY) || 2000;
    this.maxArticlesPerSource = parseInt(process.env.MAX_ARTICLES_PER_SOURCE) || 20;
    this.scrapeIntervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS) || 6;
    this.retryAttempts = parseInt(process.env.SCRAPE_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.SCRAPE_RETRY_DELAY) || 5000;
  }

  // HTTP request configuration
  getRequestConfig(url) {
    return {
      url,
      timeout: this.requestTimeout,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    };
  }

  // Categories configuration
  getCategories() {
    return {
      regional: [
        'palestine', 'middle-east', 'south-asia', 'southeast-asia', 
        'africa', 'europe', 'americas'
      ],
      thematic: [
        'community', 'culture', 'economics', 'politics', 
        'education', 'technology', 'health', 'sports'
      ],
      all: [
        'palestine', 'middle-east', 'south-asia', 'southeast-asia', 
        'africa', 'europe', 'americas', 'community', 'culture', 
        'economics', 'politics', 'education', 'technology', 
        'health', 'sports', 'general'
      ]
    };
  }

  // Keywords for categorization
  getCategoryKeywords() {
    return {
      // Regional keywords
      palestine: ['palestine', 'gaza', 'west bank', 'palestinian', 'jerusalem'],
      'middle-east': [
        'sudan', 'egypt', 'syria', 'yemen', 'lebanon', 'jordan', 'iraq', 
        'iran', 'turkey', 'saudi', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman'
      ],
      'south-asia': [
        'pakistan', 'india', 'bangladesh', 'afghanistan', 'maldives', 
        'sri lanka', 'kashmir', 'karachi', 'lahore', 'dhaka', 'kabul'
      ],
      'southeast-asia': [
        'indonesia', 'malaysia', 'brunei', 'singapore', 'thailand', 
        'philippines', 'jakarta', 'kuala lumpur', 'mindanao'
      ],
      africa: [
        'nigeria', 'morocco', 'algeria', 'tunisia', 'libya', 'somalia', 
        'senegal', 'mali', 'chad', 'niger', 'sudan', 'egypt', 'ethiopia'
      ],
      europe: [
        'france', 'germany', 'uk', 'britain', 'netherlands', 'bosnia', 
        'albania', 'kosovo', 'belgium', 'sweden', 'norway', 'denmark'
      ],
      americas: [
        'usa', 'america', 'canada', 'brazil', 'argentina', 'mexico', 
        'united states', 'toronto', 'new york', 'california'
      ],

      // Thematic keywords
      culture: [
        'mosque', 'islamic culture', 'ramadan', 'hajj', 'eid', 'quran', 
        'hadith', 'islamic art', 'calligraphy', 'architecture', 'festival'
      ],
      community: [
        'community', 'charity', 'volunteer', 'social work', 'interfaith', 
        'integration', 'diversity', 'outreach', 'humanitarian', 'relief'
      ],
      economics: [
        'economy', 'business', 'trade', 'finance', 'investment', 'halal', 
        'islamic banking', 'sukuk', 'startup', 'entrepreneur', 'market'
      ],
      education: [
        'education', 'university', 'school', 'student', 'scholarship', 
        'madrasa', 'islamic education', 'research', 'academic', 'learning'
      ],
      technology: [
        'technology', 'innovation', 'startup', 'digital', 'app', 'ai', 
        'blockchain', 'fintech', 'software', 'internet', 'mobile'
      ],
      health: [
        'health', 'medical', 'hospital', 'doctor', 'medicine', 'healthcare', 
        'pandemic', 'vaccine', 'treatment', 'wellness', 'mental health'
      ],
      sports: [
        'sport', 'football', 'cricket', 'olympics', 'athlete', 'soccer', 
        'basketball', 'tennis', 'championship', 'tournament', 'fifa'
      ],
      politics: [
        'politics', 'government', 'election', 'policy', 'parliament', 
        'minister', 'president', 'democracy', 'voting', 'campaign'
      ],
      tragedy: [
        'killed', 'death', 'died', 'murder', 'massacre', 'bombing', 'attack', 
        'violence', 'persecution', 'genocide', 'torture', 'detention', 'prison',
        'arrest', 'raid', 'strike', 'war', 'conflict', 'crisis', 'disaster',
        'tragedy', 'victim', 'casualty', 'injured', 'wounded', 'suffering'
      ]
    };
  }

  // Tags for content classification
  getContentTags() {
    return [
      // Identity & Religion
      'muslim', 'islamic', 'ummah', 'community', 'religion', 'faith',
      
      // Religious Practices
      'mosque', 'prayer', 'halal', 'ramadan', 'eid', 'hajj', 'quran', 'hadith',
      
      // Positive Themes
      'achievement', 'success', 'innovation', 'leadership', 'youth', 'women',
      'progress', 'development', 'growth', 'breakthrough', 'award', 'recognition',
      
      // Social Themes
      'education', 'technology', 'business', 'politics', 'health', 'sports',
      'culture', 'art', 'literature', 'science', 'research', 'scholarship',
      
      // Community Themes
      'charity', 'volunteer', 'interfaith', 'diversity', 'integration',
      'cooperation', 'unity', 'solidarity', 'peace', 'dialogue',
      
      // Global Themes
      'international', 'global', 'worldwide', 'cooperation', 'diplomacy',
      'trade', 'partnership', 'alliance', 'summit', 'conference'
    ];
  }

  // Cron schedule for scraping
  getCronSchedule() {
    return `0 */2 * * *`;
  }

  // Validation rules for sources
  getSourceValidationRules() {
    return {
      required: ['name', 'url', 'scrapeConfig'],
      scrapeConfigRequired: ['titleSelector', 'contentSelector', 'linkSelector'],
      urlPattern: /^https?:\/\/.+/,
      maxNameLength: 100,
      maxUrlLength: 500
    };
  }
}

module.exports = new ScrapingConfig();
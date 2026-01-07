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
        'education', 'technology', 'health', 'sports',
        'human-rights', 'conflict', 'persecution'
      ],
      all: [
        'palestine', 'middle-east', 'south-asia', 'southeast-asia', 
        'africa', 'europe', 'americas', 'community', 'culture', 
        'economics', 'politics', 'education', 'technology', 
        'health', 'sports', 'human-rights', 'conflict', 'persecution', 'general'
      ]
    };
  }

  // Keywords for categorization
  getCategoryKeywords() {
    return {
      // Regional keywords - Order matters! More specific first
      'middle-east': [
        'sudan', 'egypt', 'syria', 'yemen', 'lebanon', 'jordan', 'iraq', 
        'iran', 'turkey', 'saudi', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman',
        'middle east', 'arab', 'gulf', 'levant', 'syria', 'syrian'
      ],
      'south-asia': [
        'pakistan', 'india', 'bangladesh', 'afghanistan', 'maldives', 
        'sri lanka', 'kashmir', 'karachi', 'lahore', 'dhaka', 'kabul',
        'south asia', 'indian subcontinent', 'pakistani', 'indian', 'afghan'
      ],
      'southeast-asia': [
        'indonesia', 'malaysia', 'brunei', 'singapore', 'thailand', 
        'philippines', 'jakarta', 'kuala lumpur', 'mindanao',
        'southeast asia', 'asean', 'indonesian', 'malaysian'
      ],
      africa: [
        'nigeria', 'morocco', 'algeria', 'tunisia', 'libya', 'somalia', 
        'senegal', 'mali', 'chad', 'niger', 'ethiopia', 'kenya', 'uganda',
        'african', 'sahel', 'maghreb', 'nigerian', 'moroccan', 'algerian'
      ],
      europe: [
        'france', 'germany', 'uk', 'britain', 'netherlands', 'bosnia', 
        'albania', 'kosovo', 'belgium', 'sweden', 'norway', 'denmark',
        'european', 'balkans', 'ukraine', 'russia', 'ukrainian', 'russian',
        'poland', 'italy', 'spain', 'austria', 'switzerland'
      ],
      americas: [
        'usa', 'america', 'canada', 'brazil', 'argentina', 'mexico', 
        'united states', 'toronto', 'new york', 'california',
        'american', 'north america', 'south america', 'venezuela', 'venezuelan',
        'colombia', 'peru', 'chile', 'washington', 'trump'
      ],

      // Thematic keywords - More specific
      politics: [
        'election', 'government', 'parliament', 'minister', 'president', 
        'prime minister', 'policy', 'democracy', 'voting', 'campaign',
        'political', 'governance', 'legislation', 'diplomatic', 'diplomacy',
        'foreign policy', 'international relations', 'summit', 'treaty',
        'sanctions', 'embargo', 'regime', 'opposition', 'coalition'
      ],
      economics: [
        'economy', 'business', 'trade', 'finance', 'investment', 'halal industry', 
        'islamic banking', 'sukuk', 'startup', 'entrepreneur', 'market',
        'economic', 'financial', 'commercial', 'gdp', 'inflation',
        'stock market', 'banking', 'currency', 'export', 'import'
      ],
      technology: [
        'technology', 'innovation', 'startup', 'digital', 'app', 'ai', 
        'blockchain', 'fintech', 'software', 'internet', 'mobile',
        'tech', 'artificial intelligence', 'cybersecurity', 'data',
        'computer', 'smartphone', 'social media', 'platform', 'algorithm'
      ],
      education: [
        'education', 'university', 'school', 'student', 'scholarship', 
        'madrasa', 'islamic education', 'research', 'academic', 'learning',
        'educational', 'curriculum', 'literacy', 'graduation',
        'college', 'professor', 'teacher', 'study', 'degree'
      ],
      health: [
        'health', 'medical', 'hospital', 'doctor', 'medicine', 'healthcare', 
        'pandemic', 'vaccine', 'treatment', 'wellness', 'mental health',
        'healthcare', 'clinic', 'surgery', 'therapy', 'disease',
        'virus', 'infection', 'patient', 'nurse', 'pharmaceutical'
      ],
      sports: [
        'sport', 'football', 'cricket', 'olympics', 'athlete', 'soccer', 
        'basketball', 'tennis', 'championship', 'tournament', 'fifa',
        'sporting', 'athletic', 'competition', 'match', 'game',
        'world cup', 'league', 'team', 'player', 'coach'
      ],
      culture: [
        'mosque', 'islamic culture', 'ramadan', 'hajj', 'eid', 'quran', 
        'hadith', 'islamic art', 'calligraphy', 'architecture', 'festival',
        'cultural', 'heritage', 'tradition', 'celebration', 'religion',
        'religious', 'faith', 'spiritual', 'prayer', 'worship'
      ],
      community: [
        'community', 'charity', 'volunteer', 'social work', 'interfaith', 
        'integration', 'diversity', 'outreach', 'humanitarian', 'relief',
        'social', 'welfare', 'activism', 'civil society', 'nonprofit',
        'organization', 'foundation', 'donation', 'fundraising', 'support'
      ],
      
      // Palestine - More specific keywords to avoid over-categorization
      palestine: [
        'palestine', 'palestinian', 'gaza strip', 'west bank', 'jerusalem occupation',
        'israeli occupation', 'gaza war', 'palestinian authority', 'hamas',
        'fatah', 'intifada', 'settler', 'checkpoint', 'blockade', 'gaza',
        'israeli', 'israel', 'occupied territories', 'palestinian state'
      ],

      // Professional journalistic categories for serious violations
      'human-rights': [
        // International legal terms
        'human rights violation', 'human rights abuse', 'civil rights',
        'fundamental rights', 'constitutional rights', 'legal rights',
        'discrimination', 'systematic discrimination', 'institutional racism',
        'religious freedom', 'freedom of expression', 'freedom of assembly',
        
        // International law violations
        'international law', 'geneva convention', 'war crimes tribunal',
        'international criminal court', 'crimes against humanity',
        'universal declaration', 'human rights council',
        
        // Specific violations
        'arbitrary detention', 'unlawful detention', 'political prisoner',
        'prisoner of conscience', 'extrajudicial execution', 'enforced disappearance',
        'torture', 'cruel treatment', 'inhuman treatment', 'degrading treatment',
        'persecution', 'religious persecution', 'ethnic persecution'
      ],
      
      conflict: [
        // Armed conflict terminology
        'armed conflict', 'military operation', 'security operation',
        'counterterrorism', 'anti-terrorism', 'military intervention',
        'peacekeeping', 'ceasefire', 'armistice', 'peace agreement',
        
        // Conflict zones and situations
        'occupied territory', 'disputed territory', 'buffer zone',
        'demilitarized zone', 'no-fly zone', 'siege', 'blockade',
        'military checkpoint', 'border crossing', 'refugee camp',
        
        // Military actions
        'airstrike', 'ground offensive', 'military raid', 'security raid',
        'military incursion', 'cross-border', 'shelling', 'bombardment',
        'drone strike', 'targeted killing', 'collateral damage'
      ],
      
      persecution: [
        // Systematic oppression
        'systematic oppression', 'state persecution', 'government crackdown',
        'authoritarian rule', 'police state', 'surveillance state',
        'mass surveillance', 'digital surveillance', 'facial recognition',
        
        // Specific persecution methods
        'mass detention', 'concentration camp', 'internment camp',
        'reeducation camp', 'forced labor', 'forced sterilization',
        'cultural genocide', 'linguistic suppression', 'religious suppression',
        
        // Ethnic and religious targeting
        'ethnic cleansing', 'ethnic targeting', 'religious targeting',
        'minority rights', 'indigenous rights', 'tribal rights',
        'sectarian violence', 'communal violence', 'hate crime',
        
        // Displacement and migration
        'forced displacement', 'mass displacement', 'population transfer',
        'deportation', 'expulsion', 'ethnic migration', 'refugee crisis',
        'internally displaced persons', 'stateless persons'
      ],
      
      // Remove old "tragedy" category - replace with above professional terms
    };
  }

  // Tags for content classification - MUSLIM-FOCUSED
  getContentTags() {
    return [
      // Identity & Religion - Core Muslim identifiers
      'muslim', 'islamic', 'islam', 'ummah', 'community', 'religion', 'faith',
      'muslims', 'islamist', 'islamists', 'muslim community', 'islamic community',
      
      // Religious Practices & Institutions
      'mosque', 'masjid', 'prayer', 'salah', 'halal', 'haram', 'ramadan', 'eid', 
      'hajj', 'umrah', 'quran', 'hadith', 'sharia', 'imam', 'mullah', 'sheikh',
      
      // Specific Muslim Groups & Minorities
      'uyghur', 'uighur', 'rohingya', 'palestinian', 'kashmiri', 'bosnian muslim',
      'yazidi', 'ahmadi', 'shia', 'sunni', 'sufi', 'muslim minority', 'muslim majority',
      
      // Geographic Muslim Communities
      'gaza', 'west bank', 'xinjiang', 'kashmir', 'bosnia', 'chechnya', 'mindanao',
      'muslim world', 'islamic world', 'middle east', 'arab world', 'maghreb',
      
      // Organizations & Movements
      'islamic state', 'taliban', 'hamas', 'hezbollah', 'muslim brotherhood',
      'islamic society', 'muslim council', 'islamic center', 'muslim association',
      
      // Issues Affecting Muslims
      'islamophobia', 'anti-muslim', 'muslim persecution', 'religious persecution',
      'ethnic cleansing', 'genocide', 'discrimination', 'hate crime', 'bias incident',
      
      // Positive Muslim Themes
      'muslim achievement', 'islamic finance', 'halal industry', 'muslim entrepreneur',
      'islamic art', 'muslim scientist', 'islamic scholarship', 'muslim leader'
    ];
  }

  // Cron schedule for scraping
  getCronSchedule() {
    return `* */3 * * *`;
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
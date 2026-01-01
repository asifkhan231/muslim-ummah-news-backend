const axios = require('axios');
const cheerio = require('cheerio');
const scrapingConfig = require('../../config/scraping');
const articleService = require('./articleService');
const sourceService = require('./sourceService');
const aiRefinementService = require('./aiServices');

class ScrapingService {
  constructor() {
    this.userAgent = scrapingConfig.userAgent;
    this.requestTimeout = scrapingConfig.requestTimeout;
    this.delayBetweenRequests = scrapingConfig.delayBetweenRequests;
    this.maxArticlesPerSource = scrapingConfig.maxArticlesPerSource;
    this.categoryKeywords = scrapingConfig.getCategoryKeywords();
    this.contentTags = scrapingConfig.getContentTags();
  }

  async scrapeAllSources() {
    const sources = await sourceService.getActiveSources();
    let totalArticles = 0;

    console.log(`Starting scraping for ${sources.length} sources...`);

    for (const source of sources) {
      try {
        const count = await this.scrapeSource(source);
        totalArticles += count;

        // Add delay between sources to be respectful
        await this.delay(this.delayBetweenRequests);
      } catch (error) {
        console.error(`Error scraping source ${source.name}:`, error.message);
      }
    }

    console.log(`Scraping completed. Total new articles: ${totalArticles}`);
    return totalArticles;
  }

  async scrapeSource(source) {
    try {
      console.log(`Scraping ${source.name}...`);

      const response = await axios.get(source.url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      // Extract articles based on source configuration with better selectors
      let articleElements;

      if (source.name.includes('Al Jazeera')) {
        articleElements = $('a[href*="/news/"]').filter((i, el) => {
          const href = $(el).attr('href');
          return href && href.includes('/news/') && !href.includes('#') && href.length > 20;
        });
      } else if (source.name.includes('Middle East Eye')) {
        // For Middle East Eye, be more permissive
        articleElements = $('a[href*="/news/"]').filter((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();

          return href &&
            text &&
            href.includes('/news/') &&
            !href.includes('#') &&
            text.length > 5;
        });
      } else if (source.name.includes('New Arab')) {
        // For The New Arab, look for actual article links
        articleElements = $('a').filter((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();

          if (!href || !text) return false;

          // Look for actual article URLs with meaningful slugs
          const hasNewsInPath = href.includes('/news/');
          const isSpecificArticle = href.match(/\/news\/[a-z0-9-]+/) && // Has article slug
            !href.match(/\/news\/(mena|world|economy|energy|health|sports|offbeat|environment)$/); // Not category page
          const hasGoodText = text.length > 20 &&
            !text.includes('Menu') &&
            !text.includes('Show —') &&
            !text.includes('Hide —') &&
            !text.match(/^(MENA|World|Economy|Energy|Health|Sports|Environment|Offbeat|Analysis|Opinion|Features|Investigations)$/);

          return hasNewsInPath && isSpecificArticle && hasGoodText;
        });
      } else if (source.name.includes('Muslim News')) {
        // For Muslim News, avoid pagination and category pages
        articleElements = $('a').filter((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();

          if (!href || !text) return false;

          // Avoid pagination pages, category pages, and generic links
          const isNotPagination = !href.includes('/page/') && !href.includes('/category/');
          const isNotGeneric = !href.match(/\/(news|home|about|contact|subscribe)\/?\s*$/);
          const hasSpecificSlug = href.match(/\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\//) || // Date-based URLs
            href.match(/\/[a-z0-9-]{10,}\/?$/) || // Long slug URLs (optional trailing slash)
            href.includes('/news/news/'); // Specific pattern seen on site
          const hasGoodText = text.length > 30 &&
            !text.includes('Page ') &&
            !text.includes(' of ') &&
            !text.includes('Muslim News UK') &&
            !text.includes('News -') &&
            !text.match(/^(Home|News|About|Contact|Subscribe|Categories)$/i);

          return isNotPagination && isNotGeneric && hasSpecificSlug && hasGoodText;
        });
      } else {
        // Generic selector for other sources
        articleElements = $(source.scrapeConfig.linkSelector || 'a[href*="article"], a[href*="news"], a[href*="/20"]');
      }

      console.log(`  Found ${articleElements.length} potential article links`);

      // Debug: Show first few URLs for The New Arab
      if (source.name.includes('New Arab') && articleElements.length > 0) {
        console.log('  Sample URLs found:');
        for (let i = 0; i < Math.min(5, articleElements.length); i++) {
          const href = $(articleElements[i]).attr('href');
          const text = $(articleElements[i]).text().trim().substring(0, 50);
          console.log(`    ${i + 1}. ${href} - "${text}..."`);
        }
      }

      const maxArticles = Math.min(articleElements.length, this.maxArticlesPerSource);
      let processedCount = 0;

      for (let i = 0; i < maxArticles && processedCount < 5; i++) { // Limit to 5 articles per source for testing
        const element = articleElements[i];
        const articleUrl = this.resolveUrl($(element).attr('href'), source.baseUrl || source.url);

        if (articleUrl && !await this.articleExists(articleUrl)) {
          console.log(`  Processing article ${processedCount + 1}/${Math.min(maxArticles, 5)}`);
          const articleData = await this.scrapeArticle(articleUrl, source);
          if (articleData) {
            articles.push(articleData);
          }
          processedCount++;

          // Add delay between articles
          await this.delay(1000);
        }
      }

      // Save articles to database
      if (articles.length > 0) {
        await this.saveArticles(articles);
        console.log(`✅ Saved ${articles.length} new articles from ${source.name}`);
      } else {
        console.log(`⚠️  No new articles found for ${source.name}`);
      }

      // Update source last scraped time
      await sourceService.updateLastScraped(source._id, articles.length);

      return articles.length;
    } catch (error) {
      console.error(`❌ Error scraping ${source.name}:`, error.message);
      return 0;
    }
  }

  extractVideo($) {
    // Try multiple video selectors with better detection
    const videoSelectors = [
      'meta[property="og:video"]',
      'meta[property="og:video:url"]',
      'meta[property="og:video:secure_url"]',
      'meta[name="twitter:player"]',
      'meta[name="twitter:player:stream"]',
      // Common video containers
      '.video-player iframe',
      '.video-container iframe',
      '.article-video iframe',
      '.media-player iframe',
      'figure.video iframe',
      // Specific platform embeds
      'iframe[src*="youtube.com"]',
      'iframe[src*="youtu.be"]',
      'iframe[src*="vimeo.com"]',
      'iframe[src*="dailymotion.com"]',
      'iframe[src*="facebook.com/plugins/video"]',
      // HTML5 Video
      'video source',
      'video'
    ];

    for (const sel of videoSelectors) {
      let videoSrc = null;

      if (sel.startsWith('meta')) {
        videoSrc = $(sel).attr('content');
      } else if (sel.includes('iframe')) {
        const iframe = $(sel).first();
        videoSrc = iframe.attr('src');
      } else if (sel.includes('video')) {
        const video = $(sel).first();
        videoSrc = video.attr('src');
      }

      if (videoSrc && videoSrc.length > 10) {
        // Clean up URL if needed
        if (videoSrc.startsWith('//')) {
          videoSrc = 'https:' + videoSrc;
        }
        return videoSrc;
      }
    }

    return null;
  }

  async scrapeArticle(url, source) {
    try {
      console.log(`  -> Scraping article: ${url}`);

      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const $ = cheerio.load(response.data);

      // Extract article data with debugging
      const title = this.extractText($, source.scrapeConfig.titleSelector || 'h1, .title, .headline');
      console.log(`     Title: ${title ? title.substring(0, 50) + '...' : 'NOT FOUND'}`);

      const content = this.extractContent($, source.scrapeConfig.contentSelector);
      console.log(`     Content length: ${content ? content.length : 0} characters`);

      const author = this.extractText($, source.scrapeConfig.authorSelector || '.author, .byline');
      const imageUrl = this.extractImage($, source.scrapeConfig.imageSelector || 'img');
      const videoUrl = this.extractVideo($);

      console.log(`     Image: ${imageUrl ? 'Found' : 'Not found'}`);
      console.log(`     Video: ${videoUrl ? 'Found' : 'Not found'}`);

      if (!title) {
        console.log(`     ❌ Skipping - no title found`);
        return null;
      }

      // Skip articles with generic or vague titles (Enhanced filter)
      const lowerTitle = title.toLowerCase();
      if (title.length < 20 ||
        title.split(' ').length < 4 || // Needs at least 4 words
        lowerTitle.includes('page not found') ||
        lowerTitle.includes('404 error') ||
        lowerTitle.includes('access denied') ||
        title === 'Anadolu Agency' ||
        title === 'Anadolu Ajansı' ||
        title === 'The Jakarta Post' ||
        title === 'Muslim News UK' ||
        title.includes('News - Page ') ||
        title.includes(' - Muslim News UK') ||
        title.includes(' - Page ') ||
        title.includes(' of ') ||
        lowerTitle === 'home' ||
        lowerTitle === 'news' ||
        lowerTitle.startsWith('issue ') ||
        lowerTitle.match(/^issue \d+/) ||
        lowerTitle.includes('issue 437') ||
        title.includes('Issue 437') ||
        lowerTitle.includes('po box 380')) {
        console.log(`     ❌ Skipping - generic, vague, or short title: ${title}`);
        return null;
      }

      // Check for content that is just address/contact info
      if (content && (
        content.includes('PO Box 380, Harrow') ||
        content.includes('Tel: +44 (0) 20 8863 8586') ||
        content.includes('Editor Ahmed J Versi')
      )) {
        console.log(`     ❌ Skipping - content appears to be contact info/footer`);
        return null;
      }

      if (!content || content === 'Content not available' || content.length < 200) { // Increased minimum length
        console.log(`     ⚠️  Warning - minimal content found (${content ? content.length : 0} chars)`);

        // Stricter check: if content is too short and no meta description, skip
        const metaDescription = $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') || '';

        if (!metaDescription || metaDescription.length < 50) {
          console.log(`     ❌ Skipping - content too short and no valid summary`);
          return null;
        }

        if (metaDescription && metaDescription.length > 50) {
          console.log(`     📝 Using meta description as content`);
        }
      }

      // Determine category based on content
      const category = this.categorizeArticle(title + ' ' + content);

      const resolvedVideoUrl = this.resolveUrl(videoUrl, source.baseUrl || source.url);

      let finalTitle = title;
      let finalContent = content;
      let aiFacts = [];
      let isAIEnhanced = false;
      let backgroundContext = '';
      
      // AI refinement for better content quality
      if (content && content.length > 300) {
        try {
          console.log('     🧠 Attempting AI refinement...');
          const aiResult = await aiRefinementService.refineArticle({
            title,
            content,
            source
          });

          if (aiResult?.refined_content && aiResult.refined_content.length > 200) {
            finalTitle = aiResult.refined_title || title;
            finalContent = aiResult.refined_content;
            aiFacts = aiResult.key_facts || [];
            backgroundContext = aiResult.background_context || '';
            isAIEnhanced = true;

            console.log('     ✅ AI refinement applied successfully');
          } else {
            console.log('     ⚠️  AI refinement skipped (insufficient improvement)');
          }

        } catch (error) {
          console.error('     ❌ AI refinement error:', error.message);
        }
      } else {
        console.log('     ⚠️  AI refinement skipped (content too short)');
      }
      const articleData = {
        title: finalTitle.length > 300 ? finalTitle.substring(0, 300) : finalTitle,
        content: finalContent,
        summary: finalContent.substring(0, 300) + '...',
        url,
        source: {
          name: source.name,
          url: source.url,
          country: source.country
        },
        author: author || 'Staff Writer',
        publishedAt: new Date(),
        category,
        tags: this.extractTags(finalTitle + ' ' + finalContent),
        imageUrl: this.resolveUrl(imageUrl, source.baseUrl || source.url),
        videoUrl: resolvedVideoUrl,
        hasVideo: !!resolvedVideoUrl,
        isAiInhanced: isAIEnhanced,
        aiFacts,
        background: backgroundContext
      };

      // Validate required fields before returning
      if (!articleData.title || !articleData.content || !articleData.url || !articleData.publishedAt) {
        console.log(`     ❌ Skipping - missing required fields: title=${!!articleData.title}, content=${!!articleData.content}, url=${!!articleData.url}, publishedAt=${!!articleData.publishedAt}`);
        return null;
      }

      // Ensure minimum content length
      if (articleData.content.length < 100) {
        console.log(`     ❌ Skipping - content too short (${articleData.content.length} chars)`);
        return null;
      }

      // Debug image URL resolution
      if (imageUrl) {
        console.log(`     Raw image URL: ${imageUrl}`);
        console.log(`     Base URL: ${source.baseUrl || source.url}`);
        console.log(`     Resolved image URL: ${articleData.imageUrl}`);
      }


      console.log(`     ✅ Article data extracted successfully`);
      return articleData;
    } catch (error) {
      console.error(`     ❌ Error scraping article ${url}:`, error.message);
      return null;
    }
  }

  extractText($, selector) {
    // Try multiple selectors for better title extraction
    const selectors = selector.split(',').map(s => s.trim());

    for (const sel of selectors) {
      const element = $(sel).first();
      const text = element.text().trim();
      if (text && text.length > 10 && text.split(' ').length > 1) { // Ensure multi-word titles
        return text;
      }
    }

    // Fallback to meta title
    const metaTitle = $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim();

    // Clean up meta title
    if (metaTitle) {
      const cleanTitle = metaTitle
        .replace(/\s*\|\s*.*$/, '') // Remove site name after |
        .replace(/\s*-\s*.*$/, '') // Remove site name after -
        .trim();

      if (cleanTitle.length > 10 && cleanTitle.split(' ').length > 1) {
        return cleanTitle;
      }
    }

    return metaTitle || '';
  }

  extractContent($, selectors) {
    // Try multiple content selectors in order of preference
    const contentSelectors = [
      '.field-name-body .field-item', // Middle East Eye specific
      '.field-name-field-body .field-item', // The New Arab specific
      '.post-content', '.entry-content', // Jakarta Post specific
      '.article-content', '.content-body', '.article-body', '.story-body',
      '.text-content', '.main-content', '.article-text',
      'article p', '.content p', 'main p'
    ];

    // If custom selectors provided, try them first
    if (selectors) {
      contentSelectors.unshift(...selectors.split(',').map(s => s.trim()));
    }

    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        let content = '';
        elements.each((i, el) => {
          const text = $(el).text().trim();
          // Filter out navigation, browser messages, and menu text more aggressively
          if (text.length > 50 &&
            !text.includes('Show —') &&
            !text.includes('Hide —') &&
            !text.includes('News Menu') &&
            !text.includes('News |') &&
            !text.includes('Live Story') &&
            !text.includes('MENA') &&
            !text.includes('Your browser is out of date') &&
            !text.includes('Just click on the icons') &&
            !text.includes('A list of the most popular web browsers') &&
            !text.match(/^\s*(Gaza War|Iran|Israel|Syria|Palestinian diaspora|Post-Assad Syria|Christmas)\s*$/) &&
            !text.match(/^\s*(MENA|World|Economy|Energy|Health|Sports|Environment|Offbeat)\s*$/) &&
            !text.match(/^\s*(Analysis|Opinion|Features|Investigations|Podcast|Video)\s*$/)) {
            content += text + '\n\n';
          }
        });

        if (content.length > 200) { // Ensure we have substantial content
          return content.trim();
        }
      }
    }

    // Fallback: get all paragraph text but filter better
    const paragraphs = $('p');
    let content = '';
    paragraphs.each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 &&
        !text.includes('Show —') &&
        !text.includes('Hide —') &&
        !text.includes('Menu') &&
        !text.includes('News |') &&
        !text.includes('Live Story') &&
        !text.includes('MENA') &&
        !text.includes('Your browser is out of date') &&
        !text.includes('Just click on the icons') &&
        !text.match(/^(Gaza War|Iran|Israel|Syria|Palestinian diaspora)/)) {
        content += text + '\n\n';
      }
    });

    return content.trim() || 'Content not available';
  }

  extractImage($, selector) {
    // Try multiple image selectors in order of preference
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.article-image img',
      '.featured-image img',
      '.post-image img',
      'article img',
      '.content img',
      'img[src*="wp-content"]',
      'img[src*="uploads"]',
      'img'
    ];

    // If custom selector provided, try it first
    if (selector && selector !== 'img') {
      imageSelectors.unshift(selector);
    }

    for (const sel of imageSelectors) {
      let imgSrc = null;

      if (sel.startsWith('meta')) {
        imgSrc = $(sel).attr('content');
      } else {
        const img = $(sel).first();
        imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
      }

      if (imgSrc && imgSrc.length > 10 && 
          !imgSrc.includes('logo') && 
          !imgSrc.includes('icon') &&
          !imgSrc.includes('favicon') &&
          !imgSrc.includes('placeholder') &&
          !imgSrc.endsWith('.svg')) {
        
        // Clean up the URL
        imgSrc = imgSrc.trim();
        
        // Remove query parameters that might break the image
        if (imgSrc.includes('?')) {
          const urlParts = imgSrc.split('?');
          const queryParams = urlParts[1];
          // Keep resize and quality parameters for better images
          if (queryParams.includes('resize') || queryParams.includes('quality') || queryParams.includes('w=') || queryParams.includes('h=')) {
            imgSrc = urlParts[0] + '?' + queryParams;
          } else {
            imgSrc = urlParts[0];
          }
        }
        
        console.log(`     Found image: ${imgSrc.substring(0, 80)}...`);
        return imgSrc;
      }
    }

    return null;
  }

  extractVideo($) {
    // Try multiple video selectors with better detection
    const videoSelectors = [
      'meta[property="og:video"]',
      'meta[property="og:video:url"]',
      'meta[property="og:video:secure_url"]',
      'meta[name="twitter:player"]',
      'meta[name="twitter:player:stream"]',
      // Common video containers
      '.video-player iframe',
      '.video-container iframe',
      '.article-video iframe',
      '.media-player iframe',
      'figure.video iframe',
      // Specific platform embeds
      'iframe[src*="youtube.com"]',
      'iframe[src*="youtu.be"]',
      'iframe[src*="vimeo.com"]',
      'iframe[src*="dailymotion.com"]',
      'iframe[src*="facebook.com/plugins/video"]',
      // HTML5 Video
      'video source',
      'video'
    ];

    for (const sel of videoSelectors) {
      let videoSrc = null;

      if (sel.startsWith('meta')) {
        videoSrc = $(sel).attr('content');
      } else if (sel.includes('iframe')) {
        const iframe = $(sel).first();
        videoSrc = iframe.attr('src');
      } else if (sel.includes('video')) {
        const video = $(sel).first();
        videoSrc = video.attr('src');
      }

      if (videoSrc && videoSrc.length > 10) {
        // Clean up URL if needed
        if (videoSrc.startsWith('//')) {
          videoSrc = 'https:' + videoSrc;
        }
        return videoSrc;
      }
    }

    return null;
  }

  categorizeArticle(text) {
    const lowerText = text.toLowerCase();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  extractTags(text) {
    const lowerText = text.toLowerCase();
    return this.contentTags.filter(tag => lowerText.includes(tag));
  }

  generateBetterSummary($, content, title, source) {
    // First, try to get a clean summary from meta tags
    const metaDescription = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content');

    // Check if meta description is actually article-specific (not generic site description)
    const isGenericDescription = metaDescription && (
      metaDescription.includes('Anadolu Ajansı') ||
      metaDescription.includes('your source for trusted news') ||
      metaDescription.includes('The Jakarta Post') ||
      metaDescription.includes('Business - The Jakarta Post') ||
      metaDescription.includes('Güvenilir haberin kaynağı') ||
      metaDescription.includes('Muslim News UK') ||
      metaDescription.includes('Page ') ||
      metaDescription.includes(' of ') ||
      metaDescription.toLowerCase().includes('latest news') ||
      metaDescription.toLowerCase().includes('breaking news') ||
      metaDescription.toLowerCase().includes('news website') ||
      metaDescription === title || // Meta description same as title
      metaDescription.length < 30 // Too short to be meaningful
    );

    if (metaDescription && metaDescription.length > 50 &&
      !metaDescription.includes('News |') &&
      !metaDescription.includes('Live Story') &&
      !metaDescription.includes('MENA') &&
      !metaDescription.includes('Your browser is out of date') &&
      !metaDescription.includes('Show —') &&
      !isGenericDescription) {
      return metaDescription.length > 300 ? metaDescription.substring(0, 300) + '...' : metaDescription;
    }

    // Source-specific summary extraction
    if (source.name.includes('Jakarta Post')) {
      // For Jakarta Post, try to find the actual article lead
      const leadSelectors = [
        '.post-content p:first-of-type',
        '.entry-content p:first-of-type',
        '.article-content p:first-of-type',
        'article p:first-of-type'
      ];

      for (const selector of leadSelectors) {
        const leadElement = $(selector).first();
        const leadText = leadElement.text().trim();
        if (leadText && leadText.length > 100 &&
          !leadText.includes('Your browser is out of date') &&
          !leadText.includes('Just click on the icons') &&
          !leadText.includes('The Jakarta Post') &&
          !leadText.includes('Business - The Jakarta Post')) {
          return leadText.length > 300 ? leadText.substring(0, 300) + '...' : leadText;
        }
      }

      // Try to extract from content if available
      if (content && content.length > 200) {
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.length > 100 &&
            !cleanPara.includes('Your browser is out of date') &&
            !cleanPara.includes('The Jakarta Post') &&
            !cleanPara.includes('Business - The Jakarta Post')) {
            return cleanPara.length > 300 ? cleanPara.substring(0, 300) + '...' : cleanPara;
          }
        }
      }
    }

    if (source.name.includes('Anadolu Agency')) {
      // For Anadolu Agency, try to get the first meaningful paragraph
      const leadSelectors = [
        '.detay-icerik p:first-of-type',
        '.article-content p:first-of-type',
        '.content p:first-of-type',
        'article p:first-of-type'
      ];

      for (const selector of leadSelectors) {
        const leadElement = $(selector).first();
        const leadText = leadElement.text().trim();
        if (leadText && leadText.length > 100 &&
          !leadText.includes('Anadolu Ajansı') &&
          !leadText.includes('Anadolu Agency') &&
          !leadText.includes('your source for trusted news') &&
          !leadText.includes('Güvenilir haberin kaynağı') &&
          !leadText.includes('AA.com.tr')) {
          return leadText.length > 300 ? leadText.substring(0, 300) + '...' : leadText;
        }
      }

      // Try to extract from content if available
      if (content && content.length > 200) {
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.length > 100 &&
            !cleanPara.includes('Anadolu Ajansı') &&
            !cleanPara.includes('Anadolu Agency') &&
            !cleanPara.includes('your source for trusted news') &&
            !cleanPara.includes('Güvenilir haberin kaynağı') &&
            !cleanPara.includes('AA.com.tr')) {
            return cleanPara.length > 300 ? cleanPara.substring(0, 300) + '...' : cleanPara;
          }
        }
      }
    }

    if (source.name.includes('New Arab')) {
      // For The New Arab, try to extract the first meaningful paragraph
      const leadSelectors = [
        '.field-name-field-lead p',
        '.article-lead p',
        '.intro-text p',
        '.article-intro p',
        '.field-name-body p:first-of-type',
        '.content p:first-of-type',
        'article p:first-of-type'
      ];

      for (const selector of leadSelectors) {
        const leadElement = $(selector).first();
        const leadText = leadElement.text().trim();
        if (leadText && leadText.length > 100 &&
          !leadText.includes('Live Story') &&
          !leadText.includes('MENA') &&
          !leadText.includes('Show —') &&
          !leadText.includes('News Menu')) {
          return leadText.length > 300 ? leadText.substring(0, 300) + '...' : leadText;
        }
      }

      // Try to extract from the first substantial paragraph in content
      if (content && content.length > 200) {
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.length > 100 &&
            !cleanPara.includes('Live Story') &&
            !cleanPara.includes('MENA') &&
            !cleanPara.includes('Show —') &&
            !cleanPara.includes('News Menu') &&
            !cleanPara.match(/^(Gaza War|Iran|Israel|Syria|Palestinian)/)) {
            return cleanPara.length > 300 ? cleanPara.substring(0, 300) + '...' : cleanPara;
          }
        }
      }
    }

    if (source.name.includes('Middle East Eye')) {
      // For Middle East Eye, try to extract the first meaningful paragraph
      const leadSelectors = [
        '.field-name-field-lead p',
        '.article-lead',
        '.intro-text',
        '.article-intro p',
        '.content p:first-of-type',
        'article p:first-of-type'
      ];

      for (const selector of leadSelectors) {
        const leadElement = $(selector).first();
        const leadText = leadElement.text().trim();
        if (leadText && leadText.length > 100 &&
          !leadText.includes('News |') &&
          !leadText.includes('Show —')) {
          return leadText.length > 300 ? leadText.substring(0, 300) + '...' : leadText;
        }
      }
    }

    if (source.name.includes('Muslim News')) {
      // For Muslim News, try to extract the first meaningful paragraph
      const leadSelectors = [
        '.entry-content p:first-of-type',
        '.post-content p:first-of-type',
        '.article-content p:first-of-type',
        'article p:first-of-type',
        '.content p:first-of-type'
      ];

      for (const selector of leadSelectors) {
        const leadElement = $(selector).first();
        const leadText = leadElement.text().trim();
        if (leadText && leadText.length > 100 &&
          !leadText.includes('Muslim News UK') &&
          !leadText.includes('Page ') &&
          !leadText.includes(' of ') &&
          !leadText.includes('PO Box') &&
          !leadText.includes('Tel:') &&
          !leadText.includes('Editor')) {
          return leadText.length > 300 ? leadText.substring(0, 300) + '...' : leadText;
        }
      }

      // Try to extract from content if available
      if (content && content.length > 200) {
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.length > 100 &&
            !cleanPara.includes('Muslim News UK') &&
            !cleanPara.includes('Page ') &&
            !cleanPara.includes(' of ') &&
            !cleanPara.includes('PO Box') &&
            !cleanPara.includes('Tel:') &&
            !cleanPara.includes('Editor')) {
            return cleanPara.length > 300 ? cleanPara.substring(0, 300) + '...' : cleanPara;
          }
        }
      }
    }

    if (source.name.includes('Anadolu Agency')) {
      // For Anadolu Agency, try to get the first meaningful paragraph
      if (content && content.length > 200) {
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.length > 100 &&
            !cleanPara.includes('Anadolu Ajansı') &&
            !cleanPara.includes('Anadolu Agency') &&
            !cleanPara.includes('your source for trusted news') &&
            !cleanPara.includes('Güvenilir haberin kaynağı') &&
            !cleanPara.includes('AA.com.tr')) {
            return cleanPara.length > 300 ? cleanPara.substring(0, 300) + '...' : cleanPara;
          }
        }
      }
    }

    // Fallback to cleaning the content
    if (content && content.length > 50) {
      return this.generateSummary(content);
    }

    // Last resort: create a summary from title if it's meaningful
    if (title && title.length > 20 &&
      !title.includes('Anadolu Ajansı') &&
      !title.includes('Anadolu Agency') &&
      !title.includes('The Jakarta Post') &&
      !title.includes('Muslim News UK') &&
      !title.includes('News - Page ') &&
      !title.includes(' - Page ') &&
      !title.includes(' of ') &&
      title !== 'Anadolu Agency' &&
      title !== 'Jakarta Post') {
      return `Read the full article: ${title}`;
    }

    return 'Summary not available - please visit original source';
  }

  generateSummary(content, maxLength = 300) {
    if (!content || content.length <= maxLength) {
      return content || '';
    }

    // Clean up content first - remove navigation and HTML artifacts more aggressively
    let cleanContent = content
      .replace(/News\s+\|\s+.*?\n/g, '') // Remove "News | Category" headers
      .replace(/Show —.*?Hide —.*?\n/g, '') // Remove navigation menus
      .replace(/Live Story.*?\n/g, '') // Remove "Live Story" labels
      .replace(/MENA.*?\n/g, '') // Remove MENA navigation
      .replace(/Gaza War.*?Live Story/g, '') // Remove Gaza War Live Story
      .replace(/Iran.*?Live Story/g, '') // Remove Iran Live Story
      .replace(/Israel.*?Live Story/g, '') // Remove Israel Live Story
      .replace(/Syria.*?Live Story/g, '') // Remove Syria Live Story
      .replace(/Palestinian diaspora.*?Live Story/g, '') // Remove Palestinian diaspora Live Story
      .replace(/Your browser is out of date.*?download page\./g, '') // Remove browser compatibility messages
      .replace(/A list of the most popular web browsers.*?\./g, '') // Remove browser list messages
      .replace(/Just click on the icons.*?\./g, '') // Remove icon click instructions
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Find the last complete sentence within the limit
    const truncated = cleanContent.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');

    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }

    return truncated + '...';
  }

  resolveUrl(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) {
      // Extract domain from baseUrl
      try {
        const domain = new URL(baseUrl).origin;
        const resolvedUrl = domain + url;
        console.log(`     Resolving URL: ${url} + ${domain} = ${resolvedUrl}`);
        return resolvedUrl;
      } catch (error) {
        console.error('Error resolving URL:', error);
        return url;
      }
    }
    
    // For relative URLs, combine with baseUrl
    try {
      const resolvedUrl = new URL(url, baseUrl).href;
      console.log(`     Resolving relative URL: ${url} + ${baseUrl} = ${resolvedUrl}`);
      return resolvedUrl;
    } catch (error) {
      console.error('Error resolving relative URL:', error);
      return url;
    }
  }

  async articleExists(url) {
    try {
      const article = await articleService.getAllArticles({ search: url, limit: 1 });
      return article.articles.length > 0;
    } catch (error) {
      return false;
    }
  }

  async saveArticles(articles) {
    const savedArticles = [];

    for (const articleData of articles) {
      try {
        const article = await articleService.createArticle(articleData);
        savedArticles.push(article);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate URL, skip
          console.log(`Duplicate article skipped: ${articleData.url}`);
        } else {
          console.error('Error saving article:', error.message);
        }
      }
    }

    return savedArticles;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateSource(source) {
    try {
      const response = await axios.get(source.url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const $ = cheerio.load(response.data);

      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Check if selectors find elements
      const titleElements = $(source.scrapeConfig.titleSelector).length;
      const contentElements = $(source.scrapeConfig.contentSelector).length;
      const linkElements = $(source.scrapeConfig.linkSelector).length;

      if (titleElements === 0) {
        validation.errors.push('Title selector finds no elements');
        validation.isValid = false;
      }

      if (contentElements === 0) {
        validation.errors.push('Content selector finds no elements');
        validation.isValid = false;
      }

      if (linkElements === 0) {
        validation.warnings.push('Link selector finds no elements');
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Cannot access source: ${error.message}`],
        warnings: []
      };
    }
  }
}

module.exports = new ScrapingService();
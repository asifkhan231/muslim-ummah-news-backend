require('dotenv').config();
const database = require('../config/database');
const Article = require('../models/Article');
const Source = require('../models/Source');

async function checkArticles() {
    try {
        await database.connect();

        // Get source ID
        const source = await Source.findOne({ name: 'Muslim News' });
        if (!source) {
            console.log('Source not found');
            process.exit(0);
        }

        const articles = await Article.find({ 'source.name': 'Muslim News' }).sort({ publishedAt: -1 }).limit(10);

        console.log(`Found ${articles.length} articles for Muslim News.`);
        articles.forEach((a, i) => {
            console.log(`${i + 1}. [${a.title}] - ${a.url}`);
            console.log(`   Summary: ${a.summary.substring(0, 50)}...`);
        });

        await database.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkArticles();

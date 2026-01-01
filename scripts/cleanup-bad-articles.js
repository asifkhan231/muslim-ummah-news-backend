require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const database = require('../config/database');

async function cleanupBadArticles() {
    try {
        await database.connect();
        console.log('🧹 Starting cleanup of bad articles...');

        const result = await Article.deleteMany({
            $or: [
                { title: { $regex: /^Issue \d+/, $options: 'i' } },
                { content: { $regex: /PO Box 380, Harrow/, $options: 'i' } },
                { title: 'The Jakarta Post' },
                { title: 'Anadolu Agency' }
            ]
        });

        console.log(`✅ Deleted ${result.deletedCount} bad articles.`);

        await database.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up:', error);
        await database.disconnect();
        process.exit(1);
    }
}

cleanupBadArticles();

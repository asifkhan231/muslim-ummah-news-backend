const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  baseUrl: String,
  country: String,
  language: {
    type: String,
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scrapeConfig: {
    titleSelector: String,
    contentSelector: String,
    authorSelector: String,
    dateSelector: String,
    imageSelector: String,
    linkSelector: String
  },
  lastScraped: Date,
  articlesCount: {
    type: Number,
    default: 0
  },
  categories: [{
    type: String,
    enum: [
      'palestine', 'middle-east', 'south-asia', 'southeast-asia', 'east-asia', 'asia', 'africa',
      'europe', 'americas', 'community', 'culture', 'economics', 'politics',
      'education', 'technology', 'health', 'sports', 'human-rights',
      'conflict', 'persecution', 'achievements', 'general'
    ]
  }],
  credibilityScore: {
    type: Number,
    default: 80
  },
  tier: {
    type: String,
    enum: ['Tier 1', 'Tier 2', 'Tier 3'],
    default: 'Tier 2'
  },
  region: {
    type: String,
    default: 'Global'
  },
  isUmmahVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Source', sourceSchema);
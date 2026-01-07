const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    name: String,
    url: String,
    country: String
  },
  author: String,
  publishedAt: {
    type: Date,
    required: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  aiFacts:{
    type: mongoose.Schema.Types.Mixed,
    default:[]
  },
  isAiInhanced:{
    type:Boolean,
    default:false
  },
  background:{
    type:String,
    default:''
  },
  category: {
    type: String,
    enum: [
      'palestine', 'middle-east', 'south-asia', 'southeast-asia', 'africa',
      'europe', 'americas', 'community', 'culture', 'economics', 'politics',
      'education', 'technology', 'health', 'sports', 'human-rights', 
      'conflict', 'persecution', 'general'
    ],
    default: 'general'
  },
  tags: [String],
  imageUrl: String,
  videoUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  hasVideo: {
    type: Boolean,
    default: false
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ category: 1 });
articleSchema.index({ 'source.name': 1 });
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema);
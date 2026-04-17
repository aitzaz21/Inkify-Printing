const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  content:   { type: String, required: true },
  image:     { type: String, default: null },
  excerpt:   { type: String, default: '', maxlength: 300 },
  metaTitle:       { type: String, default: '', trim: true, maxlength: 100 },
  metaDescription: { type: String, default: '', trim: true, maxlength: 200 },
  author:    { type: String, default: 'Inkify Team', trim: true },
  tags:      { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

blogSchema.index({ slug: 1 });
blogSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);

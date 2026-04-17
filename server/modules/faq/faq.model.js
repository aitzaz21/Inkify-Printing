const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question:  { type: String, required: true, trim: true },
  answer:    { type: String, required: true, trim: true },
  category:  { type: String, default: 'General', trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

faqSchema.index({ category: 1, sortOrder: 1 });

module.exports = mongoose.model('FAQ', faqSchema);

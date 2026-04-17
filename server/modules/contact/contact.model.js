const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 120 },
  email:   { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, trim: true, maxlength: 200, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  isRead:  { type: Boolean, default: false },
  ip:      { type: String, default: '' },
}, { timestamps: true });

contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

module.exports = mongoose.model('ContactMessage', contactSchema);

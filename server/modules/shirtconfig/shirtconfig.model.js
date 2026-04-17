const mongoose = require('mongoose');

// Singleton document — only one record ever exists
const shirtConfigSchema = new mongoose.Schema({
  shirtTypes: [
    {
      name:  { type: String, required: true, trim: true },
      image: { type: String, default: null },   // Cloudinary URL
    }
  ],
  colors: [
    {
      name: { type: String, required: true, trim: true },
      hex:  { type: String, required: true, trim: true },
    }
  ],
  sizes:     { type: [String], default: ['XS','S','M','L','XL','XXL'] },
  basePrice: { type: Number, default: 19.99 },
  sizePricing: { type: Map, of: Number, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('ShirtConfig', shirtConfigSchema);

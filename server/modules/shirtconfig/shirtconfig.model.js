const mongoose = require('mongoose');

// Singleton document — only one record ever exists.
// shirtTypes are fixed (3 types); admin can only toggle enabled/disabled.
const shirtConfigSchema = new mongoose.Schema({
  shirtTypes: [
    {
      id:      { type: String, enum: ['plain-tshirt', 'polo', 'vneck'], required: true },
      name:    { type: String, required: true, trim: true },
      enabled: { type: Boolean, default: true },
    }
  ],
  colors: [
    {
      name: { type: String, required: true, trim: true },
      hex:  { type: String, required: true, trim: true },
    }
  ],
  sizes:       { type: [String], default: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  basePrice:   { type: Number, default: 1999 },
  sizePricing: { type: Map, of: Number, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('ShirtConfig', shirtConfigSchema);

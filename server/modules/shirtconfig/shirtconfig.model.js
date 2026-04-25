const mongoose = require('mongoose');

const mockupSchema = new mongoose.Schema({
  colorName: { type: String, required: true, trim: true },
  hex:       { type: String, required: true, trim: true },
  frontUrl:  { type: String, default: '' },
  backUrl:   { type: String, default: '' },
}, { _id: true });

// Singleton document — only one record ever exists.
const shirtConfigSchema = new mongoose.Schema({
  shirtTypes: [
    {
      id:      { type: String, enum: ['plain-tshirt', 'polo', 'vneck'], required: true },
      name:    { type: String, required: true, trim: true },
      enabled: { type: Boolean, default: true },
      mockups: { type: [mockupSchema], default: [] },
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

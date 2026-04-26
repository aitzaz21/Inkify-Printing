const mongoose = require('mongoose');

const mockupSchema = new mongoose.Schema({
  colorName: { type: String, required: true, trim: true },
  hex:       { type: String, required: true, trim: true },
  frontUrl:  { type: String, default: '' },
  backUrl:   { type: String, default: '' },
}, { _id: true });

// shirtTypes are now fully dynamic — admin can add/remove any shirt type
const shirtTypeSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  enabled: { type: Boolean, default: true },
  mockups: { type: [mockupSchema], default: [] },
}, { _id: true });

const shirtConfigSchema = new mongoose.Schema({
  shirtTypes: { type: [shirtTypeSchema], default: [] },
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

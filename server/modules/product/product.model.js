const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category:    { type: String, required: true, trim: true, default: 'T-Shirt' },
    image:       { type: String, default: null },
    badge:       { type: String, default: null },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number,  default: 0 },
    tags:        { type: [String], default: [] },
    basePrice:   { type: Number, required: true, default: 19.99 },
    sizes:       { type: [String], default: ['XS','S','M','L','XL','XXL'] },
    colors: [
      {
        name:  { type: String },
        hex:   { type: String },
        image: { type: String },
      },
    ],
    sizePricing: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

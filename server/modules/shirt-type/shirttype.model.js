const mongoose = require('mongoose');

const colorVariantSchema = new mongoose.Schema({
  colorName: { type: String, required: true, trim: true },
  hex:       { type: String, required: true, trim: true },
  imageUrl:  { type: String, required: true },
}, { _id: true });

const shirtTypeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  colors:      { type: [colorVariantSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('ShirtType', shirtTypeSchema);

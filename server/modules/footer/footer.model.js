const mongoose = require('mongoose');

const footerLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  url:   { type: String, required: true, trim: true },
}, { _id: true });

const footerSectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  links: { type: [footerLinkSchema], default: [] },
}, { _id: true });

const socialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true, trim: true }, // twitter, instagram, linkedin, facebook, tiktok, youtube
  url:      { type: String, required: true, trim: true },
}, { _id: true });

const footerSchema = new mongoose.Schema({
  key:         { type: String, default: 'site', unique: true },
  brandText:   { type: String, default: 'Premium print solutions crafted with precision and delivered with excellence.' },
  sections:    { type: [footerSectionSchema], default: [] },
  socialLinks: { type: [socialLinkSchema], default: [] },
  copyright:   { type: String, default: '© {year} Inkify Printing. All rights reserved.' },
  bottomText:  { type: String, default: 'Crafted with precision & care.' },
}, { timestamps: true });

module.exports = mongoose.model('Footer', footerSchema);

const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },

  heroImages: [{
    url:      { type: String, required: true },
    alt:      { type: String, default: '' },
    publicId: { type: String, default: '' },
  }],
  heroHeadline:    { type: String, default: 'Your Design. Our Precision.' },
  heroSubheadline: { type: String, default: 'Premium custom T-shirts delivered to your door.' },

  trustBadges: [{
    icon:  { type: String, default: '✓' },
    label: { type: String, default: '' },
  }],

  reviews: [{
    name:   { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    text:   { type: String, default: '' },
    date:   { type: String, default: '' },
  }],

  privacyPolicy: { type: String, default: '' },
  aboutText:     { type: String, default: '' },

  aboutPage: {
    headline:    { type: String, default: 'Built with passion,\ndelivered with precision.' },
    subheadline: { type: String, default: 'We are a premium custom printing company dedicated to bringing your creative vision to life.' },
    story:       { type: String, default: '' },
    mission:     { type: String, default: '' },
    vision:      { type: String, default: '' },
    heroImage:   { type: String, default: '' },
    values: [{
      icon:  { type: String, default: '' },
      title: { type: String, default: '' },
      text:  { type: String, default: '' },
    }],
    teamMembers: [{
      name:   { type: String, default: '' },
      role:   { type: String, default: '' },
      avatar: { type: String, default: '' },
    }],
  },

  contactPage: {
    headline:    { type: String, default: 'Get in touch' },
    subheadline: { type: String, default: "Have a question? We'd love to hear from you." },
    email:       { type: String, default: '' },
    phone:       { type: String, default: '' },
    address:     { type: String, default: '' },
    hours:       { type: String, default: 'Mon – Fri: 9am – 6pm' },
  },

  statsOverrides: {
    ordersDelivered: { type: String, default: '' },
    avgRating:       { type: String, default: '' },
    turnaround:      { type: String, default: '' },
    satisfaction:    { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);

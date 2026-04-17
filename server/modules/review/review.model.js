const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 500 },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

// One review per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });
reviewSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Review', reviewSchema);

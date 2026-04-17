const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: {          // rejection reason or approval note
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  likes: {
    type: Number,
    default: 0,
  },
  usageCount: {         // how many orders used this design
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes for efficient querying
designSchema.index({ status: 1, createdAt: -1 });
designSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model('Design', designSchema);

const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  bankName:      { type: String, required: true, trim: true },
  accountTitle:  { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  iban:          { type: String, default: '', trim: true },
  instructions:  { type: String, default: '', trim: true },
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

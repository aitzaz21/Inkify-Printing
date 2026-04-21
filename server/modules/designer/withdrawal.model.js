const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:   { type: Number, required: true },
  paymentAccount: {
    method:        { type: String },
    accountName:   { type: String },
    accountNumber: { type: String },
  },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:   { type: String, default: '' },
  processedAt: { type: Date, default: null },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  earningIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'DesignerEarning' }],
}, { timestamps: true });

withdrawalSchema.index({ designer: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalSchema);

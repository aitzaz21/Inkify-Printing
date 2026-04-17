const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  design:   { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount:   { type: Number, required: true, default: 0 },
  status:   { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt:   { type: Date, default: null },
}, { timestamps: true });

earningSchema.index({ designer: 1, status: 1 });
earningSchema.index({ design: 1 });

module.exports = mongoose.model('DesignerEarning', earningSchema);

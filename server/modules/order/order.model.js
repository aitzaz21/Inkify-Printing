const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  // product is optional — custom shirt orders have no product ID
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  shirtType:   { type: String, default: '' },
  color:       { type: String, required: true },
  colorHex:    { type: String, default: '#FFFFFF' },
  size:        { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true },
  designUrl:   { type: String, default: null },
  designId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Design', default: null },
  designNote:  { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items:       { type: [orderItemSchema], required: true },

  subtotal:    { type: Number, required: true },
  shipping:    { type: Number, default: 0 },
  total:       { type: Number, required: true },

  shippingAddress: {
    firstName:  { type: String },
    lastName:   { type: String },
    street:     { type: String },
    city:       { type: String },
    state:      { type: String },
    postalCode: { type: String },
    country:    { type: String },
    phone:      { type: String },
  },

  paymentMethod:    { type: String, enum: ['cod', 'card'], default: 'cod' },
  paymentStatus:    { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId:    { type: String, default: null },
  paymentReference: { type: String, default: null },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending',
  },

  adminNote:    { type: String, default: '' },
  confirmedAt:  { type: Date },
  dispatchedAt: { type: Date },
  deliveredAt:  { type: Date },
  isReversed:     { type: Boolean, default: false },
  reversalReason: { type: String, default: '' },
  reversedAt:     { type: Date, default: null },
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `INK-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

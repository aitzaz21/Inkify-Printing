const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  street:     { type: String, default: '' },
  city:       { type: String, default: '' },
  state:      { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country:    { type: String, default: '' },
}, { _id: false });

const paymentAccountSchema = new mongoose.Schema({
  method:        { type: String, required: true, trim: true },  // e.g. "Bank Transfer", "PayPal"
  accountName:   { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  isPrimary:     { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, default: '', trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, default: null },
  gender:    { type: String, enum: ['male','female','other','prefer_not_to_say'], default: 'prefer_not_to_say' },
  address:   { type: addressSchema, default: () => ({}) },
  googleId:  { type: String, default: null },
  phone:     { type: String, default: '', trim: true },
  avatar:    { type: String, default: null },
  isVerified:        { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  role: { type: String, enum: ['user','admin','designer'], default: 'user' },

  // Designer payment accounts
  paymentAccounts: { type: [paymentAccountSchema], default: [] },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

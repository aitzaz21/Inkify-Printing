const express = require('express');
const router  = express.Router();
const User    = require('./user.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── Admin: list users ─────────────────────────────────────────
router.get('/', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 30, search } = req.query;
    const query = {};
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ firstName: re }, { lastName: re }, { email: re }, { phone: re }];
    }
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);
    ok(res, { users, total });
  } catch (e) { err(res, e); }
});

// ── Admin: update role — DISABLED for security ───────────────
// Admin cannot promote users to admin or convert to designer manually.
// Users must apply for designer status through the platform.
router.patch('/:id/role', auth, admin, async (req, res) => {
  return res.status(403).json({ success: false, message: 'Role changes are disabled. Users manage their own roles through the platform.' });
});

// ── User: get own profile ─────────────────────────────────────
router.get('/me/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'firstName lastName gender address avatar email phone role isVerified createdAt'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    ok(res, { user });
  } catch (e) { err(res, e); }
});

// ── User: update own profile (non-auth fields only) ───────────
router.patch('/me/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, gender, address } = req.body;

    if (firstName !== undefined && !firstName?.trim())
      return res.status(422).json({ success: false, message: 'First name cannot be empty.' });

    const allowedGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (gender !== undefined && !allowedGenders.includes(gender))
      return res.status(422).json({ success: false, message: 'Invalid gender value.' });

    const update = {};
    if (firstName !== undefined) update.firstName = firstName.trim();
    if (lastName  !== undefined) update.lastName  = lastName?.trim() ?? '';
    if (gender    !== undefined) update.gender    = gender;

    if (address && typeof address === 'object') {
      const allowed = ['street', 'city', 'postalCode', 'state', 'country'];
      allowed.forEach(key => {
        if (address[key] !== undefined) update[`address.${key}`] = address[key]?.trim() ?? '';
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    ok(res, { user, message: 'Profile updated successfully.' });
  } catch (e) { err(res, e); }
});

// ── User: get own payment accounts ───────────────────────────
router.get('/me/payment-accounts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('paymentAccounts');
    ok(res, { paymentAccounts: user.paymentAccounts });
  } catch (e) { err(res, e); }
});

// ── User: add payment account ─────────────────────────────────
router.post('/me/payment-accounts', auth, async (req, res) => {
  try {
    const { method, accountName, accountNumber, isPrimary } = req.body;
    if (!method?.trim() || !accountName?.trim() || !accountNumber?.trim())
      return res.status(422).json({ success: false, message: 'method, accountName and accountNumber are required.' });

    const user = await User.findById(req.user._id);
    if (isPrimary) {
      user.paymentAccounts.forEach(a => { a.isPrimary = false; });
    }
    user.paymentAccounts.push({ method, accountName, accountNumber, isPrimary: !!isPrimary });
    await user.save();
    ok(res, { paymentAccounts: user.paymentAccounts });
  } catch (e) { err(res, e); }
});

// ── User: update payment account ─────────────────────────────
router.patch('/me/payment-accounts/:accId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const acc  = user.paymentAccounts.id(req.params.accId);
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found.' });

    const { method, accountName, accountNumber, isPrimary } = req.body;
    if (method)        acc.method        = method;
    if (accountName)   acc.accountName   = accountName;
    if (accountNumber) acc.accountNumber = accountNumber;
    if (isPrimary !== undefined) {
      if (isPrimary) user.paymentAccounts.forEach(a => { a.isPrimary = false; });
      acc.isPrimary = !!isPrimary;
    }
    await user.save();
    ok(res, { paymentAccounts: user.paymentAccounts });
  } catch (e) { err(res, e); }
});

// ── User: delete payment account ─────────────────────────────
router.delete('/me/payment-accounts/:accId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.paymentAccounts = user.paymentAccounts.filter(
      a => a._id.toString() !== req.params.accId
    );
    await user.save();
    ok(res, { paymentAccounts: user.paymentAccounts });
  } catch (e) { err(res, e); }
});

// ── Admin: create user ───────────────────────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName?.trim() || !email?.trim() || !password?.trim())
      return res.status(422).json({ success: false, message: 'firstName, email and password are required.' });
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim() || '',
      isVerified: true,
      isProfileComplete: true,
    });
    ok(res, { user });
  } catch (e) { err(res, e); }
});

// ── Admin: delete user ───────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin users.' });
    await user.deleteOne();
    ok(res, { message: 'User deleted.' });
  } catch (e) { err(res, e); }
});

// ── Admin: view user profile + order/design/payment history ──
router.get('/:id/profile', auth, admin, async (req, res) => {
  try {
    const Order  = require('../order/order.model');
    const Design = require('../design/design.model');
    const DesignerEarning = require('../designer/designer.model');

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [orders, designs, earnings] = await Promise.all([
      Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(50),
      Design.find({ creator: req.params.id }).sort({ createdAt: -1 }),
      DesignerEarning.find({ designer: req.params.id }).populate('design','title').sort({ createdAt: -1 }),
    ]);

    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: orders.reduce((s, o) => s + (o.total || 0), 0),
    };

    ok(res, { user, orders, designs, earnings, orderStats });
  } catch (e) { err(res, e); }
});

// ── Admin: trigger password reset for user ───────────────────
router.post('/:id/reset-password', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!user.password) return res.status(400).json({ success: false, message: 'User uses Google login.' });
    const { createOTP } = require('../../utils/otpService');
    const { sendPasswordResetOTP } = require('../../utils/emailService');
    const otp = await createOTP(user.email, 'password_reset');
    await sendPasswordResetOTP(user.email, user.firstName, otp);
    ok(res, { message: `Password reset OTP sent to ${user.email}.` });
  } catch (e) { err(res, e); }
});

module.exports = router;

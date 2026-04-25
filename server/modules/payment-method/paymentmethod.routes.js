const express        = require('express');
const router         = express.Router();
const PaymentMethod  = require('./paymentmethod.model');
const auth           = require('../../middleware/authMiddleware');
const admin          = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── GET /api/payment-methods — public (active only) ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    ok(res, { methods });
  } catch (e) { err(res, e); }
});

// ── GET /api/payment-methods/all — admin: all including inactive ──────────────
router.get('/all', auth, admin, async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort({ sortOrder: 1, createdAt: 1 });
    ok(res, { methods });
  } catch (e) { err(res, e); }
});

// ── POST /api/payment-methods — admin: create ─────────────────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    const { bankName, accountTitle, accountNumber, iban, instructions, sortOrder } = req.body;
    if (!bankName?.trim())      return res.status(422).json({ success: false, message: 'Bank/Account name is required.' });
    if (!accountTitle?.trim())  return res.status(422).json({ success: false, message: 'Account title is required.' });
    if (!accountNumber?.trim()) return res.status(422).json({ success: false, message: 'Account number is required.' });

    const method = await PaymentMethod.create({
      bankName:      bankName.trim(),
      accountTitle:  accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      iban:          iban?.trim()         || '',
      instructions:  instructions?.trim() || '',
      sortOrder:     sortOrder            || 0,
    });
    ok(res, { method });
  } catch (e) { err(res, e); }
});

// ── PUT /api/payment-methods/:id — admin: update ──────────────────────────────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { bankName, accountTitle, accountNumber, iban, instructions, sortOrder } = req.body;
    if (!bankName?.trim())      return res.status(422).json({ success: false, message: 'Bank/Account name is required.' });
    if (!accountTitle?.trim())  return res.status(422).json({ success: false, message: 'Account title is required.' });
    if (!accountNumber?.trim()) return res.status(422).json({ success: false, message: 'Account number is required.' });

    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      { bankName: bankName.trim(), accountTitle: accountTitle.trim(), accountNumber: accountNumber.trim(),
        iban: iban?.trim() || '', instructions: instructions?.trim() || '', sortOrder: sortOrder || 0 },
      { new: true }
    );
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found.' });
    ok(res, { method });
  } catch (e) { err(res, e); }
});

// ── PATCH /api/payment-methods/:id/toggle — admin: toggle active ─────────────
router.patch('/:id/toggle', auth, admin, async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found.' });
    method.isActive = !method.isActive;
    await method.save();
    ok(res, { method });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/payment-methods/:id — admin: delete ──────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found.' });
    ok(res, { message: 'Payment method deleted.' });
  } catch (e) { err(res, e); }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');
const {
  getMyEarnings, requestWithdrawal,
  getWithdrawalRequests, approveWithdrawal, rejectWithdrawal,
} = require('./designer.service');

const ok  = (res, data) => res.json({ success: true,  ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── User endpoints ────────────────────────────────────────────
router.get('/my-earnings',        auth, async (req, res) => {
  try { ok(res, await getMyEarnings(req.user._id)); }
  catch (e) { err(res, e); }
});

router.post('/withdraw',          auth, async (req, res) => {
  try { ok(res, { request: await requestWithdrawal(req.user._id, req.body.paymentAccount) }); }
  catch (e) { err(res, e); }
});

// ── Admin endpoints ───────────────────────────────────────────
router.get('/requests',           auth, admin, async (req, res) => {
  try { ok(res, await getWithdrawalRequests(req.query)); }
  catch (e) { err(res, e); }
});

router.patch('/requests/:id/approve', auth, admin, async (req, res) => {
  try { ok(res, { request: await approveWithdrawal(req.params.id, req.user._id, req.body.adminNote) }); }
  catch (e) { err(res, e); }
});

router.patch('/requests/:id/reject',  auth, admin, async (req, res) => {
  try { ok(res, { request: await rejectWithdrawal(req.params.id, req.user._id, req.body.adminNote) }); }
  catch (e) { err(res, e); }
});

module.exports = router;

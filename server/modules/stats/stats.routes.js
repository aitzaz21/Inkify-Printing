const express = require('express');
const router  = express.Router();
const Order   = require('../order/order.model');
const Review  = require('../review/review.model');
const Design  = require('../design/design.model');
const Content = require('../content/content.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// GET /api/stats/home — public dynamic stats for homepage
router.get('/home', async (req, res) => {
  try {
    const content = await Content.findOne({ key: 'site' });
    const overrides = content?.statsOverrides || {};

    const [orderCount, deliveredCount, avgResult, totalReviews, totalDesigns] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'delivered' }),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Review.countDocuments(),
      Design.countDocuments({ status: 'approved' }),
    ]);

    const avgRating = avgResult[0]?.avg ? Math.round(avgResult[0].avg * 10) / 10 : 4.9;

    const stats = {
      // Display stats (with admin overrides)
      ordersDelivered: overrides.ordersDelivered || (deliveredCount > 0 ? `${deliveredCount.toLocaleString()}+` : '50K+'),
      avgRating:       overrides.avgRating       || `${avgRating}★`,
      turnaround:      overrides.turnaround      || '72h',
      satisfaction:    overrides.satisfaction    || '100%',

      // Raw numbers for dynamic vitals display
      totalOrders:  orderCount,
      totalDesigns: totalDesigns,
      totalReviews: totalReviews,
    };

    ok(res, { stats });
  } catch (e) { err(res, e); }
});

// PATCH /api/stats/overrides — admin manual override
router.patch('/overrides', auth, admin, async (req, res) => {
  try {
    const { ordersDelivered, avgRating, turnaround, satisfaction } = req.body;
    const overrides = {};
    if (ordersDelivered !== undefined) overrides['statsOverrides.ordersDelivered'] = ordersDelivered || '';
    if (avgRating       !== undefined) overrides['statsOverrides.avgRating']       = avgRating || '';
    if (turnaround      !== undefined) overrides['statsOverrides.turnaround']      = turnaround || '';
    if (satisfaction    !== undefined) overrides['statsOverrides.satisfaction']    = satisfaction || '';

    const content = await Content.findOneAndUpdate(
      { key: 'site' },
      { $set: overrides },
      { new: true, upsert: true }
    );
    ok(res, { statsOverrides: content.statsOverrides });
  } catch (e) { err(res, e); }
});

// GET /api/stats/overrides — admin get current overrides
router.get('/overrides', auth, admin, async (req, res) => {
  try {
    const content = await Content.findOne({ key: 'site' });
    ok(res, { statsOverrides: content?.statsOverrides || {} });
  } catch (e) { err(res, e); }
});

module.exports = router;

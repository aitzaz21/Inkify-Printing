const express = require('express');
const router  = express.Router();
const Review  = require('./review.model');
const Order   = require('../order/order.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── Public: get featured reviews (top 3) ──────────────────────
router.get('/featured', async (req, res) => {
  try {
    const reviews = await Review.find({ isFeatured: true })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(3);
    ok(res, { reviews });
  } catch (e) { err(res, e); }
});

// ── Public: get all reviews (paginated) ───────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('user', 'firstName lastName avatar')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Review.countDocuments(),
    ]);
    ok(res, { reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e); }
});

// ── Public: get stats (for homepage dynamic stats) ────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalReviews, avgResult] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    ]);
    const avgRating = avgResult[0]?.avg ? Math.round(avgResult[0].avg * 10) / 10 : 5.0;
    ok(res, { totalReviews, avgRating });
  } catch (e) { err(res, e); }
});

// ── User: submit review ───────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId) return res.status(422).json({ success: false, message: 'Order ID is required.' });
    if (!rating || rating < 1 || rating > 5) return res.status(422).json({ success: false, message: 'Rating must be 1-5.' });
    if (!comment?.trim()) return res.status(422).json({ success: false, message: 'Comment is required.' });

    // Verify order belongs to user and is delivered
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'delivered') return res.status(422).json({ success: false, message: 'You can only review delivered orders.' });

    // Check if already reviewed
    const existing = await Review.findOne({ user: req.user._id, order: orderId });
    if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this order.' });

    const review = await Review.create({
      user: req.user._id,
      order: orderId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await review.populate('user', 'firstName lastName avatar');
    await review.populate('order', 'orderNumber');

    res.status(201).json({ success: true, review });
  } catch (e) { err(res, e); }
});

// ── User: get my reviews ──────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 });
    ok(res, { reviews });
  } catch (e) { err(res, e); }
});

// ── User: update own review ───────────────────────────────────
router.patch('/my/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5))
      return res.status(422).json({ success: false, message: 'Rating must be 1-5.' });
    if (comment !== undefined && !comment?.trim())
      return res.status(422).json({ success: false, message: 'Comment cannot be empty.' });

    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (rating)  review.rating  = Number(rating);
    if (comment) review.comment = comment.trim();
    await review.save();
    await review.populate('user', 'firstName lastName avatar');
    await review.populate('order', 'orderNumber');
    ok(res, { review });
  } catch (e) { err(res, e); }
});

// ── User: delete own review ───────────────────────────────────
router.delete('/my/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    ok(res, { message: 'Review deleted.' });
  } catch (e) { err(res, e); }
});

// ── Admin: get all reviews ────────────────────────────────────
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('user', 'firstName lastName email avatar')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Review.countDocuments(),
    ]);
    ok(res, { reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e); }
});

// ── Admin: toggle featured ────────────────────────────────────
router.patch('/:id/feature', auth, admin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    // If featuring, check we don't exceed 3
    if (!review.isFeatured) {
      const featuredCount = await Review.countDocuments({ isFeatured: true });
      if (featuredCount >= 3) {
        return res.status(422).json({ success: false, message: 'Maximum 3 featured reviews. Unfeature one first.' });
      }
    }

    review.isFeatured = !review.isFeatured;
    await review.save();
    await review.populate('user', 'firstName lastName email avatar');
    await review.populate('order', 'orderNumber');
    ok(res, { review });
  } catch (e) { err(res, e); }
});

// ── Admin: delete review ──────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    ok(res, { message: 'Review deleted.' });
  } catch (e) { err(res, e); }
});

module.exports = router;

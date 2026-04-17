const express = require('express');
const router  = express.Router();
const Content = require('./content.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

const SITE_KEY = 'site';

const getOrCreate = async () => {
  let content = await Content.findOne({ key: SITE_KEY });
  if (!content) {
    content = await Content.create({
      key: SITE_KEY,
      heroImages: [],
      heroHeadline: 'Your Design. Our Precision.',
      heroSubheadline: 'Premium custom T-shirts crafted and delivered with care.',
      trustBadges: [
        { icon: '🎨', label: 'Custom Designs' },
        { icon: '⚡', label: 'Fast Delivery'  },
        { icon: '✅', label: 'Quality Guaranteed' },
        { icon: '🔒', label: 'Secure Checkout' },
      ],
      reviews: [],
      privacyPolicy: '## Privacy Policy\n\nYour privacy matters to us...',
    });
  }
  return content;
};

// GET site content (public)
router.get('/', async (req, res) => {
  try {
    const content = await getOrCreate();
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

// PATCH site content (admin)
router.patch('/', auth, admin, async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      { key: SITE_KEY },
      { $set: req.body },
      { new: true, upsert: true }
    );
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

// POST add hero image
router.post('/hero-image', auth, admin, async (req, res) => {
  const { url, alt, publicId } = req.body;
  if (!url) return respond(res, 422, { message: 'URL is required.' });
  try {
    const content = await Content.findOneAndUpdate(
      { key: SITE_KEY },
      { $push: { heroImages: { url, alt: alt || '', publicId: publicId || '' } } },
      { new: true, upsert: true }
    );
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

// DELETE hero image
router.delete('/hero-image/:imageId', auth, admin, async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      { key: SITE_KEY },
      { $pull: { heroImages: { _id: req.params.imageId } } },
      { new: true }
    );
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

// POST add review
router.post('/reviews', auth, admin, async (req, res) => {
  const { name, rating, text, date, avatar } = req.body;
  if (!name || !text) return respond(res, 422, { message: 'Name and text are required.' });
  try {
    const content = await Content.findOneAndUpdate(
      { key: SITE_KEY },
      { $push: { reviews: { name, rating: rating || 5, text, date: date || '', avatar: avatar || '' } } },
      { new: true, upsert: true }
    );
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

// DELETE review
router.delete('/reviews/:reviewId', auth, admin, async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      { key: SITE_KEY },
      { $pull: { reviews: { _id: req.params.reviewId } } },
      { new: true }
    );
    respond(res, 200, { content });
  } catch (err) {
    respond(res, 500, { message: 'Server error.' });
  }
});

module.exports = router;

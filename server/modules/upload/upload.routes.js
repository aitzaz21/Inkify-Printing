const express = require('express');
const router  = express.Router();
const authMiddleware  = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { uploadDesign, uploadProduct, uploadHero, uploadMockup, uploadPaymentProof, deleteByUrl } = require('../../config/cloudinary');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

// ── User: upload their custom design ─────────────────────────
router.post('/design', authMiddleware, (req, res) => {
  uploadDesign.single('image')(req, res, (err) => {
    if (err) return respond(res, 400, { message: err.message });
    if (!req.file) return respond(res, 400, { message: 'No file received.' });
    respond(res, 200, { url: req.file.path, publicId: req.file.filename });
  });
});

// ── Admin: upload product mockup image ───────────────────────
router.post('/product', authMiddleware, adminMiddleware, (req, res) => {
  uploadProduct.single('image')(req, res, (err) => {
    if (err) return respond(res, 400, { message: err.message });
    if (!req.file) return respond(res, 400, { message: 'No file received.' });
    respond(res, 200, { url: req.file.path, publicId: req.file.filename });
  });
});

// ── Admin: upload homepage hero image ────────────────────────
router.post('/hero', authMiddleware, adminMiddleware, (req, res) => {
  uploadHero.single('image')(req, res, (err) => {
    if (err) return respond(res, 400, { message: err.message });
    if (!req.file) return respond(res, 400, { message: 'No file received.' });
    respond(res, 200, { url: req.file.path, publicId: req.file.filename });
  });
});

// ── User: upload manual payment proof screenshot ──────────────────
router.post('/payment-proof', authMiddleware, (req, res) => {
  uploadPaymentProof.single('image')(req, res, (err) => {
    if (err) return respond(res, 400, { message: err.message });
    if (!req.file) return respond(res, 400, { message: 'No file received.' });
    respond(res, 200, { url: req.file.path, publicId: req.file.filename });
  });
});

// ── Admin: upload shirt mockup PNG (transparent background) ─────
router.post('/mockup', authMiddleware, adminMiddleware, (req, res) => {
  uploadMockup.single('image')(req, res, (err) => {
    if (err) return respond(res, 400, { message: err.message });
    if (!req.file) return respond(res, 400, { message: 'No file received.' });
    respond(res, 200, { url: req.file.path, publicId: req.file.filename });
  });
});

// ── Admin: delete any cloudinary image by URL ────────────────
router.delete('/image', authMiddleware, adminMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return respond(res, 422, { message: 'URL is required.' });
  await deleteByUrl(url);
  respond(res, 200, { message: 'Image deleted.' });
});

module.exports = router;

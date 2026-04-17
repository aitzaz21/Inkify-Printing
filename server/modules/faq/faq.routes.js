const express = require('express');
const router  = express.Router();
const FAQ     = require('./faq.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true,  ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// GET /api/faq — public active FAQs
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });
    ok(res, { faqs });
  } catch (e) { err(res, e); }
});

// ── Admin ─────────────────────────────────────────────────────

// GET /api/faq/admin/all — all
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ category: 1, sortOrder: 1 });
    ok(res, { faqs });
  } catch (e) { err(res, e); }
});

// POST /api/faq — create
router.post('/', auth, admin, async (req, res) => {
  try {
    const { question, answer, category, sortOrder, isActive } = req.body;
    if (!question?.trim()) return res.status(422).json({ success: false, message: 'Question required.' });
    if (!answer?.trim())   return res.status(422).json({ success: false, message: 'Answer required.' });
    const faq = await FAQ.create({
      question: question.trim(), answer: answer.trim(),
      category: category?.trim() || 'General',
      sortOrder: sortOrder || 0,
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, faq });
  } catch (e) { err(res, e); }
});

// PUT /api/faq/:id — update
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { question, answer, category, sortOrder, isActive } = req.body;
    const update = {};
    if (question  !== undefined) update.question  = question.trim();
    if (answer    !== undefined) update.answer    = answer.trim();
    if (category  !== undefined) update.category  = category.trim();
    if (sortOrder !== undefined) update.sortOrder = sortOrder;
    if (isActive  !== undefined) update.isActive  = !!isActive;
    const faq = await FAQ.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found.' });
    ok(res, { faq });
  } catch (e) { err(res, e); }
});

// DELETE /api/faq/:id
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    ok(res, { message: 'FAQ deleted.' });
  } catch (e) { err(res, e); }
});

module.exports = router;

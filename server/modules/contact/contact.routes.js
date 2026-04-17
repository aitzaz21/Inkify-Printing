const express  = require('express');
const router   = express.Router();
const Contact  = require('./contact.model');
const auth     = require('../../middleware/authMiddleware');
const admin    = require('../../middleware/adminMiddleware');

const ok  = (res, data)    => res.status(200).json({ success: true,  ...data });
const bad = (res, msg)     => res.status(422).json({ success: false, message: msg });
const err = (res, e)       => res.status(500).json({ success: false, message: e.message });

// ── Public: submit contact form ───────────────────────────────
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim())    return bad(res, 'Name is required.');
  if (!email?.trim())   return bad(res, 'Email is required.');
  if (!message?.trim()) return bad(res, 'Message is required.');

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) return bad(res, 'Invalid email address.');

  try {
    const msg = await Contact.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject?.trim() || '',
      message: message.trim(),
      ip:      req.ip || '',
    });
    ok(res, { message: 'Message sent successfully.', id: msg._id });
  } catch (e) { err(res, e); }
});

// ── Admin: list all messages ──────────────────────────────────
router.get('/', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const filter = unread === 'true' ? { isRead: false } : {};
    const [messages, total, unreadCount] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Contact.countDocuments(filter),
      Contact.countDocuments({ isRead: false }),
    ]);
    ok(res, { messages, total, unreadCount, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e); }
});

// ── Admin: mark as read ───────────────────────────────────────
router.patch('/:id/read', auth, admin, async (req, res) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Not found.' });
    ok(res, { message: msg });
  } catch (e) { err(res, e); }
});

// ── Admin: delete message ─────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    ok(res, { message: 'Deleted.' });
  } catch (e) { err(res, e); }
});

module.exports = router;

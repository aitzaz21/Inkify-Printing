const express    = require('express');
const router     = express.Router();
const ShirtType  = require('./shirttype.model');
const auth       = require('../../middleware/authMiddleware');
const admin      = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── GET /api/shirt-types — public: active types for the customizer ────────────
router.get('/', async (req, res) => {
  try {
    const types = await ShirtType.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    ok(res, { shirtTypes: types });
  } catch (e) { err(res, e); }
});

// ── GET /api/shirt-types/admin — admin: all types ─────────────────────────────
router.get('/admin', auth, admin, async (req, res) => {
  try {
    const types = await ShirtType.find().sort({ sortOrder: 1, createdAt: 1 });
    ok(res, { shirtTypes: types });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-types — admin: create ─────────────────────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    if (!name?.trim()) return res.status(422).json({ success: false, message: 'Shirt type name is required.' });
    const type = await ShirtType.create({
      name:        name.trim(),
      description: description?.trim() || '',
      sortOrder:   sortOrder || 0,
    });
    ok(res, { shirtType: type });
  } catch (e) { err(res, e); }
});

// ── PUT /api/shirt-types/:id — admin: update name/description/sortOrder ───────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    if (!name?.trim()) return res.status(422).json({ success: false, message: 'Shirt type name is required.' });
    const type = await ShirtType.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description: description?.trim() || '', sortOrder: sortOrder || 0 },
      { new: true }
    );
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    ok(res, { shirtType: type });
  } catch (e) { err(res, e); }
});

// ── PATCH /api/shirt-types/:id/toggle — admin: toggle active ─────────────────
router.patch('/:id/toggle', auth, admin, async (req, res) => {
  try {
    const type = await ShirtType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    type.isActive = !type.isActive;
    await type.save();
    ok(res, { shirtType: type });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/shirt-types/:id — admin: delete ───────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const type = await ShirtType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    ok(res, { message: 'Shirt type deleted.' });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-types/:id/colors — admin: add a colour variant ────────────
router.post('/:id/colors', auth, admin, async (req, res) => {
  try {
    const { colorName, hex, imageUrl } = req.body;
    if (!colorName?.trim()) return res.status(422).json({ success: false, message: 'Color name is required.' });
    if (!hex?.trim())       return res.status(422).json({ success: false, message: 'Hex color is required.' });
    if (!imageUrl?.trim())  return res.status(422).json({ success: false, message: 'Image URL is required.' });

    const type = await ShirtType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });

    // Prevent duplicate hex
    const normHex = hex.toLowerCase();
    const exists  = type.colors.find(c => c.hex.toLowerCase() === normHex);
    if (exists) {
      exists.colorName = colorName.trim();
      exists.imageUrl  = imageUrl.trim();
    } else {
      type.colors.push({ colorName: colorName.trim(), hex, imageUrl: imageUrl.trim() });
    }

    type.markModified('colors');
    await type.save();
    ok(res, { shirtType: type });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/shirt-types/:id/colors/:colorId — admin: remove colour ────────
router.delete('/:id/colors/:colorId', auth, admin, async (req, res) => {
  try {
    const type = await ShirtType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });

    const before = type.colors.length;
    type.colors  = type.colors.filter(c => c._id.toString() !== req.params.colorId);
    if (type.colors.length === before) {
      return res.status(404).json({ success: false, message: 'Color variant not found.' });
    }

    type.markModified('colors');
    await type.save();
    ok(res, { shirtType: type });
  } catch (e) { err(res, e); }
});

module.exports = router;

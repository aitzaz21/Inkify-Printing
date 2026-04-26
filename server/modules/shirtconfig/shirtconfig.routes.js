const express     = require('express');
const router      = express.Router();
const ShirtConfig = require('./shirtconfig.model');
const auth        = require('../../middleware/authMiddleware');
const admin       = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true,  ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// Helper — get or create the singleton config document
const getConfig = async () => {
  let cfg = await ShirtConfig.findOne();
  if (!cfg) {
    cfg = await ShirtConfig.create({
      shirtTypes: [
        { name: 'Plain T-Shirt', enabled: true, mockups: [] },
        { name: 'Polo Shirt',    enabled: true, mockups: [] },
        { name: 'V-Neck T-Shirt',enabled: true, mockups: [] },
      ],
      colors: [
        { name: 'White',  hex: '#FFFFFF' },
        { name: 'Black',  hex: '#0B0B0B' },
        { name: 'Navy',   hex: '#1a2e4a' },
        { name: 'Ash',    hex: '#B2B2B2' },
        { name: 'Red',    hex: '#C0392B' },
        { name: 'Olive',  hex: '#6B7A4B' },
      ],
      sizes:       ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      basePrice:   1999,
      sizePricing: { XL: 200, XXL: 400 },
    });
  }
  return cfg;
};

// ── GET /api/shirt-config — public ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cfg = await getConfig();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── PUT /api/shirt-config — admin: update global colors, sizes, pricing ───────
router.put('/', auth, admin, async (req, res) => {
  try {
    const { colors, sizes, basePrice, sizePricing } = req.body;
    const cfg = await getConfig();
    if (colors      !== undefined) cfg.colors      = colors;
    if (sizes       !== undefined) cfg.sizes        = sizes;
    if (basePrice   !== undefined) cfg.basePrice    = parseFloat(basePrice);
    if (sizePricing !== undefined) cfg.sizePricing  = sizePricing;
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-config/shirt-types — admin: add a new shirt type ──────────
router.post('/shirt-types', auth, admin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(422).json({ success: false, message: 'Shirt type name is required.' });
    const cfg = await getConfig();
    cfg.shirtTypes.push({ name: name.trim(), enabled: true, mockups: [] });
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/shirt-config/shirt-types/:id — admin: remove a shirt type ─────
router.delete('/shirt-types/:id', auth, admin, async (req, res) => {
  try {
    const cfg    = await getConfig();
    const before = cfg.shirtTypes.length;
    cfg.shirtTypes = cfg.shirtTypes.filter(t => t._id.toString() !== req.params.id);
    if (cfg.shirtTypes.length === before) {
      return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    }
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── PATCH /api/shirt-config/shirt-types/:id/toggle — enable/disable ───────────
router.patch('/shirt-types/:id/toggle', auth, admin, async (req, res) => {
  try {
    const cfg  = await getConfig();
    const type = cfg.shirtTypes.find(t => t._id.toString() === req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    type.enabled = !type.enabled;
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-config/shirt-types/:id/mockups — add/upsert a colour ──────
router.post('/shirt-types/:id/mockups', auth, admin, async (req, res) => {
  try {
    const cfg  = await getConfig();
    const type = cfg.shirtTypes.find(t => t._id.toString() === req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });

    const { colorName, hex, frontUrl, backUrl } = req.body;
    if (!colorName?.trim()) return res.status(422).json({ success: false, message: 'colorName is required.' });
    if (!hex?.trim())       return res.status(422).json({ success: false, message: 'hex is required.' });
    if (!frontUrl?.trim())  return res.status(422).json({ success: false, message: 'Front image is required.' });

    const normHex  = hex.toLowerCase();
    const existing = type.mockups.find(m => m.hex.toLowerCase() === normHex);

    if (existing) {
      existing.colorName = colorName.trim();
      if (frontUrl) existing.frontUrl = frontUrl;
      if (backUrl !== undefined) existing.backUrl = backUrl;
    } else {
      type.mockups.push({ colorName: colorName.trim(), hex, frontUrl, backUrl: backUrl || '' });
    }

    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/shirt-config/shirt-types/:id/mockups/:mockupId ────────────────
router.delete('/shirt-types/:id/mockups/:mockupId', auth, admin, async (req, res) => {
  try {
    const cfg  = await getConfig();
    const type = cfg.shirtTypes.find(t => t._id.toString() === req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });

    const before   = type.mockups.length;
    type.mockups   = type.mockups.filter(m => m._id.toString() !== req.params.mockupId);
    if (type.mockups.length === before) {
      return res.status(404).json({ success: false, message: 'Colour variant not found.' });
    }

    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

module.exports = router;

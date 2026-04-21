const express     = require('express');
const router      = express.Router();
const ShirtConfig = require('./shirtconfig.model');
const auth        = require('../../middleware/authMiddleware');
const admin       = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true,  ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// The 3 fixed shirt types — IDs must match frontend SHIRT_TYPE_IDS
const FIXED_SHIRT_TYPES = [
  { id: 'plain-tshirt', name: 'Plain T-Shirt', enabled: true },
  { id: 'polo',         name: 'Polo Shirt',    enabled: true },
  { id: 'vneck',        name: 'V-Neck T-Shirt', enabled: true },
];

// Helper — get or create the singleton config document
const getConfig = async () => {
  let cfg = await ShirtConfig.findOne();
  if (!cfg) {
    cfg = await ShirtConfig.create({
      shirtTypes: FIXED_SHIRT_TYPES,
      colors: [
        { name: 'White',  hex: '#FFFFFF' },
        { name: 'Black',  hex: '#0B0B0B' },
        { name: 'Brown',  hex: '#6B4226' },
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

  // Migrate: if stored shirtTypes don't match the 3 fixed types, reset them
  const storedIds = cfg.shirtTypes.map(t => t.id).sort().join(',');
  const fixedIds  = FIXED_SHIRT_TYPES.map(t => t.id).sort().join(',');
  if (storedIds !== fixedIds) {
    // Preserve enabled state from old data where possible
    const enabledMap = {};
    cfg.shirtTypes.forEach(t => { if (t.id) enabledMap[t.id] = t.enabled; });
    cfg.shirtTypes = FIXED_SHIRT_TYPES.map(t => ({
      ...t,
      enabled: enabledMap[t.id] !== undefined ? enabledMap[t.id] : true,
    }));
    cfg.markModified('shirtTypes');
    await cfg.save();
  }

  return cfg;
};

// ── GET /api/shirt-config — public ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const cfg = await getConfig();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── PUT /api/shirt-config — admin: update colors, sizes, pricing ─
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

// ── PATCH /api/shirt-config/shirt-types/:id/toggle — enable/disable ─
router.patch('/shirt-types/:id/toggle', auth, admin, async (req, res) => {
  try {
    const cfg = await getConfig();
    const type = cfg.shirtTypes.find(t => t.id === req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Shirt type not found.' });
    type.enabled = !type.enabled;
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

module.exports = router;

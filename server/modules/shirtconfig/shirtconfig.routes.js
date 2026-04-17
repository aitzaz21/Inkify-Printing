const express      = require('express');
const router       = express.Router();
const ShirtConfig  = require('./shirtconfig.model');
const auth         = require('../../middleware/authMiddleware');
const admin        = require('../../middleware/adminMiddleware');
const { uploadProduct, deleteByUrl } = require('../../config/cloudinary');

const ok  = (res, data) => res.status(200).json({ success: true,  ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// Helper — get or create the singleton config document
const getConfig = async () => {
  let cfg = await ShirtConfig.findOne();
  if (!cfg) {
    cfg = await ShirtConfig.create({
      shirtTypes: [
        { name: 'Classic Crew Tee',      image: null },
        { name: 'Premium Oversized Tee', image: null },
        { name: 'Fitted V-Neck',         image: null },
      ],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#0B0B0B' },
        { name: 'Brown', hex: '#6B4226' },
        { name: 'Navy',  hex: '#1a2e4a' },
        { name: 'Ash',   hex: '#B2B2B2' },
      ],
      sizes:     ['XS','S','M','L','XL','XXL'],
      basePrice: 1999, // PKR
      sizePricing: { XL: 200, XXL: 400 }, // PKR surcharges
    });
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

// ── PUT /api/shirt-config — admin full update ─────────────────
router.put('/', auth, admin, async (req, res) => {
  try {
    const { colors, sizes, basePrice, sizePricing } = req.body;
    let cfg = await getConfig();
    if (colors      !== undefined) cfg.colors      = colors;
    if (sizes       !== undefined) cfg.sizes        = sizes;
    if (basePrice   !== undefined) cfg.basePrice    = parseFloat(basePrice);
    if (sizePricing !== undefined) cfg.sizePricing  = sizePricing;
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-config/shirt-types — add shirt type ──────
router.post('/shirt-types', auth, admin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(422).json({ success:false, message:'Name is required.' });
    const cfg = await getConfig();
    cfg.shirtTypes.push({ name: name.trim(), image: req.body.image || null });
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── PATCH /api/shirt-config/shirt-types/:idx — update shirt type name ─
router.patch('/shirt-types/:idx', auth, admin, async (req, res) => {
  try {
    const cfg = await getConfig();
    const idx = Number(req.params.idx);
    if (!cfg.shirtTypes[idx]) return res.status(404).json({ success:false, message:'Shirt type not found.' });
    const { name, image } = req.body;
    if (name  !== undefined) cfg.shirtTypes[idx].name  = name.trim();
    if (image !== undefined) cfg.shirtTypes[idx].image = image;
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── DELETE /api/shirt-config/shirt-types/:idx ────────────────
router.delete('/shirt-types/:idx', auth, admin, async (req, res) => {
  try {
    const cfg = await getConfig();
    const idx = Number(req.params.idx);
    if (!cfg.shirtTypes[idx]) return res.status(404).json({ success:false, message:'Not found.' });
    // Delete old image from cloudinary
    const oldImg = cfg.shirtTypes[idx].image;
    if (oldImg) await deleteByUrl(oldImg).catch(() => {});
    cfg.shirtTypes.splice(idx, 1);
    cfg.markModified('shirtTypes');
    await cfg.save();
    ok(res, { config: cfg });
  } catch (e) { err(res, e); }
});

// ── POST /api/shirt-config/shirt-types/:idx/image — upload image ─
router.post('/shirt-types/:idx/image', auth, admin, (req, res) => {
  uploadProduct.single('image')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success:false, message: uploadErr.message });
    if (!req.file) return res.status(400).json({ success:false, message: 'No file received.' });
    try {
      const cfg = await getConfig();
      const idx = Number(req.params.idx);
      if (!cfg.shirtTypes[idx]) return res.status(404).json({ success:false, message:'Not found.' });
      // Delete old image
      const oldImg = cfg.shirtTypes[idx].image;
      if (oldImg) await deleteByUrl(oldImg).catch(() => {});
      cfg.shirtTypes[idx].image = req.file.path;
      cfg.markModified('shirtTypes');
      await cfg.save();
      ok(res, { config: cfg, url: req.file.path });
    } catch (e) { err(res, e); }
  });
});

module.exports = router;

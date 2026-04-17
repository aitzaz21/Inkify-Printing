const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Allowed mime types ────────────────────────────────────────
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES  = 5 * 1024 * 1024; // 5 MB

// ── Factory: create a multer middleware for a given folder ────
const createUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:         `inkify/${folder}`,
      allowed_formats: ALLOWED_FORMATS,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      public_id:      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
  });

  return multer({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      const ext = file.mimetype.split('/')[1].toLowerCase();
      if (ALLOWED_FORMATS.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
      }
    },
  });
};

// ── Pre-built uploaders ────────────────────────────────────────
const uploadDesign  = createUploader('designs');   // user design uploads
const uploadProduct = createUploader('products');  // admin product mockups
const uploadHero    = createUploader('hero');       // admin homepage images

// ── Delete a cloudinary asset by URL ──────────────────────────
const deleteByUrl = async (url) => {
  if (!url) return;
  try {
    // Extract public_id from URL (everything after /upload/ and before extension)
    const parts  = url.split('/upload/');
    if (parts.length < 2) return;
    const withVersion = parts[1]; // e.g. v1234/inkify/designs/abc123.jpg
    const noVersion   = withVersion.replace(/^v\d+\//, '');
    const publicId    = noVersion.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, uploadDesign, uploadProduct, uploadHero, deleteByUrl };

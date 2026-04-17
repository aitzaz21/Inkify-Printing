const express = require('express');
const router  = express.Router();
const Blog    = require('./blog.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true,  ...data });
const created = (res, data) => res.status(201).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

// ── Public ────────────────────────────────────────────────────

// GET /api/blog — published blogs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, tag } = req.query;
    const query = { isPublished: true };
    if (tag) query.tags = tag;
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('title slug excerpt image author tags publishedAt createdAt')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Blog.countDocuments(query),
    ]);
    ok(res, { blogs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e); }
});

// GET /api/blog/:slug — single blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found.' });
    ok(res, { blog });
  } catch (e) { err(res, e); }
});

// ── Admin ─────────────────────────────────────────────────────

// GET /api/blog/admin/all — all blogs (inc. drafts)
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    ok(res, { blogs });
  } catch (e) { err(res, e); }
});

// POST /api/blog — create
router.post('/', auth, admin, async (req, res) => {
  try {
    const { title, slug, content, image, excerpt, author, tags, isPublished, metaTitle, metaDescription } = req.body;
    if (!title?.trim())   return res.status(422).json({ success: false, message: 'Title is required.' });
    if (!content?.trim()) return res.status(422).json({ success: false, message: 'Content is required.' });
    if (!metaDescription?.trim()) return res.status(422).json({ success: false, message: 'Meta Description is required for SEO.' });

    // Auto-generate slug if not provided
    let finalSlug = slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) finalSlug = `${finalSlug}-${Date.now()}`;

    const blog = await Blog.create({
      title: title.trim(),
      slug: finalSlug,
      content: content.trim(),
      image: image || null,
      excerpt: excerpt?.trim() || content.substring(0, 200).trim(),
      author: author?.trim() || 'Inkify Team',
      tags: Array.isArray(tags) ? tags : (tags?.split(',').map(t => t.trim()).filter(Boolean) || []),
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      metaTitle: metaTitle?.trim() || title.trim(),
      metaDescription: metaDescription?.trim() || excerpt?.trim() || content.substring(0, 160).trim(),
    });
    created(res, { blog });
  } catch (e) { err(res, e); }
});

// PUT /api/blog/:id — update
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { title, slug, content, image, excerpt, author, tags, isPublished, metaTitle, metaDescription } = req.body;
    const update = {};
    if (title   !== undefined) update.title   = title.trim();
    if (slug    !== undefined) update.slug    = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (content !== undefined) update.content = content.trim();
    if (image   !== undefined) update.image   = image || null;
    if (excerpt !== undefined) update.excerpt = excerpt.trim();
    if (author  !== undefined) update.author  = author.trim();
    if (metaTitle       !== undefined) update.metaTitle       = metaTitle.trim();
    if (metaDescription !== undefined) update.metaDescription = metaDescription.trim();
    if (tags    !== undefined) update.tags    = Array.isArray(tags) ? tags : tags.split(',').map(t=>t.trim()).filter(Boolean);
    if (isPublished !== undefined) {
      update.isPublished = !!isPublished;
      if (isPublished) update.publishedAt = update.publishedAt || new Date();
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found.' });
    ok(res, { blog });
  } catch (e) { err(res, e); }
});

// DELETE /api/blog/:id
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    ok(res, { message: 'Blog deleted.' });
  } catch (e) { err(res, e); }
});

module.exports = router;

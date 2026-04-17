const express = require('express');
const router  = express.Router();
const Footer  = require('./footer.model');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

const ok  = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)    => res.status(e.status || 500).json({ success: false, message: e.message });

const getOrCreate = async () => {
  let footer = await Footer.findOne({ key: 'site' });
  if (!footer) {
    footer = await Footer.create({
      key: 'site',
      brandText: 'Premium print solutions crafted with precision and delivered with excellence.',
      sections: [
        {
          title: 'Company',
          links: [
            { label: 'About Us', url: '/privacy' },
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Blog', url: '/blog' },
          ],
        },
        {
          title: 'Services',
          links: [
            { label: 'Custom Shirts', url: '/designs' },
            { label: 'Design Marketplace', url: '/marketplace' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'FAQ', url: '/faq' },
            { label: 'Contact Us', url: '/faq' },
          ],
        },
      ],
      socialLinks: [
        { platform: 'twitter', url: '#' },
        { platform: 'instagram', url: '#' },
        { platform: 'linkedin', url: '#' },
      ],
      copyright: '© {year} Inkify Printing. All rights reserved.',
      bottomText: 'Crafted with precision & care.',
    });
  }
  return footer;
};

// GET /api/footer — public
router.get('/', async (req, res) => {
  try {
    const footer = await getOrCreate();
    ok(res, { footer });
  } catch (e) { err(res, e); }
});

// PUT /api/footer — admin full update
router.put('/', auth, admin, async (req, res) => {
  try {
    const { brandText, sections, socialLinks, copyright, bottomText } = req.body;
    const footer = await getOrCreate();
    if (brandText    !== undefined) footer.brandText   = brandText;
    if (sections     !== undefined) footer.sections    = sections;
    if (socialLinks  !== undefined) footer.socialLinks = socialLinks;
    if (copyright    !== undefined) footer.copyright   = copyright;
    if (bottomText   !== undefined) footer.bottomText  = bottomText;
    await footer.save();
    ok(res, { footer });
  } catch (e) { err(res, e); }
});

module.exports = router;

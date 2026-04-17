const express = require('express');
const router  = express.Router();
const ctrl    = require('./design.controller');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

// ── IMPORTANT: Specific routes BEFORE param routes ──────────
// Public
router.get('/',             ctrl.getApprovedDesigns);

// Authenticated users — must come BEFORE /:id
router.post('/',            auth, ctrl.createDesign);
router.get('/my/uploads',   auth, ctrl.getMyDesigns);

// Admin only — must come BEFORE /:id
router.get('/admin/all',    auth, admin, ctrl.getAllDesignsAdmin);
router.delete('/admin/:id', auth, admin, ctrl.adminDeleteDesign);
router.patch('/:id/approve',auth, admin, ctrl.approveDesign);
router.patch('/:id/reject', auth, admin, ctrl.rejectDesign);

// Param routes LAST
router.get('/:id',          ctrl.getDesignById);
router.put('/:id',          auth, ctrl.updateDesign);
router.delete('/:id',       auth, ctrl.deleteDesign);

module.exports = router;

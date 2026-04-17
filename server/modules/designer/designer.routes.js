const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');
const {
  getDesignerEarningsAdmin,
  getDesignerSummaries,
  markEarningsPaid,
  getTopSellingDesigns,
} = require('./designer.service');

const ok = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, e)   => res.status(e.status || 500).json({ success: false, message: e.message });

// GET /api/designer-earnings — paginated list (admin)
router.get('/', auth, admin, async (req, res) => {
  try {
    const { page, limit, designerId } = req.query;
    const data = await getDesignerEarningsAdmin({ page, limit, designerId });
    ok(res, data);
  } catch (e) { err(res, e); }
});

// GET /api/designer-earnings/summaries — per-designer summary (admin)
router.get('/summaries', auth, admin, async (req, res) => {
  try {
    const summaries = await getDesignerSummaries();
    ok(res, { summaries });
  } catch (e) { err(res, e); }
});

// GET /api/designer-earnings/top-designs — analytics
router.get('/top-designs', auth, admin, async (req, res) => {
  try {
    const designs = await getTopSellingDesigns(req.query.limit || 10);
    ok(res, { designs });
  } catch (e) { err(res, e); }
});

// PATCH /api/designer-earnings/mark-paid — mark earnings as paid
router.patch('/mark-paid', auth, admin, async (req, res) => {
  try {
    const { earningIds } = req.body;
    await markEarningsPaid(earningIds);
    ok(res, { message: 'Earnings marked as paid and designers notified.' });
  } catch (e) { err(res, e); }
});


// GET /api/designer-earnings/summaries-with-accounts — includes payment account info
router.get('/summaries-with-accounts', auth, admin, async (req, res) => {
  try {
    const DesignerEarning = require('./designer.model');
    const summaries = await DesignerEarning.aggregate([
      {
        $group: {
          _id:           '$designer',
          totalEarned:   { $sum: '$amount' },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          paidAmount:    { $sum: { $cond: [{ $eq: ['$status', 'paid']    }, '$amount', 0] } },
          totalSales:    { $sum: 1 },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'designerInfo' } },
      { $unwind: '$designerInfo' },
      {
        $project: {
          designer: {
            _id:       '$designerInfo._id',
            firstName: '$designerInfo.firstName',
            lastName:  '$designerInfo.lastName',
            email:     '$designerInfo.email',
          },
          accountDetails: '$designerInfo.paymentAccounts',
          totalEarned: 1, pendingAmount: 1, paidAmount: 1, totalSales: 1,
        },
      },
      { $sort: { pendingAmount: -1 } },
    ]);
    ok(res, { summaries });
  } catch (e) { err(res, e); }
});

module.exports = router;

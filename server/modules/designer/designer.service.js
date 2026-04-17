const mongoose     = require('mongoose');
const DesignerEarning = require('./designer.model');
const Design       = require('../design/design.model');
const { sendDesignSoldEmail, sendPaymentCompleteEmail } = require('../../utils/emailService');

// ── Called after order creation ───────────────────────────────
const recordDesignSale = async (order) => {
  for (const item of order.items) {
    if (!item.designId) continue;
    const design = await Design.findById(item.designId)
      .populate('creator', 'firstName email');
    if (!design || design.status !== 'approved') continue;

    const amount = design.price * (item.quantity || 1);
    await DesignerEarning.create({
      designer: design.creator._id,
      design:   design._id,
      order:    order._id,
      amount,
    });
    await Design.findByIdAndUpdate(design._id, { $inc: { usageCount: 1 } });

    if (design.creator?.email) {
      await sendDesignSoldEmail(
        design.creator.email,
        design.creator.firstName,
        design.title,
        amount
      ).catch(e => console.error('Design sold email error:', e.message));
    }
  }
};

// ── Admin: paginated earnings list ────────────────────────────
const getDesignerEarningsAdmin = async ({ page = 1, limit = 30, designerId } = {}) => {
  const match = {};
  if (designerId && mongoose.isValidObjectId(designerId)) {
    match.designer = new mongoose.Types.ObjectId(designerId);
  }
  const [earnings, total] = await Promise.all([
    DesignerEarning.find(match)
      .populate('designer', 'firstName lastName email')
      .populate('design',   'title imageUrl')
      .populate('order',    'orderNumber createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    DesignerEarning.countDocuments(match),
  ]);
  return { earnings, total, page: Number(page), pages: Math.ceil(total / limit) };
};

// ── Admin: per-designer aggregate summary ────────────────────
const getDesignerSummaries = async () => {
  return DesignerEarning.aggregate([
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
        totalEarned: 1, pendingAmount: 1, paidAmount: 1, totalSales: 1,
      },
    },
    { $sort: { pendingAmount: -1 } },
  ]);
};

// ── Admin: mark earnings paid & notify ───────────────────────
const markEarningsPaid = async (earningIds) => {
  if (!earningIds?.length) throw { status: 422, message: 'No earning IDs provided.' };

  await DesignerEarning.updateMany(
    { _id: { $in: earningIds }, status: 'pending' },
    { status: 'paid', paidAt: new Date() }
  );

  const earnings = await DesignerEarning.find({ _id: { $in: earningIds } })
    .populate('designer', 'firstName email');

  const notified = new Set();
  for (const e of earnings) {
    const key = String(e.designer._id);
    if (notified.has(key)) continue;
    notified.add(key);
    if (e.designer?.email) {
      const batchTotal = earnings
        .filter(x => String(x.designer._id) === key)
        .reduce((s, x) => s + x.amount, 0);
      await sendPaymentCompleteEmail(
        e.designer.email,
        e.designer.firstName,
        batchTotal
      ).catch(err => console.error('Payment email error:', err.message));
    }
  }
};

// ── Admin: top-selling designs for analytics ─────────────────
const getTopSellingDesigns = async (limit = 10) => {
  return DesignerEarning.aggregate([
    { $group: { _id: '$design', sales: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    { $sort: { sales: -1, revenue: -1 } },
    { $limit: Number(limit) },
    { $lookup: { from: 'designs', localField: '_id', foreignField: '_id', as: 'design' } },
    { $unwind: '$design' },
    {
      $lookup: {
        from: 'users',
        localField: 'design.creator',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        sales: 1, revenue: 1,
        design: {
          _id:        '$design._id',
          title:      '$design.title',
          imageUrl:   '$design.imageUrl',
          likes:      '$design.likes',
          usageCount: '$design.usageCount',
        },
        creator: {
          firstName: '$creator.firstName',
          lastName:  '$creator.lastName',
        },
      },
    },
  ]);
};

module.exports = {
  recordDesignSale,
  getDesignerEarningsAdmin,
  getDesignerSummaries,
  markEarningsPaid,
  getTopSellingDesigns,
};

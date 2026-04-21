const mongoose     = require('mongoose');
const DesignerEarning = require('./designer.model');
const WithdrawalRequest = require('./withdrawal.model');
const Design       = require('../design/design.model');
const { sendDesignSoldEmail, sendPaymentCompleteEmail, sendWithdrawalStatusEmail } = require('../../utils/emailService');

// ── Called after order creation ───────────────────────────────
const recordDesignSale = async (order) => {
  for (const item of order.items) {
    if (!item.designId) continue;
    const design = await Design.findById(item.designId).populate('creator', 'firstName email');
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

// ── User-facing: get my earnings dashboard data ───────────────
const getMyEarnings = async (userId) => {
  const [summary, byDesign, recentHistory, withdrawals] = await Promise.all([
    DesignerEarning.aggregate([
      { $match: { designer: new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id: null,
        totalEarned:    { $sum: '$amount' },
        pendingAmount:  { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, '$amount', 0] } },
        paidAmount:     { $sum: { $cond: [{ $eq: ['$status', 'paid']     }, '$amount', 0] } },
        reversedAmount: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0] } },
        totalSales:     { $sum: 1 },
        reversedCount:  { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
      }},
    ]),
    DesignerEarning.aggregate([
      { $match: { designer: new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id:            '$design',
        totalEarned:    { $sum: '$amount' },
        pendingAmount:  { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, '$amount', 0] } },
        paidAmount:     { $sum: { $cond: [{ $eq: ['$status', 'paid']     }, '$amount', 0] } },
        reversedAmount: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0] } },
        salesCount:     { $sum: 1 },
        reversedCount:  { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
      }},
      { $lookup: { from: 'designs', localField: '_id', foreignField: '_id', as: 'design' } },
      { $unwind: { path: '$design', preserveNullAndEmptyArrays: true } },
      { $sort: { totalEarned: -1 } },
    ]),
    DesignerEarning.find({ designer: userId })
      .populate('design', 'title imageUrl')
      .populate('order', 'orderNumber createdAt isReversed')
      .sort({ createdAt: -1 })
      .limit(20),
    WithdrawalRequest.find({ designer: userId })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  return {
    summary: summary[0] || { totalEarned: 0, pendingAmount: 0, paidAmount: 0, reversedAmount: 0, totalSales: 0, reversedCount: 0 },
    byDesign,
    recentHistory,
    withdrawals,
  };
};

// ── User: request withdrawal ──────────────────────────────────
const requestWithdrawal = async (userId, paymentAccount) => {
  const User = require('../user/user.model');
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found.' };

  // Find all pending earnings
  const pendingEarnings = await DesignerEarning.find({ designer: userId, status: 'pending' });
  if (!pendingEarnings.length) throw { status: 400, message: 'No pending earnings to withdraw.' };

  const totalAmount = pendingEarnings.reduce((s, e) => s + e.amount, 0);
  if (totalAmount <= 0) throw { status: 400, message: 'No earnings available to withdraw.' };

  // Check for existing pending withdrawal request
  const existingPending = await WithdrawalRequest.findOne({ designer: userId, status: 'pending' });
  if (existingPending) throw { status: 400, message: 'You already have a pending withdrawal request.' };

  const account = paymentAccount || user.paymentAccounts?.find(a => a.isPrimary) || user.paymentAccounts?.[0];
  if (!account) throw { status: 400, message: 'Please add a payment account first.' };

  const request = await WithdrawalRequest.create({
    designer: userId,
    amount:   totalAmount,
    paymentAccount: {
      method:        account.method,
      accountName:   account.accountName,
      accountNumber: account.accountNumber,
    },
    earningIds: pendingEarnings.map(e => e._id),
  });

  return request;
};

// ── Admin: get all withdrawal requests ───────────────────────
const getWithdrawalRequests = async ({ status, page = 1, limit = 20 } = {}) => {
  const query = status ? { status } : {};
  const [requests, total] = await Promise.all([
    WithdrawalRequest.find(query)
      .populate('designer', 'firstName lastName email avatar paymentAccounts')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    WithdrawalRequest.countDocuments(query),
  ]);
  return { requests, total, page: Number(page), pages: Math.ceil(total / limit) };
};

// ── Admin: approve withdrawal ─────────────────────────────────
const approveWithdrawal = async (requestId, adminId, adminNote) => {
  const request = await WithdrawalRequest.findById(requestId).populate('designer', 'firstName lastName email');
  if (!request) throw { status: 404, message: 'Withdrawal request not found.' };
  if (request.status !== 'pending') throw { status: 400, message: 'Request is already processed.' };

  await DesignerEarning.updateMany(
    { _id: { $in: request.earningIds }, status: 'pending' },
    { status: 'paid', paidAt: new Date() }
  );

  await WithdrawalRequest.findByIdAndUpdate(requestId, {
    status:      'approved',
    adminNote:   adminNote || '',
    processedAt: new Date(),
    processedBy: adminId,
  });

  if (request.designer?.email) {
    await sendWithdrawalStatusEmail(
      request.designer.email,
      request.designer.firstName,
      request.amount,
      'approved',
      adminNote
    ).catch(e => console.error('Withdrawal email error:', e.message));
  }

  return WithdrawalRequest.findById(requestId).populate('designer', 'firstName lastName email');
};

// ── Admin: reject withdrawal ──────────────────────────────────
const rejectWithdrawal = async (requestId, adminId, adminNote) => {
  const request = await WithdrawalRequest.findById(requestId).populate('designer', 'firstName lastName email');
  if (!request) throw { status: 404, message: 'Withdrawal request not found.' };
  if (request.status !== 'pending') throw { status: 400, message: 'Request is already processed.' };

  await WithdrawalRequest.findByIdAndUpdate(requestId, {
    status:      'rejected',
    adminNote:   adminNote || '',
    processedAt: new Date(),
    processedBy: adminId,
  });

  if (request.designer?.email) {
    await sendWithdrawalStatusEmail(
      request.designer.email,
      request.designer.firstName,
      request.amount,
      'rejected',
      adminNote
    ).catch(e => console.error('Withdrawal rejection email error:', e.message));
  }

  return WithdrawalRequest.findById(requestId).populate('designer', 'firstName lastName email');
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
      .populate('order',    'orderNumber createdAt isReversed')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    DesignerEarning.countDocuments(match),
  ]);
  return { earnings, total, page: Number(page), pages: Math.ceil(total / limit) };
};

// ── Admin: per-designer aggregate summary with payment accounts ──
const getDesignerSummaries = async () => {
  const User = require('../user/user.model');
  const summaries = await DesignerEarning.aggregate([
    {
      $group: {
        _id:             '$designer',
        totalEarned:     { $sum: '$amount' },
        pendingAmount:   { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, '$amount', 0] } },
        paidAmount:      { $sum: { $cond: [{ $eq: ['$status', 'paid']     }, '$amount', 0] } },
        reversedAmount:  { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0] } },
        totalSales:      { $sum: 1 },
        reversedSales:   { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'designerInfo' } },
    { $unwind: '$designerInfo' },
    {
      $project: {
        designer: {
          _id:             '$designerInfo._id',
          firstName:       '$designerInfo.firstName',
          lastName:        '$designerInfo.lastName',
          email:           '$designerInfo.email',
          paymentAccounts: '$designerInfo.paymentAccounts',
        },
        totalEarned: 1, pendingAmount: 1, paidAmount: 1, reversedAmount: 1, totalSales: 1, reversedSales: 1,
      },
    },
    { $sort: { pendingAmount: -1 } },
  ]);
  return summaries;
};

// ── Admin: mark earnings paid (legacy direct payout) ─────────
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
      await sendPaymentCompleteEmail(e.designer.email, e.designer.firstName, batchTotal)
        .catch(err => console.error('Payment email error:', err.message));
    }
  }
};

// ── Admin: top-selling designs for analytics ─────────────────
const getTopSellingDesigns = async (limit = 10) => {
  return DesignerEarning.aggregate([
    { $match: { status: { $ne: 'reversed' } } },
    { $group: { _id: '$design', sales: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    { $sort: { sales: -1, revenue: -1 } },
    { $limit: Number(limit) },
    { $lookup: { from: 'designs', localField: '_id', foreignField: '_id', as: 'design' } },
    { $unwind: '$design' },
    { $lookup: { from: 'users', localField: 'design.creator', foreignField: '_id', as: 'creator' } },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        sales: 1, revenue: 1,
        design:  { _id: '$design._id', title: '$design.title', imageUrl: '$design.imageUrl', usageCount: '$design.usageCount' },
        creator: { firstName: '$creator.firstName', lastName: '$creator.lastName' },
      },
    },
  ]);
};

// ── Admin: list all users who have designs ────────────────────
const getDesignerList = async () => {
  const Design = require('../design/design.model');

  const designAgg = await Design.aggregate([
    {
      $group: {
        _id:             '$creator',
        totalDesigns:    { $sum: 1 },
        approvedDesigns: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pendingDesigns:  { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, 1, 0] } },
        rejectedDesigns: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $sort: { approvedDesigns: -1, totalDesigns: -1 } },
  ]);

  const earningsAgg = await DesignerEarning.aggregate([
    {
      $group: {
        _id:           '$designer',
        totalEarned:   { $sum: '$amount' },
        pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        paidAmount:    { $sum: { $cond: [{ $eq: ['$status', 'paid']    }, '$amount', 0] } },
        totalSales:    { $sum: 1 },
      },
    },
  ]);
  const earningsMap = {};
  earningsAgg.forEach(e => { earningsMap[String(e._id)] = e; });

  const wAgg = await WithdrawalRequest.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: '$designer', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);
  const wMap = {};
  wAgg.forEach(w => { wMap[String(w._id)] = w; });

  return designAgg.map(d => ({
    _id: d._id,
    user: {
      _id:       d.user._id,
      firstName: d.user.firstName,
      lastName:  d.user.lastName,
      email:     d.user.email,
      avatar:    d.user.avatar,
      createdAt: d.user.createdAt,
    },
    designs: {
      total:    d.totalDesigns,
      approved: d.approvedDesigns,
      pending:  d.pendingDesigns,
      rejected: d.rejectedDesigns,
    },
    earnings:    earningsMap[String(d._id)] || { totalEarned: 0, pendingAmount: 0, paidAmount: 0, totalSales: 0 },
    withdrawals: wMap[String(d._id)]        || { count: 0, amount: 0 },
  }));
};

// ── Admin: full profile for one designer ─────────────────────
const getDesignerProfile = async (userId) => {
  const Design = require('../design/design.model');
  const User   = require('../user/user.model');

  const [user, designs, earnings, withdrawals, summaryArr] = await Promise.all([
    User.findById(userId).select('firstName lastName email avatar createdAt paymentAccounts'),
    Design.find({ creator: userId }).sort({ createdAt: -1 }).select('title imageUrl status price usageCount createdAt'),
    DesignerEarning.find({ designer: userId })
      .populate('design', 'title imageUrl')
      .populate('order', 'orderNumber createdAt isReversed')
      .sort({ createdAt: -1 }).limit(50),
    WithdrawalRequest.find({ designer: userId }).sort({ createdAt: -1 }).limit(30),
    DesignerEarning.aggregate([
      { $match: { designer: new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id:            null,
        totalEarned:    { $sum: '$amount' },
        pendingAmount:  { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, '$amount', 0] } },
        paidAmount:     { $sum: { $cond: [{ $eq: ['$status', 'paid']     }, '$amount', 0] } },
        reversedAmount: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0] } },
        totalSales:     { $sum: 1 },
        reversedCount:  { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
      }},
    ]),
  ]);

  if (!user) throw { status: 404, message: 'Designer not found.' };

  return {
    user,
    designs,
    earnings,
    withdrawals,
    summary: summaryArr[0] || { totalEarned: 0, pendingAmount: 0, paidAmount: 0, reversedAmount: 0, totalSales: 0, reversedCount: 0 },
  };
};

module.exports = {
  recordDesignSale,
  getMyEarnings,
  requestWithdrawal,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  getDesignerEarningsAdmin,
  getDesignerSummaries,
  markEarningsPaid,
  getTopSellingDesigns,
  getDesignerList,
  getDesignerProfile,
};

const Order  = require('./order.model');
const { sendOrderEmail } = require('../../utils/emailService');
const { recordDesignSale } = require('../designer/designer.service');

const createOrder = async (userId, body) => {
  const { items, shippingAddress, paymentMethod, cardDetails } = body;
  if (!items?.length) throw { status: 422, message: 'Order must have at least one item.' };
  if (!shippingAddress?.phone?.trim()) throw { status: 422, message: 'Phone number is required.' };

  try {
    const User = require('../user/user.model');
    await User.findByIdAndUpdate(userId, { phone: shippingAddress.phone.trim() });
  } catch (e) { console.error('Phone update error:', e.message); }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 300;
  const total    = subtotal + shipping;

  for (const i of items) {
    if (!i.productName?.trim()) throw { status: 422, message: 'Each item must have a productName.' };
    if (!i.color?.trim())       throw { status: 422, message: 'Each item must have a color.' };
    if (!i.size?.trim())        throw { status: 422, message: 'Each item must have a size.' };
    if (!i.quantity || i.quantity < 1) throw { status: 422, message: 'Quantity must be at least 1.' };
    if (i.unitPrice == null || isNaN(i.unitPrice)) throw { status: 422, message: 'Each item must have a unitPrice.' };
  }

  const order = await Order.create({
    user: userId,
    items: items.map(i => ({
      product:     (i.product && i.product !== 'custom') ? i.product : null,
      productName: i.productName,
      shirtType:   i.shirtType || '',
      color:       i.color,
      colorHex:    i.colorHex || '#FFFFFF',
      size:        i.size,
      quantity:    i.quantity,
      unitPrice:   i.unitPrice,
      designUrl:   i.designUrl || null,
      designId:    i.designId  || null,
      designNote:  i.designNote || '',
    })),
    subtotal:        Math.round(subtotal * 100) / 100,
    shipping:        Math.round(shipping * 100) / 100,
    total:           Math.round(total    * 100) / 100,
    shippingAddress,
    paymentMethod:   paymentMethod || 'cod',
  });

  await order.populate('user', 'firstName lastName email');

  if (paymentMethod === 'card' && cardDetails?.transactionId) {
    await Order.findByIdAndUpdate(order._id, {
      paymentStatus:    'paid',
      status:           'confirmed',
      confirmedAt:      new Date(),
      transactionId:    cardDetails.transactionId,
      paymentReference: cardDetails.reference || '',
    });
    order.paymentStatus = 'paid';
    order.status        = 'confirmed';
  }

  try { await recordDesignSale(order); } catch (e) { console.error('Earnings record error:', e.message); }

  await sendOrderEmail('placed', order);

  return order;
};

const getUserOrders = async (userId) => {
  return Order.find({ user: userId })
    .populate('items.product', 'name image')
    .sort({ createdAt: -1 });
};

const getOrderById = async (orderId, userId) => {
  const query = { _id: orderId };
  if (userId) query.user = userId;
  const order = await Order.findOne(query)
    .populate('items.product', 'name image colors')
    .populate('items.designId', 'title imageUrl creator');
  if (!order) throw { status: 404, message: 'Order not found.' };
  return order;
};

const getAllOrders = async ({ status, page = 1, limit = 20, reversed } = {}) => {
  const query = {};
  if (status) query.status = status;
  if (reversed === 'true') query.isReversed = true;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.designId', 'title imageUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const updateOrderStatus = async (orderId, status, adminNote) => {
  const allowed = ['pending','confirmed','processing','dispatched','delivered','cancelled'];
  if (!allowed.includes(status)) throw { status: 422, message: 'Invalid status.' };

  const update = { status };
  if (adminNote !== undefined) update.adminNote = adminNote;
  if (status === 'confirmed')  update.confirmedAt  = new Date();
  if (status === 'dispatched') update.dispatchedAt = new Date();
  if (status === 'delivered')  update.deliveredAt  = new Date();

  const order = await Order.findByIdAndUpdate(orderId, update, { new: true })
    .populate('user', 'firstName lastName email');
  if (!order) throw { status: 404, message: 'Order not found.' };

  if (['confirmed','dispatched','delivered'].includes(status)) {
    await sendOrderEmail(status, order);
  }

  return order;
};

const reverseOrder = async (orderId, reason) => {
  const DesignerEarning = require('../designer/designer.model');
  const { sendOrderReversalEmail } = require('../../utils/emailService');

  const order = await Order.findById(orderId).populate('user', 'firstName lastName email');
  if (!order) throw { status: 404, message: 'Order not found.' };
  if (order.isReversed) throw { status: 400, message: 'Order is already reversed.' };

  await Order.findByIdAndUpdate(orderId, {
    isReversed:     true,
    reversalReason: reason || 'Reversed by admin',
    reversedAt:     new Date(),
    status:         'reversed',
  });

  // Reverse all pending designer earnings for this order
  await DesignerEarning.updateMany(
    { order: orderId, status: 'pending' },
    { status: 'reversed', reversedAt: new Date(), reversalReason: reason || 'Order reversed' }
  );

  // Notify customer
  try {
    await sendOrderReversalEmail(order, reason);
  } catch (e) { console.error('Reversal email error:', e.message); }

  return Order.findById(orderId).populate('user', 'firstName lastName email');
};

const getAdminStats = async () => {
  const User = require('../user/user.model');
  const Design = require('../design/design.model');
  const DesignerEarning = require('../designer/designer.model');
  const WithdrawalRequest = require('../designer/withdrawal.model');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalOrders, totalUsers, totalDesigns, revenue,
    statusBreakdown, monthlyRevenue, designerPayouts,
    newUsersThisMonth, revenueThisMonth, pendingDesigns,
    reversedOrders, pendingWithdrawals, dailyRevenue,
  ] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Design.countDocuments({ status: 'approved' }),
    Order.aggregate([{ $match: { paymentStatus: 'paid', isReversed: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', isReversed: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 12 },
    ]),
    DesignerEarning.aggregate([
      { $group: {
        _id: null,
        totalPaid:     { $sum: { $cond: [{ $eq: ['$status', 'paid'] },     '$amount', 0] } },
        totalPending:  { $sum: { $cond: [{ $eq: ['$status', 'pending'] },  '$amount', 0] } },
        totalReversed: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0] } },
      }},
    ]),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth }, isReversed: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Design.countDocuments({ status: 'pending' }),
    Order.countDocuments({ isReversed: true }),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }, isReversed: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const recentOrders = await Order.find()
    .populate('user','firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(8);

  const recentWithdrawals = await WithdrawalRequest.find({ status: 'pending' })
    .populate('designer', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(5);

  const statusMap = {};
  statusBreakdown.forEach(s => { statusMap[s._id] = s.count; });

  return {
    totalOrders,
    totalUsers,
    totalDesigns,
    revenue:              revenue[0]?.total || 0,
    revenueThisMonth:     revenueThisMonth[0]?.total || 0,
    newUsersThisMonth,
    pendingDesigns,
    reversedOrders,
    pendingWithdrawals,
    pendingOrders:    statusMap.pending    || 0,
    confirmedOrders:  statusMap.confirmed  || 0,
    processingOrders: statusMap.processing || 0,
    dispatchedOrders: statusMap.dispatched || 0,
    deliveredOrders:  statusMap.delivered  || 0,
    cancelledOrders:  statusMap.cancelled  || 0,
    monthlyRevenue,
    dailyRevenue,
    designerPayouts:  designerPayouts[0] || { totalPaid: 0, totalPending: 0, totalReversed: 0 },
    recentOrders,
    recentWithdrawals,
  };
};

module.exports = { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, reverseOrder, getAdminStats };

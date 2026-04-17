const Order  = require('./order.model');
const { sendOrderEmail } = require('../../utils/emailService');
const { recordDesignSale } = require('../designer/designer.service');

const createOrder = async (userId, body) => {
  const { items, shippingAddress, paymentMethod, cardDetails } = body;
  if (!items?.length) throw { status: 422, message: 'Order must have at least one item.' };
  if (!shippingAddress?.phone?.trim()) throw { status: 422, message: 'Phone number is required.' };

  // Update user profile with phone if provided
  try {
    const User = require('../user/user.model');
    await User.findByIdAndUpdate(userId, { phone: shippingAddress.phone.trim() });
  } catch (e) { console.error('Phone update error:', e.message); }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 300; // PKR: free above PKR 5000, else PKR 300
  const total    = subtotal + shipping;

  // Validate items minimally
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
      // product is null for custom shirt orders; only set when a real DB product is referenced
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

  // If card payment — mark paid immediately (PayFast processed on backend)
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

  // Record designer earnings for marketplace designs
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

// Admin
const getAllOrders = async ({ status, page = 1, limit = 20 } = {}) => {
  const query = status ? { status } : {};
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

const getAdminStats = async () => {
  const User = require('../user/user.model');
  const Design = require('../design/design.model');
  const DesignerEarning = require('../designer/designer.model');

  const [totalOrders, totalUsers, totalDesigns, revenue, statusBreakdown, monthlyRevenue, designerPayouts] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Design.countDocuments({ status: 'approved' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    DesignerEarning.aggregate([
      { $group: {
        _id: null,
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
      }},
    ]),
  ]);

  const recentOrders = await Order.find()
    .populate('user','firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(5);

  const statusMap = {};
  statusBreakdown.forEach(s => { statusMap[s._id] = s.count; });

  return {
    totalOrders,
    totalUsers,
    totalDesigns,
    revenue:        revenue[0]?.total || 0,
    pendingOrders:  statusMap.pending   || 0,
    confirmedOrders: statusMap.confirmed || 0,
    processingOrders: statusMap.processing || 0,
    dispatchedOrders: statusMap.dispatched || 0,
    deliveredOrders: statusMap.delivered  || 0,
    cancelledOrders: statusMap.cancelled  || 0,
    monthlyRevenue,
    designerPayouts: designerPayouts[0] || { totalPaid: 0, totalPending: 0 },
    recentOrders,
  };
};

module.exports = { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, getAdminStats };

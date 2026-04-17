const orderService = require('./order.service');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    respond(res, 201, { order });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user._id);
    respond(res, 200, { orders });
  } catch (err) {
    respond(res, 500, { message: err.message });
  }
};

const getMyOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);
    respond(res, 200, { order });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

// Admin
const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    respond(res, 200, result);
  } catch (err) {
    respond(res, 500, { message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    respond(res, 200, { order });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, adminNote);
    respond(res, 200, { order });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const stats = await orderService.getAdminStats();
    respond(res, 200, { stats });
  } catch (err) {
    respond(res, 500, { message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getMyOrder, getAllOrders, getOrderById, updateOrderStatus, getAdminStats };

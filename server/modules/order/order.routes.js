const express = require('express');
const router  = express.Router();
const ctrl    = require('./order.controller');
const auth    = require('../../middleware/authMiddleware');
const admin   = require('../../middleware/adminMiddleware');

// User routes
router.post('/',          auth, ctrl.createOrder);
router.get('/my',         auth, ctrl.getMyOrders);
router.get('/my/:id',     auth, ctrl.getMyOrder);

// Admin routes
router.get('/stats',      auth, admin, ctrl.getAdminStats);
router.get('/',           auth, admin, ctrl.getAllOrders);
router.get('/:id',        auth, admin, ctrl.getOrderById);
router.patch('/:id/status',  auth, admin, ctrl.updateOrderStatus);
router.patch('/:id/reverse', auth, admin, ctrl.reverseOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

// All order routes require authentication
router.use(protect);

// Create order and Razorpay transaction
router.post('/create-payment-order', createPaymentOrder);

// Verify payment signature and finalize order
router.post('/verify-payment', verifyPayment);

// List authenticated user's orders
router.get('/', getMyOrders);

// Get single order details
router.get('/:id', getOrderById);

// Bonus: Update order status
router.patch('/:id/status', updateOrderStatus);

module.exports = router;

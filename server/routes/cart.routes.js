const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// All cart endpoints are protected
router.use(protect);

// GET  /cart             — Get current user's cart
router.get('/', getCart);

// POST /cart/:productId  — Add product (or increment qty)
router.post('/:productId', addToCart);

// PATCH /cart/:productId — Update quantity
router.patch('/:productId', updateCartQuantity);

// DELETE /cart/:productId — Remove one product
router.delete('/:productId', removeFromCart);

// DELETE /cart           — Clear entire cart
router.delete('/', clearCart);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
} = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

// All wishlist endpoints are protected
router.use(protect);

// GET /wishlist - Get current user's wishlist
router.get('/', getWishlist);

// POST /wishlist/:productId - Add product to wishlist
router.post('/:productId', addToWishlist);

// DELETE /wishlist/:productId - Remove product from wishlist
router.delete('/:productId', removeFromWishlist);

// PATCH /wishlist/:productId/toggle - Toggle wishlist status (Bonus)
router.patch('/:productId/toggle', toggleWishlist);

module.exports = router;

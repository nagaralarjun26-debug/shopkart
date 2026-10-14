const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Add product to authenticated user's wishlist
 * @route   POST /wishlist/:productId
 * @access  Private (Protected by auth middleware)
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Verify product exists in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Load customer from database
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Customer not found'
      });
    }

    // Prevent duplicate entries
    const isAlreadySaved = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadySaved) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add product ObjectId reference to wishlist
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding product to wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Get authenticated user's populated wishlist
 * @route   GET /wishlist
 * @access  Private (Protected by auth middleware)
 */
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name description price category image stock'
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Customer not found'
      });
    }

    // Filter out null references (if referenced product was deleted)
    const validWishlist = (customer.wishlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist
    });
  } catch (error) {
    console.error('Error in getWishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Remove product from authenticated user's wishlist
 * @route   DELETE /wishlist/:productId
 * @access  Private (Protected by auth middleware)
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Customer not found'
      });
    }

    // Check if product is in user's wishlist
    const wishIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (wishIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist'
      });
    }

    // Remove reference from array and save
    customer.wishlist.splice(wishIndex, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while removing product from wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle product in authenticated user's wishlist (Bonus Challenge)
 * @route   PATCH /wishlist/:productId/toggle
 * @access  Private (Protected by auth middleware)
 */
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Customer not found'
      });
    }

    const wishIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (wishIndex !== -1) {
      // Already saved -> Remove
      customer.wishlist.splice(wishIndex, 1);
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: false,
        message: 'Product removed from wishlist'
      });
    } else {
      // Not saved -> Add
      customer.wishlist.push(productId);
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: true,
        message: 'Product added to wishlist'
      });
    }
  } catch (error) {
    console.error('Error in toggleWishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while toggling wishlist state',
      error: error.message
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
};

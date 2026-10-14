const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Add product to cart (or increment quantity by 1 if already exists)
 * @route   POST /cart/:productId
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // Increment quantity by 1
      const newQty = existingItem.quantity + 1;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available in stock`
        });
      }
      existingItem.quantity = newQty;
    } else {
      // New entry — quantity = 1
      if (product.stock < 1) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();

    // Populate and return updated cart
    const populated = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: populated.cart
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get authenticated user's populated cart
 * @route   GET /cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name description price category image stock'
    });

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Filter out any entries where the referenced product was deleted
    const validCart = customer.cart.filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      count: validCart.length,
      cart: validCart
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update quantity of a specific cart item
 * @route   PATCH /cart/:productId
 * @access  Private
 */
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid integer' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    cartItem.quantity = quantity;
    await customer.save();

    const populated = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated',
      cart: populated.cart
    });
  } catch (error) {
    console.error('Error in updateCartQuantity:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Remove a product from cart
 * @route   DELETE /cart/:productId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const index = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    customer.cart.splice(index, 1);
    await customer.save();

    const populated = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: populated.cart
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Clear all items from cart
 * @route   DELETE /cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: []
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { addToCart, getCart, updateCartQuantity, removeFromCart, clearCart };

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const { cartItems, cartCount, subtotal, cartLoading, cartError, fetchCart, emptyCart } = useCart();

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(subtotal);

  // 1. Loading State
  if (cartLoading) {
    return (
      <div className="wishlist-state-container" id="cart-loading-state">
        <div className="loading-spinner-box">
          <Loader2 size={40} className="spin-icon" style={{ color: 'var(--primary)' }} />
          <p className="loading-text">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (cartError) {
    return (
      <div className="wishlist-state-container" id="cart-error-state">
        <div className="state-card error-card">
          <AlertCircle size={48} style={{ color: 'var(--error)', marginBottom: '1rem' }} />
          <h2>Something went wrong</h2>
          <p>Unable to load your cart. Please try again.</p>
          <button onClick={fetchCart} className="btn-retry">
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (cartItems.length === 0) {
    return (
      <div className="wishlist-state-container" id="cart-empty-state">
        <div className="state-card empty-card">
          <div className="empty-heart-icon">
            <ShoppingCart size={56} color="#6366f1" />
          </div>
          <h2>Your cart is empty 🛒</h2>
          <p>Looks like you haven't added anything yet. Start shopping!</p>
          <Link to="/products" className="btn-browse-products">
            <ShoppingCart size={18} />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // 4. Cart with items
  return (
    <div className="cart-page-container">
      {/* Header */}
      <div className="cart-page-header">
        <div>
          <h1>My Cart</h1>
          <p className="wishlist-count-badge">{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={emptyCart}
            className="btn-clear-cart"
            title="Remove all items"
          >
            <Trash2 size={15} />
            Clear Cart
          </button>
          <Link to="/products" className="btn-continue-shopping">
            Explore More
          </Link>
        </div>
      </div>

      {/* Main Layout */}
      <div className="cart-layout">
        {/* Cart Items List */}
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <CartItem key={item.product?._id} item={item} />
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="cart-summary-card">
          <h2 className="cart-summary-title">Order Summary</h2>

          <div className="cart-summary-row">
            <span>Items</span>
            <span>{cartCount}</span>
          </div>

          <div className="cart-summary-row">
            <span>Delivery</span>
            <span className="cart-free-tag">FREE</span>
          </div>

          <div className="cart-summary-divider" />

          <div className="cart-summary-row cart-summary-total">
            <span>Subtotal</span>
            <span>{formattedSubtotal}</span>
          </div>

          <Link to="/checkout" className="btn-checkout" id="proceed-checkout-btn">
            <ArrowRight size={18} />
            Proceed to Checkout
          </Link>

          <Link to="/products" className="cart-continue-link">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;

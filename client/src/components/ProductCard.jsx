import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Tag, PackageCheck, AlertTriangle, Heart, Loader2, ShoppingCart } from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, isWishlistedInitial = false, onWishlistChange }) => {
  const { _id, name, price, category, image, stock } = product;
  const { addItem, isInCart } = useCart();

  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cartMsg, setCartMsg] = useState(null);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  const isOutOfStock = stock <= 0;
  const inCart = isInCart(_id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setErrorMsg(null);
    try {
      if (isWishlisted) {
        await removeFromWishlist(_id);
        setIsWishlisted(false);
        if (onWishlistChange) onWishlistChange(_id, false);
      } else {
        await addToWishlist(_id);
        setIsWishlisted(true);
        if (onWishlistChange) onWishlistChange(_id, true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setIsWishlisted(true);
      } else {
        setErrorMsg('Unable to save. Please try again.');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartLoading || isOutOfStock) return;
    setCartLoading(true);
    setCartMsg(null);
    const result = await addItem(_id);
    if (!result.success) {
      setCartMsg(result.message || 'Failed to add to cart');
    }
    setCartLoading(false);
  };

  return (
    <div className="product-card">
      <div className="card-image-container">
        <img
          src={image}
          alt={name}
          className="card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <span className="card-category-badge">
          <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
          {category}
        </span>

        {/* Heart quick action */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`wishlist-heart-badge ${isWishlisted ? 'active' : ''}`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={18} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#64748b'} />
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title" title={name}>{name}</h3>

        <div className="card-meta">
          <div className="card-price">{formattedPrice}</div>
          <div className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? (
              <><AlertTriangle size={13} /> Out of Stock</>
            ) : (
              <><PackageCheck size={13} /> {stock} {stock === 1 ? 'unit left' : 'units left'}</>
            )}
          </div>
        </div>

        {(errorMsg || cartMsg) && (
          <div className="card-error-feedback" role="alert">
            {errorMsg || cartMsg}
          </div>
        )}

        <div className="card-actions">
          <Link to={`/products/${_id}`} className="btn-view-details">
            <Eye size={16} />
            View Details
          </Link>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartLoading || isOutOfStock}
            className={`btn-add-to-cart-card ${inCart ? 'in-cart' : ''}`}
          >
            {cartLoading ? (
              <><Loader2 size={16} className="spin-icon" /> Adding...</>
            ) : inCart ? (
              <><ShoppingCart size={16} /> Add Another</>
            ) : (
              <><ShoppingCart size={16} /> Add to Cart</>
            )}
          </button>

          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`btn-wishlist-action ${isWishlisted ? 'saved' : ''}`}
          >
            {wishlistLoading ? (
              <><Loader2 size={16} className="spin-icon" /> Saving...</>
            ) : isWishlisted ? (
              <><Heart size={16} fill="#ef4444" color="#ef4444" /> ♥ Wishlisted</>
            ) : (
              <><Heart size={16} /> ♡ Wishlist</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

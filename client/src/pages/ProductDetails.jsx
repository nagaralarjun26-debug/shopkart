import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getWishlist, addToWishlist, removeFromWishlist } from '../services/api';
import {
  ArrowLeft,
  ShoppingCart,
  Tag,
  PackageCheck,
  AlertTriangle,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
  Heart,
  Loader2
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartSuccessMessage, setCartSuccessMessage] = useState('');

  // Wishlist state for single product
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);

  useEffect(() => {
    const fetchSingleProductAndWishlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        if (data.success && data.product) {
          setProduct(data.product);

          // Check if product is in user's wishlist
          try {
            const wishData = await getWishlist();
            if (wishData?.wishlist) {
              const inWishlist = wishData.wishlist.some((item) => item._id === id);
              setIsWishlisted(inWishlist);
            }
          } catch (e) {
            // Ignore wishlist error during initial fetch
          }
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        const errMsg = err.response?.data?.message || 'Something went wrong while loading product details.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleProductAndWishlist();
  }, [id]);

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setWishlistError(null);

    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      if (err.response?.status === 409) {
        setIsWishlisted(true);
      } else {
        setWishlistError('Unable to update wishlist. Please try again.');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    setCartSuccessMessage(`Added "${product.name}" to cart! (Cart backend feature coming in Lab 05)`);
    setTimeout(() => setCartSuccessMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-state" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} className="error-icon" />
        <h3>Product Not Found</h3>
        <p>{error || 'The requested product could not be found.'}</p>
        <button onClick={() => navigate('/products')} className="btn-primary" style={{ maxWidth: '220px', marginTop: '1rem' }}>
          <ArrowLeft size={16} />
          Back to Products
        </button>
      </div>
    );
  }

  const { name, description, price, category, image, stock } = product;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  const isOutOfStock = stock <= 0;

  return (
    <div className="product-details-container">
      {/* Navigation link */}
      <Link to="/products" className="btn-back-link">
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      {cartSuccessMessage && (
        <div className="alert-box alert-success" style={{ marginTop: '1rem' }}>
          <ShoppingCart size={18} />
          <span>{cartSuccessMessage}</span>
        </div>
      )}

      {/* Main Details Layout */}
      <div className="details-grid">
        {/* Large Product Image */}
        <div className="details-image-card">
          <img
            src={image}
            alt={name}
            className="details-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>

        {/* Product Information */}
        <div className="details-info-card">
          <div className="details-category-tag">
            <Tag size={14} />
            {category}
          </div>

          <h1 className="details-title">{name}</h1>

          <div className="details-price-row">
            <span className="details-price">{formattedPrice}</span>
            <span className={`stock-badge large ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
              {isOutOfStock ? (
                <>
                  <AlertTriangle size={16} />
                  Out of Stock
                </>
              ) : (
                <>
                  <PackageCheck size={16} />
                  In Stock ({stock} available)
                </>
              )}
            </span>
          </div>

          <div className="details-divider"></div>

          <div className="details-description-section">
            <h3>Product Overview</h3>
            <p>{description}</p>
          </div>

          {/* Value props */}
          <div className="details-features">
            <div className="feature-item">
              <Truck size={18} className="feature-icon" />
              <span>Fast & Free Delivery</span>
            </div>
            <div className="feature-item">
              <ShieldCheck size={18} className="feature-icon" />
              <span>100% Genuine Guarantee</span>
            </div>
            <div className="feature-item">
              <RotateCcw size={18} className="feature-icon" />
              <span>7 Day Easy Returns</span>
            </div>
          </div>

          {wishlistError && (
            <div className="card-error-feedback" style={{ marginBottom: '1rem' }}>
              {wishlistError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="details-actions">
            <button
              onClick={handleAddToCart}
              className="btn-add-to-cart"
              disabled={isOutOfStock}
            >
              <ShoppingCart size={20} />
              {isOutOfStock ? 'Currently Out of Stock' : 'Add to Cart'}
            </button>

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`btn-details-wishlist ${isWishlisted ? 'saved' : ''}`}
            >
              {wishlistLoading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  ⏳ Saving...
                </>
              ) : isWishlisted ? (
                <>
                  <Heart size={18} fill="#ef4444" color="#ef4444" />
                  ♥ Added to Wishlist
                </>
              ) : (
                <>
                  <Heart size={18} />
                  ♡ Add to Wishlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

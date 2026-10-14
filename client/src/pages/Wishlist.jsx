import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, RefreshCw, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { getWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      setWishlist(data.wishlist || []);
    } catch (err) {
      console.error('Error loading wishlist:', err);
      setError(err.response?.data?.message || "We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveSuccess = (removedId) => {
    setWishlist((prevList) => prevList.filter((item) => item._id !== removedId));
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="wishlist-state-container" id="wishlist-loading-state">
        <div className="loading-spinner-box">
          <Loader2 size={40} className="spin-icon text-primary" />
          <p className="loading-text">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="wishlist-state-container" id="wishlist-error-state">
        <div className="state-card error-card">
          <AlertCircle size={48} className="state-icon text-danger" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchWishlist} className="btn-retry">
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-state-container" id="wishlist-empty-state">
        <div className="state-card empty-card">
          <div className="empty-heart-icon">
            <Heart size={56} fill="#ef4444" color="#ef4444" />
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>
          <Link to="/products" className="btn-browse-products">
            <ShoppingBag size={18} />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // 4. Wishlist Grid State
  return (
    <div className="wishlist-page-container">
      <div className="wishlist-header">
        <div className="wishlist-title-group">
          <h1>My Wishlist</h1>
          <p className="wishlist-count-badge">
            {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
          </p>
        </div>

        <Link to="/products" className="btn-continue-shopping">
          <ShoppingBag size={16} />
          Explore More Products
        </Link>
      </div>

      <div className="wishlist-grid">
        {wishlist.map((product) => (
          <WishlistCard
            key={product._id}
            product={product}
            onRemoveSuccess={handleRemoveSuccess}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Tag, PackageCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { removeFromWishlist } from '../services/api';

const WishlistCard = ({ product, onRemoveSuccess }) => {
  const { _id, name, price, category, image, stock } = product;
  const [removing, setRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  const isOutOfStock = stock <= 0;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setErrorMsg(null);

    try {
      await removeFromWishlist(_id);
      if (onRemoveSuccess) {
        onRemoveSuccess(_id);
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to remove item. Please try again.');
      setRemoving(false);
    }
  };

  return (
    <div className="wishlist-card">
      <div className="wishlist-card-image-container">
        <img
          src={image}
          alt={name}
          className="wishlist-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <span className="card-category-badge">
          <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
          {category}
        </span>
      </div>

      <div className="wishlist-card-body">
        <h3 className="wishlist-card-title" title={name}>{name}</h3>

        <div className="wishlist-card-meta">
          <div className="wishlist-card-price">{formattedPrice}</div>
          <div className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? (
              <>
                <AlertTriangle size={13} />
                Out of Stock
              </>
            ) : (
              <>
                <PackageCheck size={13} />
                {stock} {stock === 1 ? 'unit left' : 'units left'}
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="card-error-feedback" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="wishlist-card-actions">
          <Link to={`/products/${_id}`} className="btn-view-details">
            <Eye size={16} />
            View Details
          </Link>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="btn-remove-wishlist"
            title="Remove from Wishlist"
          >
            {removing ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Remove ♥
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;

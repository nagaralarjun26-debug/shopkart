import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Loader2, Tag, PackageCheck, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useCart();
  const { product, quantity } = item;

  const [updateLoading, setUpdateLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!product) return null;

  const { _id, name, price, category, image, stock } = product;

  const formattedUnitPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  const formattedLineTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price * quantity);

  const handleIncrease = async () => {
    if (updateLoading) return;
    if (quantity >= stock) {
      setErrorMsg(`Max stock: ${stock} units`);
      return;
    }
    setUpdateLoading(true);
    setErrorMsg(null);
    const result = await updateItem(_id, quantity + 1);
    if (!result.success) setErrorMsg(result.message);
    setUpdateLoading(false);
  };

  const handleDecrease = async () => {
    if (updateLoading || quantity <= 1) return;
    setUpdateLoading(true);
    setErrorMsg(null);
    const result = await updateItem(_id, quantity - 1);
    if (!result.success) setErrorMsg(result.message);
    setUpdateLoading(false);
  };

  const handleRemove = async () => {
    if (removeLoading) return;
    setRemoveLoading(true);
    setErrorMsg(null);
    const result = await removeItem(_id);
    if (!result.success) {
      setErrorMsg(result.message);
      setRemoveLoading(false);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image-wrap">
        <Link to={`/products/${_id}`}>
          <img
            src={image}
            alt={name}
            className="cart-item-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=300&q=80';
            }}
          />
        </Link>
      </div>

      <div className="cart-item-info">
        <Link to={`/products/${_id}`} className="cart-item-name">{name}</Link>

        <div className="cart-item-meta">
          <span className="cart-item-category">
            <Tag size={12} style={{ display: 'inline', marginRight: '3px' }} />
            {category}
          </span>
          <span className={`stock-badge ${stock <= 0 ? 'out-of-stock' : 'in-stock'}`} style={{ fontSize: '0.72rem' }}>
            {stock <= 0 ? (
              <><AlertTriangle size={11} /> Out of Stock</>
            ) : (
              <><PackageCheck size={11} /> {stock} available</>
            )}
          </span>
        </div>

        <div className="cart-item-price-row">
          <span className="cart-item-unit-price">{formattedUnitPrice} each</span>
          <span className="cart-item-line-total">{formattedLineTotal}</span>
        </div>

        {errorMsg && (
          <div className="card-error-feedback" style={{ marginTop: '0.4rem' }}>{errorMsg}</div>
        )}
      </div>

      <div className="cart-item-controls">
        {/* Quantity Controls */}
        <div className="qty-control">
          <button
            className="qty-btn"
            onClick={handleDecrease}
            disabled={updateLoading || quantity <= 1}
            title="Decrease quantity"
          >
            <Minus size={14} />
          </button>

          <span className="qty-value">
            {updateLoading ? <Loader2 size={14} className="spin-icon" /> : quantity}
          </span>

          <button
            className="qty-btn"
            onClick={handleIncrease}
            disabled={updateLoading || quantity >= stock}
            title="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Remove Button */}
        <button
          className="btn-cart-remove"
          onClick={handleRemove}
          disabled={removeLoading}
          title="Remove from cart"
        >
          {removeLoading ? (
            <Loader2 size={15} className="spin-icon" />
          ) : (
            <><Trash2 size={15} /> Remove</>
          )}
        </button>
      </div>
    </div>
  );
};

export default CartItem;

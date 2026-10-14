import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getOrderById } from '../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If order wasn't passed via navigation state, fetch from backend API
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const data = await getOrderById(id);
          if (data.success) {
            setOrder(data.order);
          } else {
            setError(data.message || 'Order details not found');
          }
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError(err.response?.data?.message || 'Unable to retrieve order details');
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="order-state-container" id="order-loading">
        <Loader2 size={40} className="spin-icon" style={{ color: 'var(--primary)' }} />
        <p>Confirming your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-state-container" id="order-error">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Unable to load confirmation</h2>
        <p>{error || 'Order could not be located.'}</p>
        <Link to="/orders" className="btn-primary">
          View My Orders
        </Link>
      </div>
    );
  }

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(order.totalAmount);

  return (
    <div className="order-success-page-container">
      {/* Success Hero Header */}
      <div className="success-hero-card">
        <div className="success-icon-wrapper">
          <CheckCircle2 size={56} className="success-check-icon" />
        </div>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you for shopping with ShopKart. Your payment has been verified and your order is confirmed.
        </p>

        <div className="order-quick-meta">
          <div className="meta-pill">
            <span className="pill-label">Order ID:</span>
            <span className="pill-value">#{order._id}</span>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Status:</span>
            <span className="pill-badge status-placed">{order.status}</span>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Payment:</span>
            <span className="pill-badge status-paid">{order.paymentStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Order Details Cards */}
      <div className="success-grid">
        {/* Purchased Items Card */}
        <div className="success-card">
          <div className="card-header">
            <Package size={20} className="header-icon" />
            <h2>Purchased Items ({order.items?.length || 0})</h2>
          </div>

          <div className="success-items-list">
            {order.items?.map((item, idx) => (
              <div key={item.product?._id || idx} className="success-item-row">
                {item.image && (
                  <img src={item.image} alt={item.name} className="success-item-img" />
                )}
                <div className="success-item-info">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-meta">
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="item-total-price">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="card-footer-total">
            <span>Total Amount Paid</span>
            <span className="total-highlight">{formattedTotal}</span>
          </div>
        </div>

        {/* Shipping & Payment Card */}
        <div className="success-card">
          <div className="card-header">
            <MapPin size={20} className="header-icon" />
            <h2>Delivery Address</h2>
          </div>

          <div className="address-details-box">
            <p className="recipient-name"><strong>{order.shippingAddress?.fullName}</strong></p>
            <p className="address-text">{order.shippingAddress?.addressLine1}</p>
            <p className="address-text">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p className="phone-text">📞 Contact: {order.shippingAddress?.phone}</p>
          </div>

          <div className="payment-receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Payment Gateway:</span>
              <span className="receipt-value">Razorpay Standard</span>
            </div>
            {order.razorpayOrderId && (
              <div className="receipt-row">
                <span className="receipt-label">Razorpay Order ID:</span>
                <span className="receipt-value mono">{order.razorpayOrderId}</span>
              </div>
            )}
            {order.razorpayPaymentId && (
              <div className="receipt-row">
                <span className="receipt-label">Razorpay Payment ID:</span>
                <span className="receipt-value mono">{order.razorpayPaymentId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="success-actions">
        <Link to="/orders" className="btn-view-orders">
          <Package size={18} />
          View My Orders
        </Link>
        <Link to="/products" className="btn-continue-shopping-alt">
          <ShoppingBag size={18} />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;

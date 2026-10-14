import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { getOrderById, updateOrderStatus } from '../services/api';

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Package }
];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(id);
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Bonus progression handler
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setStatusMessage(null);
      const data = await updateOrderStatus(order._id, newStatus);
      if (data.success) {
        setOrder(data.order);
        setStatusMessage(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatusMessage(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="order-state-container" id="details-loading">
        <Loader2 size={42} className="spin-icon" style={{ color: 'var(--primary)' }} />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-state-container" id="details-error">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Order Not Found</h2>
        <p>{error || 'The requested order could not be loaded.'}</p>
        <Link to="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  // Calculate current active step index
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(order.totalAmount);

  return (
    <div className="order-details-container">
      {/* Top Navigation */}
      <div className="details-header-nav">
        <Link to="/orders" className="back-link">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        <span className="order-meta-date">
          <Calendar size={14} /> Placed on {formattedDate}
        </span>
      </div>

      {/* Order Banner */}
      <div className="order-details-hero">
        <div className="hero-left">
          <span className="order-number-tag">Order #{order._id}</span>
          <h1>Order Breakdown</h1>
        </div>
        <div className="hero-right">
          <span className="total-badge">{formattedTotal}</span>
        </div>
      </div>

      {/* Bonus Challenge: Order Progression Tracker */}
      <div className="order-timeline-card">
        <div className="timeline-header">
          <h3>Order Tracking Progression</h3>
          <span className="current-status-tag">{order.status}</span>
        </div>

        <div className="timeline-steps">
          {ORDER_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step.key}
                className={`timeline-step ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}
              >
                <div className="step-marker">
                  <Icon size={18} />
                </div>
                <div className="step-title">{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Bonus Challenge: Progression Controls for Demonstration */}
        <div className="status-progression-demo">
          <div className="demo-label">
            <Sparkles size={16} color="#6366f1" />
            <span>Bonus Challenge Demo — Simulate Progression:</span>
          </div>
          <div className="demo-buttons">
            {['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={updatingStatus || order.status === st}
                className={`btn-status-pill ${order.status === st ? 'active' : ''}`}
              >
                {st}
              </button>
            ))}
          </div>
          {statusMessage && <p className="status-update-feedback">{statusMessage}</p>}
        </div>
      </div>

      {/* Two Column Layout: Items & Shipping/Payment */}
      <div className="details-grid-layout">
        {/* Left: Snapshot items */}
        <div className="details-card">
          <div className="details-card-header">
            <Package size={20} className="section-icon" />
            <h2>Purchased Items ({order.items?.length || 0})</h2>
          </div>

          <div className="details-items-list">
            {order.items?.map((item, idx) => (
              <div key={item.product?._id || idx} className="details-item-row">
                {item.image && (
                  <img src={item.image} alt={item.name} className="details-item-img" />
                )}
                <div className="details-item-main">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-price-unit">
                    ₹{item.price?.toLocaleString('en-IN')} × {item.quantity} units
                  </p>
                </div>
                <div className="details-item-subtotal">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="details-card-footer">
            <div className="footer-line">
              <span>Items Total</span>
              <span>{formattedTotal}</span>
            </div>
            <div className="footer-line">
              <span>Shipping Fee</span>
              <span className="free-tag">FREE</span>
            </div>
            <div className="footer-line grand-total">
              <span>Final Total Paid</span>
              <span>{formattedTotal}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping Address & Payment Verification */}
        <div className="details-sidebar">
          {/* Shipping Address */}
          <div className="details-card">
            <div className="details-card-header">
              <MapPin size={20} className="section-icon" />
              <h2>Delivery Address</h2>
            </div>
            <div className="shipping-address-content">
              <p className="recipient-name"><strong>{order.shippingAddress?.fullName}</strong></p>
              <p>{order.shippingAddress?.addressLine1}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="phone-line">📱 {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="details-card">
            <div className="details-card-header">
              <CreditCard size={20} className="section-icon" />
              <h2>Payment Information</h2>
            </div>
            <div className="payment-info-content">
              <div className="payment-row">
                <span className="info-label">Payment Status:</span>
                <span className="info-badge badge-paid">{order.paymentStatus}</span>
              </div>
              <div className="payment-row">
                <span className="info-label">Gateway:</span>
                <span className="info-value">Razorpay Standard</span>
              </div>
              {order.razorpayOrderId && (
                <div className="payment-row">
                  <span className="info-label">Razorpay Order ID:</span>
                  <span className="info-value mono">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="payment-row">
                  <span className="info-label">Razorpay Payment ID:</span>
                  <span className="info-value mono">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

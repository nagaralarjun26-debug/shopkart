import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';
import { getMyOrders } from '../services/api';

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'PLACED':
      return 'status-badge status-placed';
    case 'CONFIRMED':
      return 'status-badge status-confirmed';
    case 'SHIPPED':
      return 'status-badge status-shipped';
    case 'DELIVERED':
      return 'status-badge status-delivered';
    case 'PENDING_PAYMENT':
      return 'status-badge status-pending';
    default:
      return 'status-badge';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to retrieve orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="orders-state-container" id="orders-loading">
        <Loader2 size={42} className="spin-icon" style={{ color: 'var(--primary)' }} />
        <p>Loading your orders...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="orders-state-container" id="orders-error">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Unable to load orders</h2>
        <p>{error}</p>
        <button onClick={fetchOrders} className="btn-primary">
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (orders.length === 0) {
    return (
      <div className="orders-state-container" id="orders-empty">
        <div className="empty-orders-icon">
          <Package size={56} color="#6366f1" />
        </div>
        <h2>You have not placed any orders yet</h2>
        <p>Your completed purchases and delivery tracking will appear here.</p>
        <Link to="/products" className="btn-browse-products">
          <ShoppingBag size={18} />
          Start Shopping
        </Link>
      </div>
    );
  }

  // 4. Orders List
  return (
    <div className="orders-page-container">
      <div className="orders-page-header">
        <div>
          <h1>My Orders</h1>
          <p className="orders-subtitle">
            Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>
        <Link to="/products" className="btn-continue-shopping">
          <ShoppingBag size={16} />
          Shop More
        </Link>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          const formattedTotal = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(order.totalAmount);

          return (
            <div key={order._id} className="order-card" id={`order-${order._id}`}>
              {/* Order Card Top Bar */}
              <div className="order-card-header">
                <div className="order-header-info">
                  <span className="order-id-label">ORDER #{order._id.slice(-8).toUpperCase()}</span>
                  <span className="order-date">
                    <Calendar size={14} /> {dateStr}
                  </span>
                </div>

                <div className="order-header-status">
                  <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                </div>
              </div>

              {/* Items Snapshot Grid */}
              <div className="order-items-preview">
                {order.items?.map((item, index) => (
                  <div key={item.product?._id || index} className="order-preview-item">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="item-thumb" />
                    )}
                    <div className="item-text">
                      <span className="item-title">{item.name}</span>
                      <span className="item-qty-price">
                        {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Card Footer */}
              <div className="order-card-footer">
                <div className="order-total-block">
                  <span className="total-label">Total Amount</span>
                  <span className="total-value">{formattedTotal}</span>
                </div>

                <Link to={`/orders/${order._id}`} className="btn-view-details">
                  View Details
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;

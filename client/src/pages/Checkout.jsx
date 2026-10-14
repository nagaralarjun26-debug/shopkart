import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentOrder, verifyPayment } from '../services/api';
import CheckoutForm from '../components/CheckoutForm';

// Helper to dynamically load the official Razorpay Checkout SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartItems, cartCount, subtotal, emptyCart, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Redirect if cart is empty and not loading
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, cartLoading, navigate]);

  // Validation function
  const validateField = (name, value) => {
    const val = (value || '').trim();
    switch (name) {
      case 'fullName':
        if (!val) return 'Full name is required';
        if (val.length < 3) return 'Name must be at least 3 characters';
        return '';
      case 'phone':
        if (!val) return 'Phone number is required';
        if (!/^\+?[0-9]{10,12}$/.test(val.replace(/[\s-]/g, ''))) {
          return 'Please enter a valid 10-digit phone number';
        }
        return '';
      case 'addressLine1':
        if (!val) return 'Street address is required';
        return '';
      case 'city':
        if (!val) return 'City is required';
        return '';
      case 'state':
        if (!val) return 'State is required';
        return '';
      case 'pincode':
        if (!val) return 'Pincode is required';
        if (!/^\d{6}$/.test(val)) return 'Pincode must contain 6 digits';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // -------------------------------------------------------------
  // Complete Order Verification and Navigation
  // -------------------------------------------------------------
  const handlePaymentVerification = async (verificationPayload) => {
    try {
      const result = await verifyPayment(verificationPayload);
      if (result.success) {
        // Clear global cart state in Context & DB
        await emptyCart();
        navigate(`/order-success/${verificationPayload.shopKartOrderId}`, {
          state: { order: result.order }
        });
      } else {
        setErrorMessage(result.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMessage(
        err.response?.data?.message || 'Payment verification failed on server. Your cart is preserved.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Place Order with Razorpay
  // -------------------------------------------------------------
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Mark all fields touched to show validation errors
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    if (!validateAll()) {
      setErrorMessage('Please fix the errors in your shipping address before proceeding.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Pending ShopKart order & Razorpay order on backend
      const orderData = await createPaymentOrder({
        shippingAddress: formData
      });

      if (!orderData.success) {
        setErrorMessage(orderData.message || 'Failed to create payment order');
        setIsSubmitting(false);
        return;
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key } = orderData;

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      // Use test simulation if:
      // (a) Script failed to load from CDN, OR
      // (b) Backend used a fallback mock order ID (order_test_...) because real Razorpay API was unavailable
      const isMockOrder = razorpayOrderId && razorpayOrderId.startsWith('order_test_');

      if (!scriptLoaded || !window.Razorpay || isMockOrder) {
        // Fallback for environments where external Razorpay script is blocked or mock keys used
        console.warn('Razorpay script could not load or mock order detected. Using test simulation.');
        await handlePaymentVerification({
          shopKartOrderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `mock_valid_signature`
        });
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: key || 'rzp_test_shopkart2026',
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${shopKartOrderId.slice(-6).toUpperCase()}`,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80',
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Do NOT trust client alone - verify signature on backend!
          await handlePaymentVerification({
            shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: user?.email || ''
        },
        notes: {
          shopKartOrderId
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setErrorMessage(
          response.error?.description || 'Payment was unsuccessful. Your cart items have been saved. Please try again.'
        );
        setIsSubmitting(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Error in handlePlaceOrder:', err);
      setErrorMessage(err.response?.data?.message || 'Server error while initiating payment');
      setIsSubmitting(false);
    }
  };

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(subtotal);

  return (
    <div className="checkout-page-container">
      {/* Breadcrumb / Navigation */}
      <div className="checkout-nav-bar">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <div className="checkout-badge">
          <ShieldCheck size={16} color="#10b981" />
          <span>Secure Checkout (Test Mode)</span>
        </div>
      </div>

      <div className="checkout-header-title">
        <h1>Checkout & Payment</h1>
        <p>Review items, confirm shipping details, and complete your order.</p>
      </div>

      {errorMessage && (
        <div className="checkout-alert-error" id="checkout-error-alert">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-layout">
        {/* Left Column: Shipping Form */}
        <div className="checkout-main-content">
          <CheckoutForm
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
          />

          <div className="payment-method-card">
            <div className="payment-header">
              <CreditCard size={20} className="section-header-icon" />
              <div>
                <h3>Payment Method</h3>
                <p>Secured by Razorpay Standard Payment Gateway</p>
              </div>
            </div>
            <div className="razorpay-test-notice">
              <Sparkles size={16} color="#6366f1" />
              <span>Razorpay Test Mode is active. No real money will be charged.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-sidebar">
          <div className="order-summary-box">
            <div className="order-summary-header">
              <ShoppingBag size={20} />
              <h2>Order Summary</h2>
            </div>

            <div className="checkout-items-list">
              {cartItems.map((item) => (
                <div key={item.product?._id} className="checkout-item-row">
                  <img
                    src={item.product?.image}
                    alt={item.product?.name}
                    className="checkout-item-thumb"
                  />
                  <div className="checkout-item-info">
                    <p className="checkout-item-name">{item.product?.name}</p>
                    <p className="checkout-item-meta">
                      Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="checkout-item-price">
                    ₹{(item.product?.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary-divider" />

            <div className="summary-line">
              <span>Items Total ({cartCount})</span>
              <span>{formattedSubtotal}</span>
            </div>

            <div className="summary-line">
              <span>Standard Delivery</span>
              <span className="free-badge">FREE</span>
            </div>

            <div className="order-summary-divider" />

            <div className="summary-total-line">
              <span>Total Payable</span>
              <span>{formattedSubtotal}</span>
            </div>

            <button
              type="submit"
              className="btn-pay-razorpay"
              id="place-order-button"
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay with Razorpay
                </>
              )}
            </button>

            <div className="checkout-guarantee">
              <ShieldCheck size={16} color="#10b981" />
              <span>100% Purchase Protection & Snapshot Guarantee</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;

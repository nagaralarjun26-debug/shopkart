import axios from 'axios';

// Use relative URLs so all requests go through the Vite dev proxy (same origin as frontend)
// This is CRITICAL for HttpOnly cookies to work — cross-origin requests to localhost:5000
// won't send cookies set by the same-origin proxy on localhost:5173
const API_BASE_URL = '';

// Axios Instance - no baseURL means relative URLs, routed through Vite proxy
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication Service Methods
export const registerCustomer = async (customerData) => {
  const response = await API.post('/customers/register', customerData);
  return response.data;
};

export const loginCustomer = async (credentials) => {
  const response = await API.post('/customers/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get('/customers/me');
  return response.data;
};

export const logoutCustomer = async () => {
  const response = await API.post('/customers/logout');
  return response.data;
};

export const changePassword = async (passwords) => {
  const response = await API.patch('/customers/change-password', passwords);
  return response.data;
};

// Product Service Methods
export const getProducts = async ({ search = '', category = '', sort = '' } = {}) => {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  if (category && category.trim() && category.toLowerCase() !== 'all') params.category = category.trim();
  if (sort && sort.trim()) params.sort = sort.trim();

  const response = await API.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await API.post('/products', productData);
  return response.data;
};

// Wishlist Service Methods
export const getWishlist = async () => {
  const response = await API.get('/wishlist');
  return response.data;
};

export const addToWishlist = async (productId) => {
  const response = await API.post(`/wishlist/${productId}`);
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await API.delete(`/wishlist/${productId}`);
  return response.data;
};

export const toggleWishlist = async (productId) => {
  const response = await API.patch(`/wishlist/${productId}/toggle`);
  return response.data;
};

// Cart Service Methods
export const getCart = async () => {
  const response = await API.get('/cart');
  return response.data;
};

export const addToCart = async (productId) => {
  const response = await API.post(`/cart/${productId}`);
  return response.data;
};

export const updateCartQuantity = async (productId, quantity) => {
  const response = await API.patch(`/cart/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await API.delete(`/cart/${productId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await API.delete('/cart');
  return response.data;
};

// Order & Checkout Service Methods
export const createPaymentOrder = async (orderPayload) => {
  const response = await API.post('/orders/create-payment-order', orderPayload);
  return response.data;
};

export const verifyPayment = async (verificationPayload) => {
  const response = await API.post('/orders/verify-payment', verificationPayload);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await API.get('/orders');
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await API.get(`/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await API.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

export default API;


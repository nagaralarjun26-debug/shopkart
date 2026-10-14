import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCart, updateCartQuantity, removeFromCart, clearCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  // ------------------------------------------------------------------
  // Derived values — never store these in DB, calculate from state
  // ------------------------------------------------------------------
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // ------------------------------------------------------------------
  // Fetch cart from backend (run on login / page load)
  // ------------------------------------------------------------------
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const data = await getCart();
      setCartItems(data.cart || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCartError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  // Load cart whenever the authenticated user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ------------------------------------------------------------------
  // Add product to cart (or increment quantity)
  // ------------------------------------------------------------------
  const addItem = async (productId) => {
    try {
      const data = await addToCart(productId);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      console.error('addItem error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add to cart'
      };
    }
  };

  // ------------------------------------------------------------------
  // Update quantity of an existing cart item
  // ------------------------------------------------------------------
  const updateItem = async (productId, quantity) => {
    try {
      const data = await updateCartQuantity(productId, quantity);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      console.error('updateItem error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update quantity'
      };
    }
  };

  // ------------------------------------------------------------------
  // Remove one item from cart
  // ------------------------------------------------------------------
  const removeItem = async (productId) => {
    try {
      const data = await removeFromCart(productId);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      console.error('removeItem error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove item'
      };
    }
  };

  // ------------------------------------------------------------------
  // Clear entire cart
  // ------------------------------------------------------------------
  const emptyCart = async () => {
    try {
      await clearCart();
      setCartItems([]);
      return { success: true };
    } catch (err) {
      console.error('emptyCart error:', err);
      return { success: false };
    }
  };

  // Helper: check if product is already in cart
  const isInCart = (productId) =>
    cartItems.some((item) => item.product?._id === productId);

  // Helper: get quantity for a product
  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => i.product?._id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        cartLoading,
        cartError,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        emptyCart,
        isInCart,
        getItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

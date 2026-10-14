import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogOut, LogIn, UserPlus, Heart, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div className="brand-icon">
          <ShoppingBag size={22} />
        </div>
        <div className="brand-text">
          Shop<span>Kart</span>
        </div>
      </Link>

      <div className="nav-menu">
        {user ? (
          <>
            <Link
              to="/products"
              className={`nav-link ${location.pathname.startsWith('/products') ? 'active' : ''}`}
            >
              Products
            </Link>

            <Link
              to="/wishlist"
              className={`nav-link ${location.pathname === '/wishlist' ? 'active' : ''}`}
              id="nav-wishlist-link"
            >
              <Heart size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Wishlist
            </Link>

            <Link
              to="/cart"
              className={`nav-link nav-cart-link ${location.pathname === '/cart' ? 'active' : ''}`}
              id="nav-cart-link"
            >
              <ShoppingCart size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Cart
              {cartCount > 0 && (
                <span className="cart-count-badge">{cartCount}</span>
              )}
            </Link>

            <Link
              to="/orders"
              className={`nav-link ${location.pathname.startsWith('/orders') ? 'active' : ''}`}
              id="nav-orders-link"
            >
              <Package size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Orders
            </Link>

            <div className="nav-user-badge">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{user.fullName}</span>
            </div>

            <button onClick={handleLogout} className="btn-logout" id="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <LogIn size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Login
            </Link>
            <Link
              to="/register"
              className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
            >
              <UserPlus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

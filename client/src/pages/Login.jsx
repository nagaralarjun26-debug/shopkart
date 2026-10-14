import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const registrationSuccess = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    const result = await login(formData);

    setLoading(false);

    if (result?.success) {
      navigate('/home');
    } else {
      setErrorMessage(result?.message || 'Invalid Credentials');
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Welcome Back</h2>
        <p>Log in to access your ShopKart profile</p>
      </div>

      {registrationSuccess && (
        <div className="alert-box alert-success" role="alert">
          <CheckCircle size={18} />
          <span>{registrationSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box alert-error" role="alert" id="login-error-alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="login-form">
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email Address</label>
          <div className="input-wrapper">
            <input
              type="email"
              id="login-email"
              name="email"
              className="form-input"
              placeholder="e.g. john@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Mail size={18} className="input-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <input
              type="password"
              id="login-password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Lock size={18} className="input-icon" />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} id="login-submit-btn">
          {loading ? (
            <>
              <div className="spinner"></div>
              Authenticating...
            </>
          ) : (
            <>
              <LogIn size={18} />
              Login
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account? <Link to="/register">Create Account</Link>
      </div>
    </div>
  );
};

export default Login;

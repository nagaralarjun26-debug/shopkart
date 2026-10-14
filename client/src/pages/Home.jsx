import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, Key, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';

const Home = () => {
  const { user } = useAuth();

  // Change Password state
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');

    if (!passwords.oldPassword || !passwords.newPassword) {
      setPwError('Both current and new passwords are required.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPwError('New password must contain at least 6 characters.');
      return;
    }

    setPwLoading(true);

    try {
      const res = await changePassword(passwords);
      if (res.success) {
        setPwSuccess('Password updated successfully!');
        setPasswords({ oldPassword: '', newPassword: '' });
      }
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Card */}
      <div className="hero-card">
        <div className="hero-text">
          <h1>Welcome back, {user?.fullName}! 👋</h1>
          <p>You have successfully logged into your secure ShopKart Customer Account.</p>
          <div className="badge-auth">
            <span className="badge-dot"></span>
            Authenticated via HttpOnly Cookie
          </div>
        </div>
      </div>

      {/* User Information Grid */}
      <div className="dashboard-grid">
        <div className="info-card">
          <div className="info-icon-wrapper">
            <User size={24} />
          </div>
          <div className="info-content">
            <label>Full Name</label>
            <span>{user?.fullName}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon-wrapper">
            <Mail size={24} />
          </div>
          <div className="info-content">
            <label>Email Address</label>
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon-wrapper">
            <Phone size={24} />
          </div>
          <div className="info-content">
            <label>Phone Number</label>
            <span>{user?.phone}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon-wrapper">
            <ShieldCheck size={24} />
          </div>
          <div className="info-content">
            <label>Account ID</label>
            <span style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{user?._id}</span>
          </div>
        </div>
      </div>

      {/* Security Settings Section (Change Password) */}
      <div className="auth-card" style={{ maxWidth: '100%', marginTop: '2rem' }}>
        <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} color="var(--primary)" />
            Security & Account Settings
          </h3>
          <p>Update your ShopKart password</p>
        </div>

        {pwError && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{pwError}</span>
          </div>
        )}

        {pwSuccess && (
          <div className="alert-box alert-success">
            <CheckCircle size={18} />
            <span>{pwSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Current Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="Current password"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                required
              />
              <Lock size={18} className="input-icon" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="New password (min 6 chars)"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                minLength={6}
              />
              <Lock size={18} className="input-icon" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={pwLoading} style={{ marginTop: 0 }}>
              {pwLoading ? <div className="spinner"></div> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;

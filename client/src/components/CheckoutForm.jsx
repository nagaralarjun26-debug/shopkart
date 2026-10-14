import React from 'react';
import { User, Phone, MapPin, Building, Flag, Mail } from 'lucide-react';

const CheckoutForm = ({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  disabled
}) => {
  return (
    <div className="checkout-form-container">
      <div className="checkout-section-header">
        <MapPin size={22} className="section-header-icon" />
        <div>
          <h2>Shipping Address</h2>
          <p>Enter the delivery destination for your order</p>
        </div>
      </div>

      <div className="form-grid">
        {/* Full Name */}
        <div className={`form-group ${touched.fullName && errors.fullName ? 'has-error' : ''}`}>
          <label htmlFor="fullName">
            Full Name <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <User size={18} className="field-icon" />
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g. Aarav Sharma"
              value={formData.fullName}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              autoComplete="name"
            />
          </div>
          {touched.fullName && errors.fullName && (
            <span className="error-message" id="fullName-error">{errors.fullName}</span>
          )}
        </div>

        {/* Phone Number */}
        <div className={`form-group ${touched.phone && errors.phone ? 'has-error' : ''}`}>
          <label htmlFor="phone">
            Phone Number <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Phone size={18} className="field-icon" />
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="e.g. 9876543210 (10 digits)"
              value={formData.phone}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              maxLength={13}
              autoComplete="tel"
            />
          </div>
          {touched.phone && errors.phone && (
            <span className="error-message" id="phone-error">{errors.phone}</span>
          )}
        </div>

        {/* Address Line 1 */}
        <div className={`form-group full-width ${touched.addressLine1 && errors.addressLine1 ? 'has-error' : ''}`}>
          <label htmlFor="addressLine1">
            Street Address / House No. <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Building size={18} className="field-icon" />
            <input
              type="text"
              id="addressLine1"
              name="addressLine1"
              placeholder="e.g. Flat 402, Sunshine Heights, 22 MG Road"
              value={formData.addressLine1}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              autoComplete="street-address"
            />
          </div>
          {touched.addressLine1 && errors.addressLine1 && (
            <span className="error-message" id="addressLine1-error">{errors.addressLine1}</span>
          )}
        </div>

        {/* City */}
        <div className={`form-group ${touched.city && errors.city ? 'has-error' : ''}`}>
          <label htmlFor="city">
            City <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Building size={18} className="field-icon" />
            <input
              type="text"
              id="city"
              name="city"
              placeholder="e.g. Bengaluru"
              value={formData.city}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              autoComplete="address-level2"
            />
          </div>
          {touched.city && errors.city && (
            <span className="error-message" id="city-error">{errors.city}</span>
          )}
        </div>

        {/* State */}
        <div className={`form-group ${touched.state && errors.state ? 'has-error' : ''}`}>
          <label htmlFor="state">
            State <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Flag size={18} className="field-icon" />
            <input
              type="text"
              id="state"
              name="state"
              placeholder="e.g. Karnataka"
              value={formData.state}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              autoComplete="address-level1"
            />
          </div>
          {touched.state && errors.state && (
            <span className="error-message" id="state-error">{errors.state}</span>
          )}
        </div>

        {/* Pincode */}
        <div className={`form-group ${touched.pincode && errors.pincode ? 'has-error' : ''}`}>
          <label htmlFor="pincode">
            Pincode <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Mail size={18} className="field-icon" />
            <input
              type="text"
              id="pincode"
              name="pincode"
              placeholder="e.g. 560001 (6 digits)"
              value={formData.pincode}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              maxLength={6}
              autoComplete="postal-code"
            />
          </div>
          {touched.pincode && errors.pincode && (
            <span className="error-message" id="pincode-error">{errors.pincode}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;

const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (res, customerId) => {
  const token = jwt.sign(
    { id: customerId },
    process.env.JWT_SECRET || 'shopkart_secret_key_2026_jwt_authentication_token',
    { expiresIn: '1d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  return token;
};

module.exports = generateTokenAndSetCookie;

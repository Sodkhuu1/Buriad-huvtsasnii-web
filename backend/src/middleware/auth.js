// auth.js — middleware that checks if the user is logged in
//
// How JWT auth works:
// 1. User logs in → server sets an httpOnly cookie "auth_token"
// 2. The browser sends the cookie automatically on every request
// 3. This middleware verifies the cookie and attaches user info to req.user
// 4. As a fallback (curl, Postman) we also accept "Authorization: Bearer <token>"

const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');

const AUTH_COOKIE_NAME = 'auth_token';

const extractToken = (req) => {
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

const protect = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(createError(401, 'Not authorized, no token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(createError(401, 'Not authorized, invalid token'));
  }
};

// Role-based access: only allow certain roles
// Usage: router.get('/admin-only', protect, requireRole('admin'), ...)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Access denied: insufficient permissions'));
    }
    next();
  };
};

module.exports = { protect, requireRole };

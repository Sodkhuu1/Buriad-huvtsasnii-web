// auth.js — middleware that checks if the user is logged in
//
// How JWT auth works:
// 1. User logs in → server gives them a "token" (a long string)
// 2. User sends that token with every request in the header
// 3. This middleware checks the token and attaches the user info to req.user

const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');

const protect = (req, res, next) => {
  // The token comes in the Authorization header like: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError(401, 'Not authorized, no token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to the request
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

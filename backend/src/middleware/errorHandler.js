// errorHandler.js — catches all errors from routes and returns a clean JSON response
// Instead of crashing, we send a proper error message to the frontend

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

// Helper to create errors with a custom status code
// Usage: throw createError(404, 'User not found')
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };

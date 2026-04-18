// auth.controller.js — handles register and login logic
//
// Controller = the function that runs when a route is called
// It reads the request, does work (DB query, etc), and sends a response

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { createError } = require('../middleware/errorHandler');

// Generate a JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Set the JWT as an httpOnly cookie — keeps it out of JS reach (XSS-safe)
// Matches JWT_EXPIRES_IN (default 7d) in milliseconds
const AUTH_COOKIE_NAME = 'auth_token';
const SEVEN_DAYS_MS    = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SEVEN_DAYS_MS,
    path:     '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
  });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
      return next(createError(400, 'Full name, email and password are required'));
    }

    // Only allow these roles for self-registration
    const allowedRoles = ['customer', 'tailor'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if email is already taken
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return next(createError(409, 'Email already registered'));
    }

    // Hash the password (never store plain text passwords!)
    // bcrypt adds a "salt" and hashes the password — 10 = work factor (higher = slower but safer)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, status, created_at`,
      [full_name, email, phone || null, passwordHash, userRole]
    );

    const newUser = result.rows[0];

    // If registering as customer, create a customer profile row
    if (userRole === 'customer') {
      await pool.query(
        'INSERT INTO customer_profiles (user_id) VALUES ($1)',
        [newUser.id]
      );
    }

    // If registering as tailor, create a tailor profile row
    if (userRole === 'tailor') {
      const { business_name, specialization } = req.body;
      await pool.query(
        'INSERT INTO tailor_profiles (user_id, business_name, specialization) VALUES ($1, $2, $3)',
        [newUser.id, business_name || null, specialization || null]
      );
    }

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, 'Email and password are required'));
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return next(createError(401, 'Invalid email or password'));
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return next(createError(403, 'Account is not active'));
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(createError(401, 'Invalid email or password'));
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout — clears the auth cookie
const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me — get current logged-in user's info
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(createError(404, 'User not found'));
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, AUTH_COOKIE_NAME };

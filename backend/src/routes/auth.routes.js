// auth.routes.js — defines the URL paths for authentication
//
// Route = URL path + HTTP method + which controller function to call

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// POST /api/auth/register — create a new account
router.post('/register', register);

// POST /api/auth/login — log in and get a token
router.post('/login', login);

// GET /api/auth/me — get my own user info (requires login)
router.get('/me', protect, getMe);

module.exports = router;

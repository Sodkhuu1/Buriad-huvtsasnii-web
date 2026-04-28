// server.js — the main entry point of our backend
// This file starts the Express server and connects all the routes

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes        = require('./routes/auth.routes')
const garmentRoutes     = require('./routes/garments.routes')
const tailorRoutes      = require('./routes/tailors.routes')
const orderRoutes       = require('./routes/orders.routes')
const tailorDashRoutes  = require('./routes/tailor.routes')
const adminRoutes       = require('./routes/admin.routes')
const paymentRoutes     = require('./routes/payments.routes')
const notificationRoutes = require('./routes/notifications.routes')

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// cors: allows our React frontend (on port 5173) to call this backend (on port 5000)
// credentials: true is required so the browser will send/receive cookies
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// express.json(): lets us read JSON data from request body (req.body)
app.use(express.json());

// Parse cookies into req.cookies — used for httpOnly JWT auth
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth',    authRoutes)
app.use('/api/garments', garmentRoutes)
app.use('/api/tailors',  tailorRoutes)
app.use('/api/orders',   orderRoutes)
app.use('/api/tailor',   tailorDashRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check — useful to test if the server is running
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler — if no route matches
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler — must be LAST middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

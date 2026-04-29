// server.js — the main entry point of our backend
// This file starts the Express server and connects all the routes

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { runMigrations } = require('../scripts/migrate');
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
const tryOnRoutes       = require('./routes/tryon.routes')
const chatRoutes        = require('./routes/chat.routes')

const app = express();
const PORT = process.env.PORT || 5000;

// Render/Vercel ard reverse proxy bdg uchir secure cookie zovshoorold heregtei
app.set('trust proxy', 1);

// CLIENT_URL-d olon URL-iig comma-aar salgaj bichij bolno
// jisheelbel: https://my-app.vercel.app,https://preview.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// --- Middleware ---
// cors: frontend (Vercel) → backend (Render) cross-origin call zovshoorono
// credentials: true bnal browser cookie ilgeene
app.use(cors({
  origin: (origin, cb) => {
    // server-server eswel curl-aar oroh zergiig zovshooroh (origin baikhgui)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Vercel preview URL-uudig zovshoorh, jish: my-app-git-branch-user.vercel.app
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && /\.vercel\.app$/.test(new URL(origin).hostname)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// express.json(): lets us read JSON data from request body (req.body)
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '15mb' }));

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
app.use('/api/tryon', tryOnRoutes)
app.use('/api/chat', chatRoutes)

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

const startServer = async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();

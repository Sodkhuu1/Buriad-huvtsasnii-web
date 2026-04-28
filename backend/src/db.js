// db.js — connects our app to PostgreSQL
// We use the "pg" library which lets Node.js talk to PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Render zereg cloud DB-d ihevchlen DATABASE_URL gej negen mor utga ogdog
// Local-d bol DB_HOST/DB_PORT/... gj saljval ashiglana
const useConnectionString = Boolean(process.env.DATABASE_URL);

// Production-d SSL zaaval kheregtei, lok DB-d kheregggui
const sslConfig =
  process.env.PGSSL === 'disable'
    ? false
    : useConnectionString || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false;

const pool = new Pool(
  useConnectionString
    ? { connectionString: process.env.DATABASE_URL, ssl: sslConfig }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslConfig,
      }
);

// Server start hiihed neg udaa shalgaad ujig
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to PostgreSQL database');
    release(); // release the test connection back to the pool
  }
});

module.exports = pool;

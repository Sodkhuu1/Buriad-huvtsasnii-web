// db.js — connects our app to PostgreSQL
// We use the "pg" library which lets Node.js talk to PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Pool = a set of reusable database connections
// Instead of opening/closing a connection every time, we keep a pool ready
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release(); // release the test connection back to the pool
  }
});

module.exports = pool;

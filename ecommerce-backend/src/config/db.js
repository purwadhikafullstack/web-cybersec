const { Pool } = require('pg');

// Connects to PostgreSQL (Supabase) using a connection string supplied via
// environment variable. No live connection is established at import time;
// the pool connects lazily on first query.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };

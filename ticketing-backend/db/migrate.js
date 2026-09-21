require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { pool } = require('../src/config/db');

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Applying migration: ${file}`);
      await client.query(sql);
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exitCode = 1;
      return pool.end();
    });
}

module.exports = { migrate };

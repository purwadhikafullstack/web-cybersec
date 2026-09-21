const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { pool } = require('../config/db');
const { signToken } = require('../config/jwt');
const { PRODUCT_FIXTURES } = require('../../db/lib/fixtures');

function toPublicUser(row) {
  const { password_hash, ...rest } = row;
  return rest;
}

async function register(req, res, next) {
  try {
    const { email, password, name, address, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Self-registered users get their own isolated sandbox tenant, so they
    // never collide with the pre-seeded student tenants (and their flags).
    const tenant = `self_${crypto.randomBytes(4).toString('hex')}`;

    const { rows: [user] } = await pool.query(
      `INSERT INTO users (tenant, email, password_hash, name, address, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'customer')
       RETURNING id, tenant, email, name, address, phone, role, created_at`,
      [tenant, email, passwordHash, name, address || null, phone || null]
    );

    // Give the new sandbox tenant a plain, working catalog (no victims, no
    // flags) so the storefront isn't just a dead end after registering.
    for (const p of PRODUCT_FIXTURES) {
      await pool.query(
        `INSERT INTO products (tenant, name, description, price, stock, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenant, p.name, p.description, p.price, p.stock, p.image_url]
      );
    }

    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

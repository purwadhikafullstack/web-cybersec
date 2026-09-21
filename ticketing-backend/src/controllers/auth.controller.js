const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { pool } = require('../config/db');
const { signToken } = require('../config/jwt');
const { eventFixtures } = require('../../db/lib/fixtures');

function toPublicUser(row) {
  const { password_hash, ...rest } = row;
  return rest;
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body || {};
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
      `INSERT INTO users (tenant, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, tenant, email, name, role, created_at`,
      [tenant, email, passwordHash, name]
    );

    // Give the new sandbox tenant a plain, working event catalog (no
    // victims/flags) so the storefront isn't a dead end after registering.
    for (const e of eventFixtures()) {
      await pool.query(
        `INSERT INTO events (tenant, title, description, event_date, price, capacity, seats_booked, banner_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)`,
        [tenant, e.title, e.description, e.event_date, e.price, e.capacity, e.banner_url, user.id]
      );
    }

    const token = signToken(user);
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

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

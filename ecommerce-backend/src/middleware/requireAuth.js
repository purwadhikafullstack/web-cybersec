const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, tenant, email, name, address, phone, role, created_at
       FROM users WHERE id = $1`,
      [payload.sub]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };

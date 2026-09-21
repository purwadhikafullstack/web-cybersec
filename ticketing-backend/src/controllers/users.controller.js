const { pool } = require('../config/db');

// Profile display only — NOT part of the authorization path. requireAuth /
// requireAdmin decide access purely from the JWT's own claims (see vuln #7);
// this endpoint's DB-sourced `role` can legitimately disagree with a forged
// token's claimed role and that's fine, it doesn't affect what the token
// can access elsewhere.
async function getMe(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, tenant, email, name, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe };

const { pool } = require('../config/db');

async function getMe(req, res) {
  res.json({ user: req.user });
}

// VULN #7 (Sensitive Data Exposure): this is meant to be admin-only, but is
// wired up with just requireAuth (see users.routes.js) — no role check at
// all. Any authenticated user can list every user in their tenant,
// including email/phone (and the seeded decoy "support" account, whose
// phone field carries the flag).
async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, phone, role, created_at
       FROM users WHERE tenant = $1 ORDER BY id`,
      [req.user.tenant]
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

// VULN #4 (Broken Access Control / privilege escalation): `role` is taken
// straight from the request body and persisted with no authorization check
// at all, so any authenticated user can PATCH their way to role: "admin".
async function updateMe(req, res, next) {
  try {
    const { name, address, phone, role } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
    if (address !== undefined) { fields.push(`address = $${i++}`); values.push(address); }
    if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone); }
    if (role !== undefined) { fields.push(`role = $${i++}`); values.push(role); }

    if (fields.length === 0) {
      return res.json({ user: req.user });
    }

    values.push(req.user.id);
    const { rows: [user] } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, tenant, email, name, address, phone, role, created_at`,
      values
    );

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, listUsers };

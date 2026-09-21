const { pool } = require('../config/db');

// Legitimately protected by requireAuth + requireAdmin (routes/admin.routes.js).
// The only way in is forging a JWT (vuln #7) since no admin account is ever
// seeded.
async function salesDashboard(req, res, next) {
  try {
    const { rows: flagRows } = await pool.query(
      `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'jwt_forge'`,
      [req.user.tenant]
    );

    const { rows: sales } = await pool.query(
      `SELECT t.id, t.ticket_code, t.price_paid, e.title AS event_title, u.email AS buyer_email, t.created_at
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN users u ON u.id = t.user_id
       WHERE u.tenant = $1
       ORDER BY t.id DESC`,
      [req.user.tenant]
    );

    const { rows: [stats] } = await pool.query(
      `SELECT count(*)::int AS ticket_count, coalesce(sum(t.price_paid), 0) AS revenue
       FROM tickets t JOIN users u ON u.id = t.user_id WHERE u.tenant = $1`,
      [req.user.tenant]
    );

    res.json({
      message: 'Welcome, admin. Your forged token worked.',
      flag: flagRows[0] && flagRows[0].value,
      stats,
      sales,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { salesDashboard };

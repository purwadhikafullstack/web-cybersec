const { pool } = require('../config/db');

async function listMyTickets(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.event_id, e.title AS event_title, t.ticket_code, t.price_paid, t.created_at
       FROM tickets t JOIN events e ON e.id = t.event_id
       WHERE t.user_id = $1 ORDER BY t.id DESC`,
      [req.user.id]
    );
    res.json({ tickets: rows });
  } catch (err) {
    next(err);
  }
}

// VULN #1 (IDOR): no check that the ticket belongs to req.user — any
// authenticated user can view any ticket id (including the seeded victim's,
// which carries the flag in `note`) as long as it's within their own
// tenant's id range.
async function getTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT t.id, t.event_id, e.title AS event_title, t.user_id, t.ticket_code, t.price_paid, t.note, t.created_at
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1 AND u.tenant = $2`,
      [id, req.user.tenant]
    );
    const ticket = rows[0];
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyTickets, getTicket };

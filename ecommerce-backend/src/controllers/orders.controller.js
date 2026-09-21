const { pool } = require('../config/db');

async function listMyOrders(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, status, total, note, created_at
       FROM orders WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

// VULN #1 (IDOR): no check that the order belongs to req.user — any
// authenticated user can view any order id (including the seeded victim's
// order, which carries the flag in `note`) as long as it's within their
// own tenant's id range.
async function getOrder(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total, o.note, o.created_at
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.id = $1 AND u.tenant = $2`,
      [id, req.user.tenant]
    );
    const order = rows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { rows: items } = await pool.query(
      `SELECT id, product_id, product_name, unit_price, quantity
       FROM order_items WHERE order_id = $1`,
      [id]
    );

    res.json({ order: { ...order, items } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyOrders, getOrder };

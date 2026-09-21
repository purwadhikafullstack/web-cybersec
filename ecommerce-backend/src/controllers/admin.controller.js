const { pool } = require('../config/db');

// All handlers here are legitimately protected by requireAuth + requireAdmin
// (wired in routes/admin.routes.js) — this is the payoff once a user
// escalates via vuln #4, not a vulnerability itself.

async function listAllProducts(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, price, stock, image_url, created_at
       FROM products WHERE tenant = $1 ORDER BY id`,
      [req.user.tenant]
    );
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, price, stock, image_url } = req.body || {};
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const { rows: [product] } = await pool.query(
      `INSERT INTO products (tenant, name, description, price, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, stock, image_url, created_at`,
      [req.user.tenant, name, description || null, price, stock || 0, image_url || null]
    );
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price, stock, image_url } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
    if (price !== undefined) { fields.push(`price = $${i++}`); values.push(price); }
    if (stock !== undefined) { fields.push(`stock = $${i++}`); values.push(stock); }
    if (image_url !== undefined) { fields.push(`image_url = $${i++}`); values.push(image_url); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.user.tenant);
    const idPlaceholder = i++;
    const tenantPlaceholder = i;
    const { rows } = await pool.query(
      `UPDATE products SET ${fields.join(', ')}
       WHERE id = $${idPlaceholder} AND tenant = $${tenantPlaceholder}
       RETURNING id, name, description, price, stock, image_url, created_at`,
      values
    );
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

async function listAllOrders(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.user_id, u.email AS user_email, o.status, o.total, o.note, o.created_at
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE u.tenant = $1 ORDER BY o.id DESC`,
      [req.user.tenant]
    );
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

async function dashboard(req, res, next) {
  try {
    const { rows: flagRows } = await pool.query(
      `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'bac_role'`,
      [req.user.tenant]
    );
    const { rows: coupons } = await pool.query(
      `SELECT code, discount_percent, note FROM coupons WHERE tenant = $1 ORDER BY id`,
      [req.user.tenant]
    );
    const { rows: [userCount] } = await pool.query(
      `SELECT count(*)::int AS count FROM users WHERE tenant = $1`,
      [req.user.tenant]
    );
    const { rows: [orderStats] } = await pool.query(
      `SELECT count(*)::int AS count, coalesce(sum(total), 0) AS revenue
       FROM orders o JOIN users u ON u.id = o.user_id WHERE u.tenant = $1`,
      [req.user.tenant]
    );

    res.json({
      message: 'Welcome, admin. You successfully escalated your privileges.',
      flag: flagRows[0] && flagRows[0].value,
      stats: { userCount: userCount.count, orderCount: orderStats.count, revenue: orderStats.revenue },
      coupons,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAllProducts, createProduct, updateProduct, listAllOrders, dashboard };

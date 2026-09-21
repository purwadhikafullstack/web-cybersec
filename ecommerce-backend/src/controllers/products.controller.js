const { pool } = require('../config/db');

async function listProducts(req, res, next) {
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

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, name, description, price, stock, image_url, created_at
       FROM products WHERE id = $1 AND tenant = $2`,
      [id, req.user.tenant]
    );
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { rows: reviews } = await pool.query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name AS author_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({ product, reviews });
  } catch (err) {
    next(err);
  }
}

// VULN #2 (SQL Injection): the search term is concatenated directly into the
// query string instead of using a parameterized placeholder. Enables
// UNION-based extraction of the hidden `admin_notes` table.
async function searchProducts(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const tenant = req.user.tenant;

  const sql = `SELECT id, name, description, price, image_url FROM products
               WHERE tenant = '${tenant}' AND name ILIKE '%${q}%'
               ORDER BY id`;

  try {
    const { rows } = await pool.query(sql);
    res.json({ products: rows });
  } catch (err) {
    // Intentionally verbose: real vulnerable apps often leak raw DB errors,
    // which is exactly what makes UNION-based exploitation easy to iterate on.
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listProducts, getProduct, searchProducts };

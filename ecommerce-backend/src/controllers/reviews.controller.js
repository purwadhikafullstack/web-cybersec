const { pool } = require('../config/db');

// VULN #3 (Stored XSS): the review body is stored and later returned
// verbatim, with no sanitization on write or read. The vulnerability fires
// on the frontend, which renders it without escaping (see
// ecommerce-frontend, batch 7) — this endpoint just has to not get in the way.
async function createReview(req, res, next) {
  try {
    const { id: productId } = req.params;
    const { rating, body } = req.body || {};

    if (!rating || !body) {
      return res.status(400).json({ error: 'rating and body are required' });
    }

    const { rows: productRows } = await pool.query(
      `SELECT id FROM products WHERE id = $1 AND tenant = $2`,
      [productId, req.user.tenant]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { rows: [review] } = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, rating, body, created_at`,
      [productId, req.user.id, rating, body]
    );

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview };

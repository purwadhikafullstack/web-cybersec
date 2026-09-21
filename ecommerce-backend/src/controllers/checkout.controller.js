const { pool } = require('../config/db');

// VULN #5 (Business Logic Flaw): trusts `price` and `quantity` exactly as
// sent by the client instead of recomputing the line total from the
// products table. A tampered price (e.g. 0, negative) or a negative
// quantity lets the client drive the order total to zero or below.
async function checkout(req, res, next) {
  try {
    const { items, note, couponCode } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items is required and must be a non-empty array' });
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const { productId, quantity, price } = item || {};
      if (!productId || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'each item requires productId, quantity, and price' });
      }

      const { rows } = await pool.query(
        `SELECT id, name FROM products WHERE id = $1 AND tenant = $2`,
        [productId, req.user.tenant]
      );
      const product = rows[0];
      if (!product) {
        return res.status(400).json({ error: `Product ${productId} not found` });
      }

      const lineTotal = Number(price) * Number(quantity);
      total += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: Number(price),
        quantity: Number(quantity),
      });
    }

    // Same lack of role/rate-limit check as GET /api/coupons/:code (#6, #8)
    // applies here too — any code the client sends is looked up and, if it
    // exists for this tenant, its discount is applied.
    let appliedCoupon = null;
    if (couponCode) {
      const { rows: couponRows } = await pool.query(
        `SELECT code, discount_percent FROM coupons WHERE tenant = $1 AND code = $2`,
        [req.user.tenant, couponCode]
      );
      if (couponRows[0]) {
        appliedCoupon = couponRows[0];
        total = total * (1 - appliedCoupon.discount_percent / 100);
      }
    }

    const { rows: [order] } = await pool.query(
      `INSERT INTO orders (user_id, status, total, note)
       VALUES ($1, 'paid', $2, $3)
       RETURNING id, status, total, note, created_at`,
      [req.user.id, total, note || null]
    );

    for (const item of orderItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, item.productName, item.unitPrice, item.quantity]
      );
    }

    let flag;
    if (total <= 0) {
      const { rows: flagRows } = await pool.query(
        `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'price_tamper'`,
        [req.user.tenant]
      );
      flag = flagRows[0] && flagRows[0].value;
    }

    res.status(201).json({
      order: { ...order, items: orderItems },
      ...(appliedCoupon ? { appliedCoupon } : {}),
      ...(flag ? { flag } : {}),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout };

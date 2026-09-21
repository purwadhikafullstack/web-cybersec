const { pool } = require('../config/db');

// VULN #6 (IDOR / broken access control): coupon lookup by code has no role
// check at all — any authenticated customer can fetch ANY coupon record,
// including the "admin-only" 100%-off one, just by knowing/guessing its code.
//
// VULN #8 (Missing rate limiting): this same endpoint has no throttling or
// lockout, so the random 4-digit secret coupon is discoverable by
// brute-forcing all 10,000 possibilities.
async function getCouponByCode(req, res, next) {
  try {
    const { code } = req.params;

    const { rows } = await pool.query(
      `SELECT code, discount_percent, note FROM coupons WHERE tenant = $1 AND code = $2`,
      [req.user.tenant, code]
    );
    const coupon = rows[0];
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ coupon });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCouponByCode };

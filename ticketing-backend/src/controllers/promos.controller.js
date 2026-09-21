const { pool } = require('../config/db');

// VULN #8 (Missing Rate Limiting): no throttling or lockout on this lookup,
// so the random 4-digit secret promo code is discoverable by brute-forcing
// all 10,000 possibilities. Also used from POST /api/events/:id/book to
// actually redeem a code.
async function getPromoByCode(req, res, next) {
  try {
    const { code } = req.params;
    const { rows } = await pool.query(
      `SELECT code, discount_percent, note FROM promos WHERE tenant = $1 AND code = $2`,
      [req.user.tenant, code]
    );
    const promo = rows[0];
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    res.json({ promo });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPromoByCode };

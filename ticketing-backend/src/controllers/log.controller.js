const jwt = require('jsonwebtoken');

const { pool } = require('../config/db');

// Unauthenticated on purpose: this is the "attacker-controlled" endpoint a
// stored-XSS payload (vuln #6) posts stolen data to.
//
// Deliberately does NOT use config/jwt.js's verifyToken (which accepts
// "alg":"none" for vuln #7) — this endpoint needs a STRICT, real signature
// check. Otherwise a student could claim the XSS flag by simply forging an
// alg:none token instead of actually getting the payload to execute in a
// real logged-in session, which would trivialize vuln #6 entirely.
async function receiveLog(req, res) {
  const { stolenToken, note } = req.body || {};

  console.log('[xss-exfil-log]', {
    stolenToken,
    note,
    ip: req.ip,
    at: new Date().toISOString(),
  });

  if (!stolenToken) {
    return res.json({ received: true });
  }

  try {
    const payload = jwt.verify(stolenToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const { rows } = await pool.query(
      `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'xss_description'`,
      [payload.tenant]
    );
    if (rows.length === 0) {
      return res.json({ received: true });
    }
    return res.json({ received: true, flag: rows[0].value });
  } catch (err) {
    return res.json({ received: true });
  }
}

module.exports = { receiveLog };

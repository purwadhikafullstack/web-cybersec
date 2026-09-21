const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/db');

// Unauthenticated on purpose: this is the "attacker-controlled" endpoint a
// stored-XSS payload (vuln #3) posts stolen data to. It doubles as the flag
// reveal — if the posted token is a real, currently-valid JWT (meaning the
// payload really did execute in a logged-in victim's browser and exfiltrate
// their session), the response includes that tenant's xss_review flag.
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
    const payload = verifyToken(stolenToken);
    const { rows } = await pool.query(
      `SELECT f.value FROM users u
       JOIN flags f ON f.tenant = u.tenant AND f.vuln_key = 'xss_review'
       WHERE u.id = $1`,
      [payload.sub]
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

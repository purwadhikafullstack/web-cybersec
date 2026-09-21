const { pool } = require('../config/db');

// Fake internal-only service, safe to expose for this exercise (per PRD:
// "endpoint internal tiruan yang aman"). Only responds with real data when
// called with the internal secret header — which only the banner-from-url
// relay attaches (see ssrf.controller.js). A direct external call can never
// know that secret, so the only way to get anything useful here is to make
// the server relay the request (classic SSRF impact).
async function internalMetadata(req, res, next) {
  try {
    const secret = req.header('x-internal-fetch-secret');
    if (!secret || secret !== process.env.INTERNAL_FETCH_SECRET) {
      return res.status(403).json({ error: 'Forbidden: internal service only' });
    }

    const tenant = req.header('x-requesting-tenant');
    let flag = null;
    if (tenant) {
      const { rows } = await pool.query(
        `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'ssrf'`,
        [tenant]
      );
      flag = rows[0] && rows[0].value;
    }

    res.json({
      service: 'internal-metadata',
      message: 'You reached an internal-only service via server-side request relay.',
      flag,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { internalMetadata };

const { pool } = require('../config/db');

const INTERNAL_FETCH_HEADER = 'x-internal-fetch-secret';
const INTERNAL_TENANT_HEADER = 'x-requesting-tenant';
const FETCH_TIMEOUT_MS = 5000;
const BODY_PREVIEW_LIMIT = 2000;

// VULN #5 (SSRF): fetches whatever URL the client provides, server-side,
// with no validation or whitelist — and reflects the response back
// (non-blind), so the caller can read whatever the server was able to
// reach. Every outbound fetch this endpoint makes "helpfully" forwards the
// caller's own tenant and an internal-service secret (realistic
// service-to-service trust-forwarding anti-pattern) — which is exactly
// what lets the fake internal endpoint give up its tenant-specific flag
// ONLY when reached through this relay, not via a direct external call.
async function bannerFromUrl(req, res, next) {
  try {
    const { id } = req.params;
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const { rows: eventRows } = await pool.query(
      `SELECT id FROM events WHERE id = $1 AND tenant = $2`,
      [id, req.user.tenant]
    );
    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let fetchResult;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          [INTERNAL_FETCH_HEADER]: process.env.INTERNAL_FETCH_SECRET || '',
          [INTERNAL_TENANT_HEADER]: req.user.tenant,
        },
      });
      const contentType = response.headers.get('content-type') || '';
      const bodyText = await response.text();
      fetchResult = {
        ok: true,
        status: response.status,
        contentType,
        bodyPreview: bodyText.slice(0, BODY_PREVIEW_LIMIT),
      };

      if (response.ok && contentType.startsWith('image/')) {
        await pool.query(`UPDATE events SET banner_url = $1 WHERE id = $2`, [url, id]);
      }
    } catch (fetchErr) {
      fetchResult = { ok: false, error: fetchErr.message };
    } finally {
      clearTimeout(timeout);
    }

    res.json({ fetch: fetchResult });
  } catch (err) {
    next(err);
  }
}

module.exports = { bannerFromUrl };

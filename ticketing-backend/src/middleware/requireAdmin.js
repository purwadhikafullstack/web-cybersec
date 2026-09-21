// Used by the admin sales dashboard (batch 6). Trusts req.user.role, which
// requireAuth takes directly from the JWT's own claims — so this check is
// only as strong as the token verification in config/jwt.js (see vuln #7).
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

module.exports = { requireAdmin };

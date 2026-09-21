// Used by later batches (product management, admin dashboard, users list).
// Trusts req.user.role, which requireAuth always loads fresh from the DB —
// so this check is only as strong as PATCH /api/users/me (see vuln #4).
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

module.exports = { requireAdmin };

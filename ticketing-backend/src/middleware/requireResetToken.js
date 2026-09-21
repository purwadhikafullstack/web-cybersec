// Guards the instructor-only reset endpoint. Deliberately separate from the
// normal user auth system (JWT) — this is operator tooling, not an app role.
function requireResetToken(req, res, next) {
  if (!process.env.RESET_TOKEN) {
    return res.status(500).json({ error: 'RESET_TOKEN not configured on server' });
  }

  const token = req.header('x-reset-token');
  if (!token || token !== process.env.RESET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = { requireResetToken };

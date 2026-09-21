const { verifyToken } = require('../config/jwt');

// Note: no DB lookup here (unlike the e-commerce app). req.user is built
// entirely from the token's own claims — see config/jwt.js for why that's
// deliberate (vuln #7).
function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = verifyToken(token);
    if (!payload.sub || !payload.tenant) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'customer',
      tenant: payload.tenant,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };

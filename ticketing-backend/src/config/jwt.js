const jwt = require('jsonwebtoken');

const EXPIRES_IN = '7d';

// Unlike the e-commerce app, the payload carries role + tenant directly.
// requireAuth trusts these claims instead of re-querying the DB, which is
// what makes vuln #7 meaningful: forging the token's claims is enough on
// its own, no DB write required.
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenant: user.tenant },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN, algorithm: 'HS256' }
  );
}

// VULN #7 (Insecure JWT Handling): a token whose header claims "alg":"none"
// is accepted with NO signature check at all — its payload is trusted
// as-is. Any other algorithm falls through to a normal, properly verified
// HS256 check. A pentester takes their own real token, flips the header's
// alg to "none", edits the payload's role to "admin", and drops the
// signature segment entirely.
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Malformed token');
  }

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));

  if (header.alg && header.alg.toLowerCase() === 'none') {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  }

  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };

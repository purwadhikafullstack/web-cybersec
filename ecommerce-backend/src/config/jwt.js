const jwt = require('jsonwebtoken');

const EXPIRES_IN = '7d';

// Payload only ever carries the user id. Role is intentionally NOT embedded
// here — auth middleware re-reads it from the DB on every request, which is
// what makes the role-escalation vuln (#4) take effect immediately after a
// PATCH /api/users/me, without needing to reissue a token.
function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };

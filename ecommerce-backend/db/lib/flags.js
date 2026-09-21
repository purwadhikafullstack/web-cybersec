const crypto = require('crypto');

// Every vuln_key here maps 1:1 to a row in the PRD's vulnerability table.
const VULN_KEYS = [
  'idor_order',
  'sqli_search',
  'xss_review',
  'bac_role',
  'price_tamper',
  'coupon_idor',
  'sensitive_users',
  'coupon_bruteforce',
];

function randomSuffix(bytes = 6) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateFlag(tenant, vulnKey) {
  return `FLAG{ecom_${tenant}_${vulnKey}_${randomSuffix()}}`;
}

function generateFlagsForTenant(tenant) {
  const flags = {};
  for (const key of VULN_KEYS) {
    flags[key] = generateFlag(tenant, key);
  }
  return flags;
}

module.exports = { VULN_KEYS, generateFlag, generateFlagsForTenant };

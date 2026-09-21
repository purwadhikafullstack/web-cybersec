const { pool } = require('../config/db');
const { seedTenant, DEFAULT_TENANTS } = require('../../db/seed');

async function resetTenant(req, res) {
  const { tenant } = req.params;

  if (!DEFAULT_TENANTS.includes(tenant)) {
    return res.status(400).json({ error: `Unknown tenant "${tenant}"`, knownTenants: DEFAULT_TENANTS });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const flags = await seedTenant(client, tenant);
    await client.query('COMMIT');
    res.json({ tenant, status: 'reset', flags });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Reset failed for tenant "${tenant}":`, err);
    res.status(500).json({ error: 'Reset failed' });
  } finally {
    client.release();
  }
}

module.exports = { resetTenant };

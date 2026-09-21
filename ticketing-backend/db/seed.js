require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { pool } = require('../src/config/db');
const { migrate } = require('./migrate');
const { generateFlagsForTenant } = require('./lib/flags');
const { eventFixtures } = require('./lib/fixtures');

const DEFAULT_TENANTS = (process.env.SEED_TENANTS || 's1,s2,s3')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Student@123';

function randomSecretCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function randomTicketCode() {
  return `TKT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

async function clearTenant(client, tenant) {
  await client.query(
    `DELETE FROM tickets WHERE user_id IN (SELECT id FROM users WHERE tenant = $1)
       OR event_id IN (SELECT id FROM events WHERE tenant = $1)`,
    [tenant]
  );
  await client.query(`DELETE FROM events WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM users WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM promos WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM flags WHERE tenant = $1`, [tenant]);
}

async function seedTenant(client, tenant) {
  await clearTenant(client, tenant);

  const flags = generateFlagsForTenant(tenant);

  const studentPasswordHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  const decoyPasswordHash = await bcrypt.hash(randomSecretCode() + randomSecretCode(), 10);

  const { rows: [student] } = await client.query(
    `INSERT INTO users (tenant, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, 'customer') RETURNING id`,
    [tenant, `${tenant}@student.ticketing.local`, studentPasswordHash, `Student ${tenant.toUpperCase()}`]
  );

  const { rows: [victim] } = await client.query(
    `INSERT INTO users (tenant, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, 'customer') RETURNING id`,
    [tenant, `${tenant}-victim@student.ticketing.local`, decoyPasswordHash, `Victim Account (${tenant})`]
  );

  // -- Events (own copy per tenant), one of them deliberately tiny-capacity
  // for the race-condition exercise.
  const eventIds = [];
  for (const e of eventFixtures()) {
    const { rows: [event] } = await client.query(
      `INSERT INTO events (tenant, title, description, event_date, price, capacity, seats_booked, banner_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8) RETURNING id`,
      [tenant, e.title, e.description, e.event_date, e.price, e.capacity, e.banner_url, student.id]
    );
    eventIds.push(event.id);
  }

  // -- Victim ticket: carries the IDOR flag in its note field. Occupies one
  // seat on the first seeded event.
  const victimEventId = eventIds[0];
  await client.query(
    `INSERT INTO tickets (event_id, user_id, ticket_code, price_paid, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [victimEventId, victim.id, randomTicketCode(), eventFixtures()[0].price, flags.idor_ticket]
  );
  await client.query(`UPDATE events SET seats_booked = seats_booked + 1 WHERE id = $1`, [victimEventId]);

  // -- Secret promo code, only discoverable by brute force (#8).
  await client.query(
    `INSERT INTO promos (tenant, code, discount_percent, note)
     VALUES ($1, $2, 50, $3)`,
    [tenant, randomSecretCode(), flags.promo_bruteforce]
  );

  // -- Central bookkeeping: every flag for this tenant, including the ones
  // above that also live inside vulnerable rows themselves.
  for (const [vulnKey, value] of Object.entries(flags)) {
    await client.query(
      `INSERT INTO flags (tenant, vuln_key, value) VALUES ($1, $2, $3)
       ON CONFLICT (tenant, vuln_key) DO UPDATE SET value = EXCLUDED.value`,
      [tenant, vulnKey, value]
    );
  }

  return flags;
}

async function seedAll(tenants) {
  await migrate();

  const client = await pool.connect();
  const results = {};
  try {
    for (const tenant of tenants) {
      await client.query('BEGIN');
      try {
        results[tenant] = await seedTenant(client, tenant);
        await client.query('COMMIT');
        console.log(`Seeded tenant "${tenant}".`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
  return results;
}

if (require.main === module) {
  const arg = process.argv[2];
  const tenants = arg ? [arg] : DEFAULT_TENANTS;

  seedAll(tenants)
    .then((results) => {
      console.log('\nSeed complete. Student login password for all tenants:', STUDENT_PASSWORD);
      console.log('\nFlags per tenant (grading reference only):');
      console.log(JSON.stringify(results, null, 2));
      return pool.end();
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exitCode = 1;
      return pool.end();
    });
}

module.exports = { seedAll, seedTenant, clearTenant, DEFAULT_TENANTS };

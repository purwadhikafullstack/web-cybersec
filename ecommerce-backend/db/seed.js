require('dotenv').config();

const bcrypt = require('bcryptjs');

const { pool } = require('../src/config/db');
const { migrate } = require('./migrate');
const { generateFlagsForTenant } = require('./lib/flags');
const { PRODUCT_FIXTURES } = require('./lib/fixtures');

const DEFAULT_TENANTS = (process.env.SEED_TENANTS || 's1,s2,s3')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Student@123';

function randomSecretCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

async function clearTenant(client, tenant) {
  await client.query(
    `DELETE FROM order_items WHERE order_id IN (
       SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE tenant = $1)
     )`,
    [tenant]
  );
  await client.query(
    `DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE tenant = $1)`,
    [tenant]
  );
  await client.query(
    `DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE tenant = $1)
       OR product_id IN (SELECT id FROM products WHERE tenant = $1)`,
    [tenant]
  );
  await client.query(`DELETE FROM users WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM products WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM coupons WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM admin_notes WHERE tenant = $1`, [tenant]);
  await client.query(`DELETE FROM flags WHERE tenant = $1`, [tenant]);
}

async function seedTenant(client, tenant) {
  await clearTenant(client, tenant);

  const flags = generateFlagsForTenant(tenant);

  // -- Users: 1 real student account + 1 dummy "victim" account + 1 fake
  // decoy account that only exists to carry the sensitive-data-exposure flag.
  const studentPasswordHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  const decoyPasswordHash = await bcrypt.hash(randomSecretCode() + randomSecretCode(), 10);

  const { rows: [student] } = await client.query(
    `INSERT INTO users (tenant, email, password_hash, name, address, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'customer') RETURNING id`,
    [tenant, `${tenant}@student.ecommerce.local`, studentPasswordHash, `Student ${tenant.toUpperCase()}`, 'Jl. Contoh No. 1, Jakarta', '0800000000']
  );

  const { rows: [victim] } = await client.query(
    `INSERT INTO users (tenant, email, password_hash, name, address, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'customer') RETURNING id`,
    [tenant, `${tenant}-victim@student.ecommerce.local`, decoyPasswordHash, `Victim Account (${tenant})`, 'Jl. Korban No. 2, Jakarta', '0811111111']
  );

  await client.query(
    `INSERT INTO users (tenant, email, password_hash, name, address, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'customer')`,
    [
      tenant,
      `${tenant}-support@internal.example`,
      decoyPasswordHash,
      'Internal Support (do not delete)',
      'N/A',
      flags.sensitive_users,
    ]
  );

  // -- Products (own copy per tenant) + one benign seed review each.
  const productIds = [];
  for (const p of PRODUCT_FIXTURES) {
    const { rows: [product] } = await client.query(
      `INSERT INTO products (tenant, name, description, price, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [tenant, p.name, p.description, p.price, p.stock, p.image_url]
    );
    productIds.push(product.id);

    await client.query(
      `INSERT INTO reviews (product_id, user_id, rating, body) VALUES ($1, $2, $3, $4)`,
      [product.id, student.id, 5, 'Great product, works as expected.']
    );
  }

  // -- Victim order: carries the IDOR flag in its note field.
  const orderTotal = PRODUCT_FIXTURES[0].price + PRODUCT_FIXTURES[1].price;
  const { rows: [victimOrder] } = await client.query(
    `INSERT INTO orders (user_id, status, total, note) VALUES ($1, 'paid', $2, $3) RETURNING id`,
    [victim.id, orderTotal, flags.idor_order]
  );
  await client.query(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
     VALUES ($1, $2, $3, $4, 1), ($1, $5, $6, $7, 1)`,
    [
      victimOrder.id,
      productIds[0],
      PRODUCT_FIXTURES[0].name,
      PRODUCT_FIXTURES[0].price,
      productIds[1],
      PRODUCT_FIXTURES[1].name,
      PRODUCT_FIXTURES[1].price,
    ]
  );

  // -- Coupons: a guessable "admin-only" one and a random secret one.
  await client.query(
    `INSERT INTO coupons (tenant, code, discount_percent, note, is_secret)
     VALUES ($1, 'ADMIN100', 100, $2, false)`,
    [tenant, flags.coupon_idor]
  );
  await client.query(
    `INSERT INTO coupons (tenant, code, discount_percent, note, is_secret)
     VALUES ($1, $2, 60, $3, true)`,
    [tenant, randomSecretCode(), flags.coupon_bruteforce]
  );

  // -- Hidden table, reachable only via SQL injection.
  await client.query(
    `INSERT INTO admin_notes (tenant, note) VALUES ($1, $2)`,
    [tenant, flags.sqli_search]
  );

  // -- Central bookkeeping: every flag for this tenant, including the ones
  // above that also live inside the vulnerable rows themselves. Lets the
  // instructor read the full flag list with one query per tenant.
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

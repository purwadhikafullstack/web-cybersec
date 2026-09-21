# Instructor Guide — E-commerce (Dummy Vulnerable App)

Internal reference for deploying and grading the e-commerce Finpro target. **Not for students.** See [`PRD-ecommerce.md`](./PRD-ecommerce.md) for the original spec this was built from.

## 1. Architecture recap

- `ecommerce-frontend` (Next.js App Router) and `ecommerce-backend` (Express) deploy as **two separate Vercel projects**.
- Database: a single Postgres instance (Supabase or any Postgres) shared by all 3 students, isolated by a `tenant` column (`s1`/`s2`/`s3`).
- Auth: JWT (`{ sub: userId }` only — role is always re-read from the DB), stored client-side in `localStorage`.
- No admin account is ever seeded. The only way into `/admin` is exploiting vuln #4.

## 2. Deploying

### 2.1 Database (Supabase or any Postgres)

1. Create a Postgres database (e.g. a Supabase project, or any managed Postgres). Grab its connection string.
2. From `ecommerce-backend/`, with `DATABASE_URL` set in `.env`, run:
   ```bash
   npm install
   npm run migrate   # creates all tables, idempotent
   npm run seed       # seeds s1, s2, s3 with fresh data + flags
   ```
   `npm run seed` prints the full flag list for all tenants to stdout — **save that output**, it's your grading key for this run (see §4).

### 2.2 Backend (`ecommerce-backend`) on Vercel

1. New Vercel project, Root Directory = `ecommerce-backend`.
2. Environment variables (Vercel project settings, not committed):
   - `DATABASE_URL` — from step 2.1
   - `JWT_SECRET` — long random string
   - `RESET_TOKEN` — long random string (instructor-only secret, see §5)
   - `CORS_ORIGIN` — the deployed frontend's URL (set this **after** step 2.3, then redeploy)
   - `SEED_TENANTS` — `s1,s2,s3` (or your actual tenant ids)
   - `SEED_STUDENT_PASSWORD` — the password all 3 students will log in with
3. Deploy. `vercel.json` already routes everything through `api/index.js` → the Express app.
4. Sanity check: `GET https://<backend-url>/health` → `{"status":"ok",...}`.

### 2.3 Frontend (`ecommerce-frontend`) on Vercel

1. New Vercel project, Root Directory = `ecommerce-frontend`.
2. Environment variable: `NEXT_PUBLIC_API_URL` = the backend URL from §2.2.
3. Deploy. Then go back and set the backend's `CORS_ORIGIN` to this frontend URL and redeploy the backend.

## 3. Student credentials

Each seeded tenant gets one real login:

| Tenant | Email | Password |
| --- | --- | --- |
| s1 | `s1@student.ecommerce.local` | value of `SEED_STUDENT_PASSWORD` |
| s2 | `s2@student.ecommerce.local` | same |
| s3 | `s3@student.ecommerce.local` | same |

Give each student only their own tenant's email. They should **not** be given the `-victim` or `-support` account credentials — those are exploitation targets (IDOR / sensitive data exposure), not accounts they log into directly.

Public self-registration also works (`/register`) and gets a throwaway isolated sandbox tenant with a plain product catalog — useful for a student to poke around without touching seeded/graded data, but it carries no flags.

## 4. Getting the current flag list

Flags are regenerated **every time a tenant is seeded or reset** — there is no fixed list to print here. To get the current flags for grading:

```bash
# from ecommerce-backend/, against the deployed DATABASE_URL
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT tenant, vuln_key, value FROM flags ORDER BY tenant, vuln_key')
  .then(r => { console.table(r.rows); return pool.end(); });
"
```

Or query it directly in the Supabase/Postgres SQL editor:

```sql
SELECT tenant, vuln_key, value FROM flags ORDER BY tenant, vuln_key;
```

A submitted flag's tenant must match the submitting student's own tenant (the tenant id is embedded in the flag string, e.g. `FLAG{ecom_s1_idor_order_...}`) — reject any submission where it doesn't, regardless of how it was obtained.

## 5. Resetting a tenant

If a student's data gets into a broken state (e.g. after heavy business-logic-flaw testing), reset just their tenant without touching the others:

```bash
curl -X POST https://<backend-url>/api/admin/reset/s1 \
  -H "x-reset-token: <RESET_TOKEN>"
```

This re-runs the seed for that tenant only (new random flags for it — the other two tenants' flags are untouched) and returns the fresh flag set in the response.

## 6. Vulnerability → endpoint → grading map

| # | Vulnerability | Endpoint | How a student proves it | Flag location |
| --- | --- | --- | --- | --- |
| 1 | IDOR (orders) | `GET /api/orders/:id` | View an order id that isn't theirs (their tenant's seeded victim account) | `order.note` |
| 2 | SQL Injection | `GET /api/products/search?q=` | UNION-based extraction of the hidden `admin_notes` table | Injected row's `name`/`description`/`image_url` |
| 3 | Stored XSS | `POST /api/products/:id/reviews` + product detail page | Payload executes in another session's browser and exfiltrates the JWT to `POST /api/_log` | JSON response from `/api/_log` |
| 4 | Broken Access Control | `PATCH /api/users/me` | Send `{"role":"admin"}`, then load `/admin` | `GET /api/admin/dashboard` response |
| 5 | Business logic (price/qty tampering) | `POST /api/checkout` | Send a tampered `price`/`quantity` so total ≤ 0 | Checkout response (`flag` field) |
| 6 | IDOR (coupon) | `GET /api/coupons/:code` | Guess/discover the admin-only coupon code (`ADMIN100`) | `coupon.note` |
| 7 | Sensitive data exposure | `GET /api/users` | Call it as a non-admin — full user list including a decoy account leaks | Decoy user's `phone` field |
| 8 | Missing rate limiting | `GET /api/coupons/:code` | Brute-force the random 4-digit secret coupon code (no lockout — verified at ~800+ sequential requests with zero throttling) | Secret coupon's `note` field |

All 8 were exploited end-to-end (including in a real browser, not just via curl) during development — see `ecommerce-backend/README.md` and `ecommerce-frontend/README.md` for the endpoint/page-level notes.

## 7. Known, deliberate isolation caveat

SQLi (#2) can, by its nature, read `admin_notes` rows belonging to *any* tenant if a student writes a UNION query without a tenant filter — this is realistic SQLi behavior, not a bug in the seed/tenant design. It's fine for grading because flags are self-identifying (tenant id embedded in the string); a student submitting a flag that doesn't match their own tenant should be rejected regardless of how they obtained it.

Every other vulnerability (#1, #4, #6, #7, #8) is deliberately contained within the acting student's own tenant even though the endpoint itself is broken — cross-tenant leakage there would indicate an actual bug, not an intended finding.

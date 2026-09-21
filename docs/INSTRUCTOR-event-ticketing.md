# Instructor Guide — Event Ticketing (Dummy Vulnerable App)

Internal reference for deploying and grading the event ticketing Finpro target. **Not for students.** See [`PRD-event-ticketing.md`](./PRD-event-ticketing.md) for the original spec this was built from.

## 1. Architecture recap

- `ticketing-frontend` (Next.js App Router) and `ticketing-backend` (Express) deploy as **two separate Vercel projects**.
- Database: a single Postgres instance (Supabase or any Postgres), **separate from the e-commerce app's**, isolated by a `tenant` column (`s1`/`s2`/`s3`).
- Auth differs from the e-commerce app on purpose: the JWT payload carries `{ sub, email, role, tenant }` directly, and `requireAuth` trusts those claims without re-checking the DB. This is what makes vuln #7 (insecure JWT — the backend accepts `"alg":"none"` with no signature check) meaningful on its own.
- No admin account is ever seeded. The only way into `/admin/sales` is forging a JWT (#7).

## 2. Deploying

### 2.1 Database (Supabase or any Postgres)

1. Create a **separate** Postgres database from the e-commerce one. Grab its connection string.
2. From `ticketing-backend/`, with `DATABASE_URL` set in `.env`, run:
   ```bash
   npm install
   npm run migrate   # creates all tables, idempotent
   npm run seed       # seeds s1, s2, s3 with fresh data + flags
   ```
   `npm run seed` prints the full flag list for all tenants to stdout — **save that output**, it's your grading key for this run (see §4).

### 2.2 Backend (`ticketing-backend`) on Vercel

1. New Vercel project, Root Directory = `ticketing-backend`.
2. Environment variables (Vercel project settings, not committed):
   - `DATABASE_URL` — from step 2.1
   - `JWT_SECRET` — long random string
   - `INTERNAL_FETCH_SECRET` — long random string (never exposed to clients — see vuln #5)
   - `RESET_TOKEN` — long random string (instructor-only secret, see §5)
   - `CORS_ORIGIN` — the deployed frontend's URL (set this **after** step 2.3, then redeploy)
   - `SEED_TENANTS` — `s1,s2,s3` (or your actual tenant ids)
   - `SEED_STUDENT_PASSWORD` — the password all 3 students will log in with
3. Deploy. `vercel.json` already routes everything through `api/index.js` → the Express app.
4. Sanity check: `GET https://<backend-url>/health` → `{"status":"ok",...}`.

### 2.3 Frontend (`ticketing-frontend`) on Vercel

1. New Vercel project, Root Directory = `ticketing-frontend`.
2. Environment variable: `NEXT_PUBLIC_API_URL` = the backend URL from §2.2.
3. Deploy. Then go back and set the backend's `CORS_ORIGIN` to this frontend URL and redeploy the backend.

## 3. Student credentials

| Tenant | Email | Password |
| --- | --- | --- |
| s1 | `s1@student.ticketing.local` | value of `SEED_STUDENT_PASSWORD` |
| s2 | `s2@student.ticketing.local` | same |
| s3 | `s3@student.ticketing.local` | same |

Give each student only their own tenant's email — not the `-victim` account (that's an exploitation target for IDOR, not something they log into).

Public self-registration also works (`/register`) and gets a throwaway isolated sandbox tenant with a plain event catalog — useful for a student to poke around without touching seeded/graded data, but it carries no flags.

## 4. Getting the current flag list

Flags are regenerated **every time a tenant is seeded or reset**. To get the current flags:

```bash
# from ticketing-backend/, against the deployed DATABASE_URL
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT tenant, vuln_key, value FROM flags ORDER BY tenant, vuln_key')
  .then(r => { console.table(r.rows); return pool.end(); });
"
```

Or directly in the Supabase/Postgres SQL editor:

```sql
SELECT tenant, vuln_key, value FROM flags ORDER BY tenant, vuln_key;
```

A submitted flag's tenant must match the submitting student's own tenant (embedded in the flag string, e.g. `FLAG{ticket_s1_idor_ticket_...}`) — reject any submission where it doesn't.

## 5. Resetting a tenant

**Important for this app specifically**: the race-condition exercise (#2) and business-logic exercise (#3) both mutate `events.seats_booked` and can leave a tenant's "Flash Sale" event oversold or drained. Reset before/after grading each student:

```bash
curl -X POST https://<backend-url>/api/admin/reset/s1 \
  -H "x-reset-token: <RESET_TOKEN>"
```

This re-runs the seed for that tenant only (new random flags for it — the other two tenants are untouched) and returns the fresh flag set in the response.

## 6. Vulnerability → endpoint → grading map

| # | Vulnerability | Endpoint | How a student proves it | Flag location |
| --- | --- | --- | --- | --- |
| 1 | IDOR | `GET /api/tickets/:id` | View a ticket id that isn't theirs (their tenant's seeded victim account) | `ticket.note` |
| 2 | Race Condition (overselling) | `POST /api/events/:id/book` | Fire several concurrent booking requests against the capacity-5 "Flash Sale" event | Response `flags.raceCondition`, once `seats_booked > capacity` |
| 3 | Business logic (price/qty tampering) | `POST /api/events/:id/book` | Tamper `price` (e.g. 0) or send negative `quantity` so total ≤ 0 | Response `flags.priceTamper` |
| 4 | Broken Access Control | `POST /api/events` | Call it directly as a logged-in (non-admin) customer — the UI hides the "Buat Event" form, but the endpoint itself never checks role | Response `flag` |
| 5 | SSRF | `POST /api/events/:id/banner-from-url` | Point `url` at `<backend-url>/api/_internal/metadata` — the relay attaches an internal secret header that a direct call can't forge | Reflected in the response's `fetch.bodyPreview` |
| 6 | Stored XSS | Event `description` (created/edited via the #4 exploit) + product's detail page | Payload executes in another session's browser and exfiltrates the JWT to `POST /api/_log` | JSON response from `/api/_log` (note: this endpoint uses **strict** signature verification — a forged alg:none token will NOT get this flag, only a real exfiltrated session) |
| 7 | Insecure JWT Handling | `GET /api/admin/sales` | Forge a token with header `"alg":"none"`, payload `role: "admin"`, drop the signature — no admin account is ever seeded, this is the only way in | Response `flag` (`jwt_forge`) |
| 8 | Missing rate limiting | `GET /api/promos/:code` | Brute-force the random 4-digit secret promo code (no lockout — verified at ~800 sequential requests with zero throttling) | Response `promo.note` |

All 8 were exploited end-to-end (including in a real browser, not just via curl) during development — see `ticketing-backend/README.md` and `ticketing-frontend/README.md` for endpoint/page-level notes.

## 7. Known, deliberate design notes

- **Vuln #2 is inherently non-deterministic.** Depending on network/DB timing, a batch of N concurrent requests against the capacity-5 event might oversell to 7, 9, or all 10 — the grading criterion is "seats_booked ended up above capacity", not an exact number.
- **Vuln #6's flag is decoupled from vuln #7's broken verification on purpose.** `/api/_log` uses strict `jwt.verify` (real HS256 signature required), not the app's normal alg:none-tolerant check — otherwise a student could claim the XSS flag by simply forging a token instead of actually getting a payload to execute in a real session.
- **`/api/_internal/metadata` is a safe, fake resource** (per PRD: "aman untuk diakses sebagai bukti"), gated by a header secret only the banner-from-url relay knows. A direct external call always gets 403 regardless of guessed header names.
- Every vulnerability is contained within the acting student's own tenant (unlike the e-commerce app's SQLi, ticketing has no vuln that inherently crosses tenant boundaries) — cross-tenant leakage anywhere would indicate an actual bug, not an intended finding.

# ticketing-backend

Express.js API for the deliberately vulnerable event ticketing app. See [`../docs/PRD-event-ticketing.md`](../docs/PRD-event-ticketing.md) for full spec.

Complete: all 8 vulnerabilities from the PRD are implemented and verified end-to-end (including through a real browser session, not just curl). See `../docs/PRD-event-ticketing.md` for the spec and `../docs/INSTRUCTOR-event-ticketing.md` for deploy/grading instructions.

**Auth model differs from `ecommerce-backend`**: the JWT payload carries `{ sub, email, role, tenant }` directly, and `requireAuth` never re-queries the DB — it trusts the token's own claims. This is deliberate groundwork for vuln #7 (see `src/config/jwt.js`): `requireAuth` accepts any token whose header says `"alg":"none"` with **no signature check at all**. A forged token (real or fake `sub`, `role` set to `"admin"`, signature segment dropped) sails straight through — verified: `curl` with a hand-crafted `alg:none` token reaches the controller layer instead of getting a 401.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, RESET_TOKEN, INTERNAL_FETCH_SECRET, etc.
npm run migrate        # create tables (idempotent)
npm run seed             # seed all tenants in SEED_TENANTS (default s1,s2,s3)
npm run dev
```

Server runs on `http://localhost:4001` by default. `GET /health` returns a status check.

### Database & seed data

- `db/migrations/*.sql` — schema, applied in order by `npm run migrate` (also runs automatically before `npm run seed`).
- `npm run seed` — (re)seeds **all** tenants from scratch: each tenant gets 1 real student account (`<tenant>@student.ticketing.local`, password from `SEED_STUDENT_PASSWORD`), 1 dummy "victim" account, 4 sample events (one with capacity 5, deliberately small for the race-condition exercise), one victim ticket (carries the IDOR flag), a secret 4-digit promo code, and a `flags` table row per vulnerability for grading reference.
- `npm run seed -- <tenant>` — reseed a single tenant only.
- `POST /api/admin/reset/:tenant` (header `x-reset-token: <RESET_TOKEN>`) — same as above, callable against a deployed instance. Returns the tenant's fresh flag set. Important for this app specifically since booking-related testing (race condition, tampering) mutates `seats_booked`.

All flags for grading can be read from the `flags` table (`SELECT * FROM flags ORDER BY tenant, vuln_key`), or from the seed/reset command output.

## API endpoints so far

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Self-registration gets its own isolated `self_*` tenant, pre-seeded with a plain event catalog (no victims/flags) |
| POST | `/api/auth/login` | — | Returns JWT (`{ sub, email, role, tenant }`, 7d expiry) |
| GET | `/api/users/me` | Bearer | Profile display only — DB-sourced, not part of the auth path |
| GET | `/api/events` | Bearer | Scoped to caller's tenant |
| GET | `/api/events/:id` | Bearer | 404 if the event isn't in caller's tenant |
| POST | `/api/events` | Bearer | **Vuln #4**: no role check at all — any authenticated customer can create an event; flag returned on success |
| PUT | `/api/events/:id` | Bearer | Same vuln #4 — no role check. `description` stored/returned verbatim, no sanitization (**vuln #6** fires once the frontend renders it, batch 7) |
| POST | `/api/events/:id/book` | Bearer | **Vuln #2**: capacity check → 300ms artificial delay → separate UPDATE, no locking — verified: 10 concurrent requests against a capacity-5 event all succeeded (`seats_booked` reached 10), flag returned once oversold. **Vuln #3**: trusts client `price`/`quantity` — total ≤ 0 achievable, flag returned |
| GET | `/api/tickets` | Bearer | Caller's own tickets only |
| GET | `/api/tickets/:id` | Bearer | **Vuln #1**: no ownership check — any ticket id within caller's tenant is returned, including the seeded victim's (flag in `note`). Cross-tenant ids still 404 |
| GET | `/api/promos/:code` | Bearer | **Vuln #8**: no rate limiting — the random 4-digit secret promo is only findable by brute force (verified: 775 sequential requests, no throttling) |
| POST | `/api/events/:id/banner-from-url` | Bearer | **Vuln #5 (SSRF)**: fetches any URL server-side with no validation/whitelist and reflects status/content-type/body back to the caller (non-blind) |
| GET | `/api/_internal/metadata` | none (gated by `x-internal-fetch-secret` header, server-only secret) | Fake internal service — 403 on any direct call without the secret; only the banner-from-url relay knows it. Returns a tenant-specific flag via `x-requesting-tenant` |
| GET | `/api/admin/sales` | Bearer + admin role | Legitimately protected (`requireAdmin`). No admin account is ever seeded — **Vuln #7** (forged `alg:none` JWT claiming `role: admin`) is the only way in. Verified: real customer token → 403; forged token → full access + `jwt_forge` flag + real sales data |
| POST | `/api/_log` | — | Exfil sink for **Vuln #6**'s payload; if `stolenToken` is a real, properly-*HS256*-signed JWT, responds with that tenant's `xss_description` flag. Deliberately uses strict `jwt.verify` here (not the app's normal alg:none-tolerant check) — otherwise a forged alg:none token would trivially claim this flag without any real XSS execution. Verified: forged alg:none token → no flag; real token → flag |
| POST | `/api/admin/reset/:tenant` | `x-reset-token` header | Instructor-only |

`POST /api/events/:id/book` also accepts an optional `promoCode`, looked up with the same unauthenticated-by-rate-limit logic as above and applied to the total.

## Structure

```
api/index.js       # Vercel serverless entrypoint (wraps the Express app)
src/app.js          # Express app (middleware + route mounting)
src/server.js        # Local dev entrypoint (app.listen)
src/config/db.js      # PostgreSQL (Supabase) connection pool
src/routes/          # Route definitions, mounted under /api
src/controllers/      # Request handlers
src/middleware/       # Express middleware (auth, reset-token guard, etc.)
src/models/          # Data access helpers
db/migrations/        # SQL schema migrations
db/seed.js           # Seed / reset logic (also used by the reset endpoint)
db/lib/flags.js        # Flag string generation
db/lib/fixtures.js      # Event catalog fixture data
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ticketing-backend`). Set environment variables from `.env.example` in the Vercel project settings — never commit real credentials.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

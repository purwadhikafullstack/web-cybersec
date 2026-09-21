# ecommerce-backend

Express.js API for the deliberately vulnerable e-commerce app. See [`../docs/PRD-ecommerce.md`](../docs/PRD-ecommerce.md) for full spec.

Complete: all 8 vulnerabilities from the PRD are implemented and verified end-to-end (including through a real browser session, not just curl). See `../docs/PRD-ecommerce.md` for the spec and `../docs/INSTRUCTOR-ecommerce.md` for deploy/grading instructions.

## API endpoints so far

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Self-registration gets its own isolated `self_*` tenant, pre-seeded with the same plain product catalog (no victims/flags/coupons) so the storefront isn't a dead end |
| POST | `/api/auth/login` | — | Returns JWT (`{ sub: userId }`, 7d expiry) |
| GET | `/api/users/me` | Bearer | |
| PATCH | `/api/users/me` | Bearer | **Vuln #4**: accepts `role` from the body with no authorization check — any user can PATCH `{"role":"admin"}` and it takes effect immediately (no re-login needed) |
| GET | `/api/products` | Bearer | Scoped to caller's tenant |
| GET | `/api/products/:id` | Bearer | Includes reviews; 404 if the product isn't in caller's tenant |
| GET | `/api/products/search?q=` | Bearer | **Vuln #2**: `q` is concatenated directly into the SQL string — UNION-injectable to extract the hidden `admin_notes` table |
| POST | `/api/products/:id/reviews` | Bearer | **Vuln #3 (storage half)**: `body` is stored and returned verbatim, no sanitization — fires once the frontend renders it unescaped (batch 7) |
| POST | `/api/_log` | — | Exfil sink for the XSS payload; if `stolenToken` is a real, currently-valid JWT, responds with that tenant's `xss_review` flag |
| POST | `/api/checkout` | Bearer | **Vuln #5**: trusts client-sent `price`/`quantity` per item instead of recomputing from `products` — total ≤ 0 is achievable and returns the `price_tamper` flag |
| GET | `/api/orders` | Bearer | Caller's own orders only |
| GET | `/api/orders/:id` | Bearer | **Vuln #1**: no ownership check — any order id within caller's tenant is returned, including the seeded victim's order (flag in `note`). Cross-tenant ids still 404 |
| GET | `/api/coupons/:code` | Bearer | **Vuln #6**: no role check — the guessable `ADMIN100` (100% off) coupon is readable by any customer. **Vuln #8**: no rate limiting — the random 4-digit secret coupon is only findable by brute force (verified: 835 sequential requests, no throttling) |
| GET | `/api/users` | Bearer | **Vuln #7**: meant to be admin-only, wired with `requireAuth` only — any customer can list every user in their tenant (email/phone), including a decoy account whose `phone` carries the flag |
| GET | `/api/admin/dashboard` | Bearer + admin role | Legitimately protected. Returns the `bac_role` flag (proof of successful escalation, #4) plus tenant stats and the full coupon list (surfaces both coupon flags, #6/#8) |
| GET/POST | `/api/admin/products` | Bearer + admin role | List / create products for caller's tenant |
| PUT | `/api/admin/products/:id` | Bearer + admin role | Edit a product |
| GET | `/api/admin/orders` | Bearer + admin role | All orders across every user in caller's tenant |
| POST | `/api/admin/reset/:tenant` | `x-reset-token` header | Instructor-only, see below |

`POST /api/checkout` also accepts an optional `couponCode`, looked up with the same unauthenticated-by-role logic as above and applied to the total.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, RESET_TOKEN, etc.
npm run migrate        # create tables (idempotent)
npm run seed            # seed all tenants in SEED_TENANTS (default s1,s2,s3)
npm run dev
```

Server runs on `http://localhost:4000` by default. `GET /health` returns a status check.

### Database & seed data

- `db/migrations/*.sql` — schema, applied in order by `npm run migrate` (also runs automatically before `npm run seed`).
- `npm run seed` — (re)seeds **all** tenants from scratch: each tenant gets 1 real student account (`<tenant>@student.ecommerce.local`, password from `SEED_STUDENT_PASSWORD`), 1 dummy "victim" account, a decoy account carrying the sensitive-data-exposure flag, a product catalog, one victim order (carries the IDOR flag), two coupons (a guessable admin one + a random 4-digit secret one), a hidden `admin_notes` row (SQLi flag), and a `flags` table row per vulnerability for grading reference.
- `npm run seed -- <tenant>` — reseed a single tenant only (e.g. `npm run seed -- s1`).
- `POST /api/admin/reset/:tenant` (header `x-reset-token: <RESET_TOKEN>`) — same as above, callable against a deployed instance without shell access. Returns the tenant's fresh flag set in the response (instructor-only; never call this from student-facing code).

All flags for grading can be read directly from the `flags` table (`SELECT * FROM flags ORDER BY tenant, vuln_key`), or from the seed/reset command output.

## Structure

```
api/index.js       # Vercel serverless entrypoint (wraps the Express app)
src/app.js          # Express app (middleware + route mounting)
src/server.js        # Local dev entrypoint (app.listen)
src/config/db.js      # PostgreSQL (Supabase) connection pool
src/config/jwt.js      # JWT sign/verify (payload = { sub: userId } only)
src/routes/          # Route definitions, mounted under /api
src/controllers/      # Request handlers
src/middleware/       # requireAuth, requireAdmin, requireResetToken
src/models/          # Data access helpers
db/migrations/        # SQL schema migrations
db/seed.js           # Seed / reset logic (also used by the reset endpoint)
db/lib/flags.js        # Flag string generation
db/lib/fixtures.js      # Product catalog fixture data
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ecommerce-backend`). Set environment variables from `.env.example` in the Vercel project settings — never commit real credentials.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

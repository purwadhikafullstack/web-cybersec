# ticketing-frontend

Next.js (App Router) frontend for the deliberately vulnerable event ticketing app. See [`../docs/PRD-event-ticketing.md`](../docs/PRD-event-ticketing.md) for full spec.

All pages are wired up end-to-end against `ticketing-backend`, verified in a real browser session (Playwright) covering all 8 vulnerabilities. No styling polish beyond making each flow — and each vulnerability — reachable through the UI. See `../docs/INSTRUCTOR-event-ticketing.md` for deploy/grading instructions.

## Local development

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at ticketing-backend
npm run dev
```

Runs on `http://localhost:3001` by default. Requires `ticketing-backend` running (and seeded — see its README) at the URL in `NEXT_PUBLIC_API_URL`.

## Pages

| Route | Notes |
| --- | --- |
| `/`, `/login`, `/register` | Event catalog, auth |
| `/events/:id` | Event detail, booking form (quantity + promo code), "Set Banner dari URL" form (SSRF, #5). Description renders via `dangerouslySetInnerHTML` with no sanitization — this is where stored XSS (#6) actually fires |
| `/tickets`, `/tickets/:id` | Own tickets + detail (IDOR #1 reachable by editing the URL's id) |
| `/admin` | "Buat Event" form only rendered when the client thinks `role === "admin"` (mirrors PRD's "disembunyikan di UI" — the backend has no such check at all, #4); sales dashboard always attempts the real, properly-protected API call (#7 payoff) |

The JWT is stored in `localStorage` (not an httpOnly cookie) so an XSS payload can read/exfiltrate it, and so a forged token can be tested by pasting it into `localStorage` directly — `lib/auth-context.js` derives the displayed `role`/`tenant` from decoding the token's own (unverified) claims, matching exactly what the backend trusts.

## Structure

```
app/            # App Router pages/layouts (all client components)
lib/api.js       # Fetch helper — injects Authorization header, decodes JWT claims client-side
lib/auth-context.js  # React context: user/token state, login/register/logout
components/Navbar.js # Top nav, adapts to auth state / role
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ticketing-frontend`). Set `NEXT_PUBLIC_API_URL` to the deployed `ticketing-backend` URL in the Vercel project settings.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

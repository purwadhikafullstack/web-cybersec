# ecommerce-frontend

Next.js (App Router) frontend for the deliberately vulnerable e-commerce app. See [`../docs/PRD-ecommerce.md`](../docs/PRD-ecommerce.md) for full spec.

All pages are wired up end-to-end against `ecommerce-backend`, verified in a real browser session (Playwright) covering all 8 vulnerabilities. No styling polish beyond making each flow — and each vulnerability — reachable through the UI. See `../docs/INSTRUCTOR-ecommerce.md` for deploy/grading instructions.

## Local development

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at ecommerce-backend
npm run dev
```

Runs on `http://localhost:3000` by default. Requires `ecommerce-backend` running (and seeded — see its README) at the URL in `NEXT_PUBLIC_API_URL`.

## Pages

| Route | Notes |
| --- | --- |
| `/`, `/login`, `/register` | Catalog (search box hits the vulnerable `/products/search`), auth |
| `/products/:id` | Product detail, add to cart, review form. Reviews render via `dangerouslySetInnerHTML` with no sanitization — this is where stored XSS (#3) actually fires |
| `/cart`, `/checkout` | localStorage cart; checkout accepts a coupon code (calls the vulnerable `/coupons/:code` lookup) |
| `/orders`, `/orders/:id` | Own orders + detail (IDOR #1 reachable by editing the URL's id) |
| `/profile` | Edit name/address/phone — deliberately has no `role` field in the form; the backend still accepts one if sent directly (#4) |
| `/admin` | Renders only once the backend grants admin (dashboard flag, coupons, product/order management) |

The JWT is stored in `localStorage` (not an httpOnly cookie) specifically so an XSS payload can read and exfiltrate it — see `lib/api.js`.

## Structure

```
app/            # App Router pages/layouts (all client components)
lib/api.js       # Fetch helper — injects Authorization header from localStorage
lib/auth-context.js  # React context: user/token state, login/register/logout
lib/cart.js       # localStorage-backed cart helpers
components/Navbar.js # Top nav, adapts to auth state / role
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ecommerce-frontend`). Set `NEXT_PUBLIC_API_URL` to the deployed `ecommerce-backend` URL in the Vercel project settings.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

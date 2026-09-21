# ticketing-frontend

Next.js (App Router) frontend for the deliberately vulnerable event ticketing app. See [`../docs/PRD-event-ticketing.md`](../docs/PRD-event-ticketing.md) for full spec.

Currently a bare scaffold — no features implemented yet.

## Local development

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at ticketing-backend
npm run dev
```

Runs on `http://localhost:3001` by default.

## Structure

```
app/            # App Router pages/layouts
lib/api.js       # Fetch helper for calling ticketing-backend
components/       # Shared UI components
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ticketing-frontend`). Set `NEXT_PUBLIC_API_URL` to the deployed `ticketing-backend` URL in the Vercel project settings.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

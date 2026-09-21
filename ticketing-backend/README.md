# ticketing-backend

Express.js API for the deliberately vulnerable event ticketing app. See [`../docs/PRD-event-ticketing.md`](../docs/PRD-event-ticketing.md) for full spec.

Currently a bare scaffold — no features or vulnerabilities implemented yet.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL etc.
npm run dev
```

Server runs on `http://localhost:4001` by default. `GET /health` returns a status check.

## Structure

```
api/index.js       # Vercel serverless entrypoint (wraps the Express app)
src/app.js          # Express app (middleware + route mounting)
src/server.js        # Local dev entrypoint (app.listen)
src/config/db.js      # PostgreSQL (Supabase) connection pool
src/routes/          # Route definitions, mounted under /api
src/controllers/      # Request handlers
src/middleware/       # Express middleware (auth, etc.)
src/models/          # Data access helpers
```

## Deployment

Deploy this folder as its own Vercel project (Root Directory = `ticketing-backend`). Set environment variables from `.env.example` in the Vercel project settings — never commit real credentials.

`vercel.json`'s `ignoreCommand` skips a deployment when nothing under this folder changed (this repo is a monorepo shared with the other 3 apps) — without it, every push would rebuild all 4 Vercel projects regardless of which folder actually changed.

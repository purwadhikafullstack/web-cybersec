-- Initial schema for the deliberately vulnerable event ticketing app.
-- Sequential integer PKs are intentional (not UUIDs): IDOR (#1) relies on
-- easily-guessable, incrementing ticket ids.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  capacity INTEGER NOT NULL,
  seats_booked INTEGER NOT NULL DEFAULT 0,
  banner_url TEXT,
  created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant ON events (tenant);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  price_paid NUMERIC(12, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets (event_id);

CREATE TABLE IF NOT EXISTS promos (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promos_tenant ON promos (tenant);
CREATE INDEX IF NOT EXISTS idx_promos_code ON promos (code);

-- Central bookkeeping for flags that aren't naturally "stored data" to leak
-- (race condition, business logic tampering, broken access control, SSRF,
-- JWT forgery) but are instead granted dynamically by application code once
-- the vulnerability is exploited.
CREATE TABLE IF NOT EXISTS flags (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
  vuln_key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant, vuln_key)
);

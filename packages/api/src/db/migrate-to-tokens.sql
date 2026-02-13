-- Migration: licenses → tokens + purchases
-- Run once on existing database

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  template_id TEXT NOT NULL REFERENCES templates(id),
  stripe_payment_id TEXT,
  purchased_at TEXT DEFAULT (datetime('now')),
  UNIQUE(token_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens(email);
CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(token_id);

-- Migrate existing licenses: group by email, first license_key becomes token
INSERT OR IGNORE INTO tokens (id, email, token, user_id, created_at)
SELECT
  'tok_' || SUBSTR(id, 5),
  email,
  license_key,
  user_id,
  created_at
FROM licenses
GROUP BY email;

-- Migrate purchases
INSERT OR IGNORE INTO purchases (id, token_id, template_id, stripe_payment_id, purchased_at)
SELECT
  'pur_' || SUBSTR(l.id, 5),
  t.id,
  l.template_id,
  l.stripe_payment_id,
  l.created_at
FROM licenses l
JOIN tokens t ON t.email = l.email;

-- Recreate downloads table with token_id
DROP TABLE IF EXISTS downloads;
CREATE TABLE downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  template_id TEXT NOT NULL,
  ip TEXT,
  downloaded_at TEXT DEFAULT (datetime('now'))
);

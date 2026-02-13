CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  file_key TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT DEFAULT (datetime('now'))
);

-- One token per user, never expires
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Which templates a user has purchased
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  template_id TEXT NOT NULL REFERENCES templates(id),
  stripe_payment_id TEXT,
  purchased_at TEXT DEFAULT (datetime('now')),
  UNIQUE(token_id, template_id)
);

CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  template_id TEXT NOT NULL,
  ip TEXT,
  downloaded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens(email);
CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(token_id);

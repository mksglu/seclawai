-- Dev seed: creates a dev token with access to ALL templates
-- Usage: cd packages/api && pnpm db:seed:dev

-- Ensure all templates exist
INSERT OR REPLACE INTO templates (id, name, description, price_cents, stripe_price_id, file_key, version) VALUES
  ('productivity-agent', 'Productivity Agent', 'Morning report, evening check-in, Telegram assistant.', 0, NULL, 'templates/productivity-agent.json', '1.0.0'),
  ('data-analyst', 'Data Analyst', 'CSV/JSON analysis, visualizations, automated reports.', 0, NULL, 'templates/data-analyst.json', '1.0.0'),
  ('inbox-agent', 'Inbox Agent', 'Email categorization, summarization, and Telegram digest.', 1900, NULL, 'templates/inbox-agent.json', '1.0.0'),
  ('reddit-hn-digest', 'Reddit & HN Digest', 'Daily curated digest from Reddit and Hacker News.', 1900, NULL, 'templates/reddit-hn-digest.json', '1.0.0'),
  ('youtube-digest', 'YouTube Digest', 'Morning summary of new videos from favorite channels.', 1900, NULL, 'templates/youtube-digest.json', '1.0.0'),
  ('health-tracker', 'Health Tracker', 'Food and symptom tracking with weekly correlation analysis.', 2900, NULL, 'templates/health-tracker.json', '1.0.0'),
  ('earnings-tracker', 'Earnings Tracker', 'Tech/AI earnings reports with beat/miss analysis.', 2900, NULL, 'templates/earnings-tracker.json', '1.0.0'),
  ('research-agent', 'Research Agent', 'Multi-source scan, daily digest, trend detection.', 3900, NULL, 'templates/research-agent.json', '1.0.0'),
  ('knowledge-base', 'Knowledge Base', 'Personal knowledge management from URLs, articles, tweets.', 3900, NULL, 'templates/knowledge-base.json', '1.0.0'),
  ('family-calendar', 'Family Calendar', 'Household coordination with calendar aggregation.', 3900, NULL, 'templates/family-calendar.json', '1.0.0'),
  ('content-agent', 'Content Agent', 'Research trending topics, draft in your voice, post with approval.', 4900, NULL, 'templates/content-agent.json', '1.0.0'),
  ('personal-crm', 'Personal CRM', 'Contact management with auto-discovery from email.', 4900, NULL, 'templates/personal-crm.json', '1.0.0'),
  ('youtube-creator', 'YouTube Creator', 'Content pipeline for YouTube creators.', 6900, NULL, 'templates/youtube-creator.json', '1.0.0'),
  ('devops-agent', 'DevOps Agent', 'Infrastructure monitoring and self-healing.', 7900, NULL, 'templates/devops-agent.json', '1.0.0'),
  ('customer-service', 'Customer Service', 'Multi-channel customer support with knowledge base.', 7900, NULL, 'templates/customer-service.json', '1.0.0'),
  ('sales-agent', 'Sales Agent', 'B2B lead finding, buying signal detection, personalized outreach.', 7900, NULL, 'templates/sales-agent.json', '1.0.0'),
  ('six-agent-company', '6-Agent Company', '6 coordinated AI agents with quality gates and 5-type memory.', 14900, NULL, 'templates/six-agent-company.json', '1.0.0');

-- Dev token
INSERT OR IGNORE INTO tokens (id, email, token, user_id)
  VALUES ('dev-token-id', 'dev@seclaw.local', 'dev-all-access', NULL);

-- Grant access to all paid templates
INSERT OR IGNORE INTO purchases (id, token_id, template_id, stripe_payment_id) VALUES
  ('dev-p-01', 'dev-token-id', 'inbox-agent', 'dev'),
  ('dev-p-02', 'dev-token-id', 'reddit-hn-digest', 'dev'),
  ('dev-p-03', 'dev-token-id', 'youtube-digest', 'dev'),
  ('dev-p-04', 'dev-token-id', 'health-tracker', 'dev'),
  ('dev-p-05', 'dev-token-id', 'earnings-tracker', 'dev'),
  ('dev-p-06', 'dev-token-id', 'research-agent', 'dev'),
  ('dev-p-07', 'dev-token-id', 'knowledge-base', 'dev'),
  ('dev-p-08', 'dev-token-id', 'family-calendar', 'dev'),
  ('dev-p-09', 'dev-token-id', 'content-agent', 'dev'),
  ('dev-p-10', 'dev-token-id', 'personal-crm', 'dev'),
  ('dev-p-11', 'dev-token-id', 'youtube-creator', 'dev'),
  ('dev-p-12', 'dev-token-id', 'devops-agent', 'dev'),
  ('dev-p-13', 'dev-token-id', 'customer-service', 'dev'),
  ('dev-p-14', 'dev-token-id', 'sales-agent', 'dev'),
  ('dev-p-15', 'dev-token-id', 'six-agent-company', 'dev');

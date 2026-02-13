export interface ScheduleItem {
  time: string;
  action: string;
}

export interface FeatureRow {
  feature: string;
  details: string;
}

export interface TemplateContent {
  schedule?: ScheduleItem[];
  setup?: string[];
  howItWorks?: string;
  fileStructure?: string;
  featuresTable?: FeatureRow[];
  digestExample?: string;
}

export const TEMPLATE_CONTENT: Record<string, TemplateContent> = {
  "productivity-agent": {
    schedule: [
      { time: "07:00", action: "Morning report: tasks, priorities, calendar overview" },
      { time: "21:00", action: "Evening check-in: progress review, next-day prep" },
      { time: "On demand", action: "Task management, email drafting, file organization via Telegram" },
    ],
    setup: [
      "Run `npx seclaw` and select Productivity Agent",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Telegram message --> Agent processes --> Tool execution --> Response\nMorning report (07:00) --> Task summary + calendar --> Telegram\nEvening check-in (21:00) --> Progress review --> Telegram",
    fileStructure: "/shared/config/          -- agent configuration\n/shared/memory/          -- persistent context across sessions",
    featuresTable: [
      { feature: "Morning reports", details: "Daily 07:00 briefing with tasks and priorities" },
      { feature: "Evening check-in", details: "21:00 progress review and next-day planning" },
      { feature: "Task management", details: "Create, track, and complete TODO items" },
      { feature: "Email drafting", details: "Draft emails via Gmail integration" },
      { feature: "File organization", details: "Manage notes and files on your machine" },
    ],
  },

  "inbox-agent": {
    schedule: [
      { time: "Every 2 hours", action: "Scan Gmail inbox for new emails" },
      { time: "Instant", action: "URGENT emails sent to Telegram immediately" },
      { time: "On demand", action: "Full inbox digest on request" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/inbox-agent`",
      "Run `npx seclaw add inbox-agent --key YOUR_LICENSE_KEY`",
      "Connect Gmail via `npx seclaw integrations`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Scan (every 2h) --> Categorize --> Summarize --> Preview (Telegram)\n                                              --> [Approve] --> Deliver digest\n                                              --> [Reject]  --> Skip",
    featuresTable: [
      { feature: "4 categories", details: "URGENT / ACTION / FYI / NEWSLETTER" },
      { feature: "Instant alerts", details: "URGENT emails bypass the digest schedule" },
      { feature: "Human-in-the-loop", details: "Approve or reject before delivery" },
      { feature: "Concise", details: "1-2 line summaries per email" },
      { feature: "Composio OAuth", details: "Secure Gmail connection via OAuth" },
    ],
    digestExample: "URGENT (2)\n- [CTO] Server down in production -- P0 incident, needs immediate response\n- [Client] Contract deadline tomorrow -- Signature required by EOD\n\nACTION (4)\n- [PM] Sprint planning invite -- Wednesday 10am, please confirm\n- [HR] Benefits enrollment -- Open until Friday\n\nFYI (8)\n- [GitHub] PR #142 merged -- Feature branch cleanup\n- [Slack] Channel archive notice -- #old-project archived\n\nNEWSLETTER (5)\n- TechCrunch, Morning Brew, TLDR, Hacker Newsletter, Product Hunt",
  },

  "reddit-hn-digest": {
    schedule: [
      { time: "08:00", action: "Hacker News frontpage digest" },
      { time: "17:00", action: "Reddit top posts digest from your subreddits" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/reddit-hn-digest`",
      "Run `npx seclaw add reddit-hn-digest --key YOUR_LICENSE_KEY`",
      "Configure your subreddits in `/shared/config/preferences.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Scan subreddits + HN --> Filter by preferences --> Deduplicate --> Summarize --> Telegram",
    fileStructure: "/shared/config/preferences.md  -- your topics and subreddits\n/shared/digests/reddit/        -- daily Reddit digests\n/shared/digests/hn/            -- daily HN digests\n/shared/memory/                -- preference learning data",
    featuresTable: [
      { feature: "Dual source", details: "Reddit subreddits + Hacker News frontpage" },
      { feature: "Learns preferences", details: "Adapts to your interests over time" },
      { feature: "No duplicates", details: "Tracks seen posts across sessions" },
      { feature: "Score filtering", details: "Only surfaces posts above quality threshold" },
      { feature: "1-line summaries", details: "Title, score, comments, and key takeaway" },
    ],
  },

  "youtube-digest": {
    schedule: [
      { time: "08:00", action: "Scan YouTube for new videos from favorite channels" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/youtube-digest`",
      "Run `npx seclaw add youtube-digest --key YOUR_LICENSE_KEY`",
      "Add your channels to `/shared/config/channels.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Scan channels (08:00) --> Find new videos --> Extract key takeaways --> Telegram digest",
    fileStructure: "/shared/config/channels.md     -- your favorite YouTube channels\n/shared/digests/youtube/        -- daily video digests\n/shared/seen-videos.txt         -- deduplication tracker\n/shared/memory/                 -- preference data",
    featuresTable: [
      { feature: "Channel monitoring", details: "Track specific YouTube channels" },
      { feature: "Key takeaways", details: "2-3 bullet summary per video" },
      { feature: "Deduplication", details: "Never see the same video twice" },
      { feature: "Morning briefing", details: "Daily digest delivered to Telegram" },
    ],
  },

  "health-tracker": {
    schedule: [
      { time: "08:00", action: "Morning check-in: overnight symptoms, breakfast, energy level" },
      { time: "13:00", action: "Lunch check-in: food intake, symptoms, energy" },
      { time: "19:00", action: "Evening check-in: dinner, overall day review" },
      { time: "Sunday 10:00", action: "Weekly analysis: food-symptom correlations and trends" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/health-tracker`",
      "Run `npx seclaw add health-tracker --key YOUR_LICENSE_KEY`",
      "Reply to check-in prompts naturally via Telegram",
    ],
    howItWorks: "Check-in (3x daily) --> Log food + symptoms --> Weekly analysis\n                                                --> Find correlations\n                                                --> Update triggers\n                                                --> Report",
    fileStructure: "/shared/logs/                  -- daily food and symptom logs\n/shared/reports/weekly/         -- weekly analysis reports\n/shared/config/triggers.md      -- identified food-symptom triggers\n/shared/memory/                 -- historical tracking data",
    featuresTable: [
      { feature: "3x daily check-ins", details: "Morning, lunch, and evening via Telegram" },
      { feature: "Food-symptom correlation", details: "Statistical analysis of what affects you" },
      { feature: "Trigger detection", details: "Auto-flags foods that co-occur with symptoms 3+ times" },
      { feature: "Energy tracking", details: "1-10 scale with weekly averages" },
      { feature: "Weekly reports", details: "Sunday morning analysis with trends" },
    ],
  },

  "earnings-tracker": {
    schedule: [
      { time: "Sunday 18:00", action: "Preview upcoming week's earnings reports" },
      { time: "Every 4h (weekdays)", action: "Check for new earnings drops from watchlist companies" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/earnings-tracker`",
      "Run `npx seclaw add earnings-tracker --key YOUR_LICENSE_KEY`",
      "Add tickers to `/shared/config/watchlist.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Weekly preview (Sunday) --> Scan earnings calendar --> Match watchlist --> Alert\nWeekday check (4h) --> Scan news --> Detect new results --> Beat/miss analysis --> Telegram",
    fileStructure: "/shared/config/watchlist.md     -- tickers to track\n/shared/earnings/calendar.md    -- upcoming earnings dates\n/shared/earnings/YYYY/          -- per-company earnings reports",
    featuresTable: [
      { feature: "Weekly preview", details: "Sunday evening briefing of upcoming earnings" },
      { feature: "Real-time alerts", details: "New results detected within hours" },
      { feature: "Beat/miss analysis", details: "EPS and revenue vs estimates" },
      { feature: "AI segment tracking", details: "Highlights AI-related revenue breakdowns" },
      { feature: "Watchlist filtering", details: "Only tracks companies you care about" },
    ],
  },

  "research-agent": {
    schedule: [
      { time: "08:00", action: "Morning scan: X, Hacker News, Reddit, and web for industry news" },
      { time: "On demand", action: "Deep research on any topic across all sources" },
      { time: "Sundays", action: "Weekly summary: top patterns and trends" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/research-agent`",
      "Run `npx seclaw add research-agent --key YOUR_LICENSE_KEY`",
      "Create your interests file at `/shared/config/interests.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Morning Scan (08:00) --> Filter by interests --> Urgency labels --> Digest --> Telegram",
    fileStructure: "/shared/config/interests.md        -- your topics, competitors, keywords\n/shared/research/reported-items.md -- duplicate prevention database\n/shared/research/topic-*.md        -- on-demand research reports\n/shared/digests/YYYY-MM-DD.md      -- daily digests\n/shared/digests/weekly-YYYY-WXX.md -- weekly summaries",
    featuresTable: [
      { feature: "Multi-source", details: "X, Hacker News, Reddit, RSS feeds" },
      { feature: "Urgency labels", details: "HIGH / MEDIUM / LOW on every item" },
      { feature: "No duplicates", details: "Persistent tracking of reported items" },
      { feature: "Max 10/day", details: "Only the most important items surface" },
      { feature: "Weekly summary", details: "Pattern detection across weekly data" },
      { feature: "On-demand", details: "\"research [topic]\" for deep dives" },
    ],
  },

  "knowledge-base": {
    schedule: [
      { time: "Sunday 03:00", action: "Weekly maintenance: dedup, verify files, stats report" },
      { time: "On demand", action: "Save URLs, articles, tweets via Telegram" },
      { time: "On demand", action: "Natural language search across saved content" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/knowledge-base`",
      "Run `npx seclaw add knowledge-base --key YOUR_LICENSE_KEY`",
      "Send URLs or text to save via Telegram",
    ],
    howItWorks: "Share URL/text --> Agent saves + tags + indexes --> Search later with natural language\nWeekly maintenance --> Dedup --> Verify files --> Stats report --> Telegram",
    fileStructure: "/shared/kb/articles/       -- saved article content\n/shared/kb/index.json      -- search index with tags\n/shared/config/            -- categorization rules\n/shared/memory/            -- preference learning data",
    featuresTable: [
      { feature: "Save anything", details: "URLs, articles, tweets, and raw text" },
      { feature: "Auto-tagging", details: "AI-powered categorization on save" },
      { feature: "Natural language search", details: "Find saved content by asking questions" },
      { feature: "Weekly maintenance", details: "Dedup, file verification, usage stats" },
      { feature: "Local storage", details: "All content stays on your machine" },
    ],
  },

  "family-calendar": {
    schedule: [
      { time: "07:00", action: "Morning briefing: today's events for all family members" },
      { time: "20:00", action: "Evening prep: tomorrow's schedule and pending tasks" },
      { time: "Saturday 09:00", action: "Weekly grocery list from low-stock inventory" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/family-calendar`",
      "Run `npx seclaw add family-calendar --key YOUR_LICENSE_KEY`",
      "Connect Google Calendar via `npx seclaw integrations`",
      "Configure family members in `/shared/config/calendars.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Aggregate calendars --> Detect conflicts --> Add driving buffers --> Morning briefing\nEvening scan --> Tomorrow preview + pending tasks --> Evening prep\nSaturday --> Check inventory --> Generate grocery list --> Approve",
    fileStructure: "/shared/config/calendars.md  -- family member calendars\n/shared/tasks/               -- pending task lists\n/shared/inventory.json       -- grocery inventory with thresholds\n/shared/memory/              -- event history and preferences",
    featuresTable: [
      { feature: "Calendar aggregation", details: "All family members in one view" },
      { feature: "Conflict detection", details: "Flags overlapping events automatically" },
      { feature: "Driving buffers", details: "Adds travel time between locations" },
      { feature: "Grocery management", details: "Tracks inventory, generates shopping lists" },
      { feature: "Approval workflow", details: "Grocery list requires Telegram approval" },
    ],
  },

  "content-agent": {
    schedule: [
      { time: "09:00", action: "Research: scans trends, competitors, and past performance" },
      { time: "11:00", action: "Drafting: creates 3 draft variants per content idea" },
      { time: "On approval", action: "Posts approved content to X via API" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/content-agent`",
      "Run `npx seclaw add content-agent --key YOUR_LICENSE_KEY`",
      "Create your style guide at `/shared/voice/style-guide.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Research (09:00) --> Draft (11:00) --> Preview (Telegram) --> [Approve] --> Post\n                                                    --> [Reject]  --> Skip",
    fileStructure: "/shared/voice/style-guide.md      -- your writing style guide\n/shared/drafts/YYYY-MM-DD/        -- daily draft variants\n/shared/analytics/performance.md  -- engagement tracking\n/shared/content/posted/            -- archive of posted content",
    featuresTable: [
      { feature: "Voice matching", details: "Reads your style guide, mimics your tone" },
      { feature: "3 drafts always", details: "Educational, story/personal, contrarian" },
      { feature: "Human-in-the-loop", details: "Requires Telegram approval for every post" },
      { feature: "Research-driven", details: "Morning trend scan informs drafts" },
      { feature: "File-based memory", details: "Analytics and style guide persist across restarts" },
    ],
  },

  "personal-crm": {
    schedule: [
      { time: "06:00", action: "Contact scan: discover new contacts from yesterday's emails and meetings" },
      { time: "07:00", action: "Meeting prep: briefings for today's meetings with attendee context" },
      { time: "Monday 09:00", action: "Follow-up check: contacts going cold (no interaction in 14+ days)" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/personal-crm`",
      "Run `npx seclaw add personal-crm --key YOUR_LICENSE_KEY`",
      "Connect Gmail and Google Calendar via `npx seclaw integrations`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Scan emails + calendar --> Extract contacts --> Update CRM --> Brief for meetings\nMonday check --> Find stale contacts --> Suggest talking points --> Telegram",
    fileStructure: "/shared/crm/contacts.json     -- contact database with interaction history\n/shared/config/crm-rules.md   -- ignore list and VIP settings\n/shared/memory/               -- relationship context data",
    featuresTable: [
      { feature: "Auto-discovery", details: "New contacts found from emails and calendar" },
      { feature: "Meeting briefings", details: "Context on every attendee before meetings" },
      { feature: "Follow-up tracking", details: "Flags contacts going cold after 14 days" },
      { feature: "VIP priority", details: "Important contacts get priority reminders" },
      { feature: "Interaction history", details: "Last contact date, topics, and open items" },
    ],
  },

  "youtube-creator": {
    schedule: [
      { time: "Every 2 hours", action: "News scan: breaking news in your niche from web, HN, and X" },
      { time: "Monday 10:00", action: "Weekly top 5: best video ideas with full outlines" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/youtube-creator`",
      "Run `npx seclaw add youtube-creator --key YOUR_LICENSE_KEY`",
      "Define your niche in `/shared/config/niche.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Scan news (2h) --> Filter by niche --> Generate pitch --> [Approve] --> Save\nWeekly compile --> Rank top 5 --> Full outlines with hooks --> Telegram",
    fileStructure: "/shared/config/niche.md    -- your content niche and audience\n/shared/pitches/           -- approved idea pitches\n/shared/outlines/          -- full video outlines\n/shared/catalog/           -- 90-day content history\n/shared/analytics/         -- performance tracking",
    featuresTable: [
      { feature: "Breaking news scouting", details: "Multi-source scan every 2 hours" },
      { feature: "Differentiated ideas", details: "Only pitches with novel angles" },
      { feature: "Full outlines", details: "Hook, key points, CTA, thumbnail suggestions" },
      { feature: "Duplicate prevention", details: "Checks against 90-day content catalog" },
      { feature: "Human-in-the-loop", details: "Approve ideas before outline generation" },
    ],
  },

  "devops-agent": {
    schedule: [
      { time: "Every 15 min", action: "Health check: all services, auto-restart if down" },
      { time: "07:00", action: "Morning briefing: uptime, incidents, disk/memory trends" },
      { time: "Sunday 03:00", action: "Security audit: packages, ports, SSH, Docker images" },
      { time: "04:00", action: "Backup verification: timestamps, sizes, integrity" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/devops-agent`",
      "Run `npx seclaw add devops-agent --key YOUR_LICENSE_KEY`",
      "Define services in `/shared/config/services.json`",
      "Set thresholds in `/shared/config/thresholds.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Health check (15m) --> curl services --> Check containers --> Self-heal if needed\nSecurity audit (weekly) --> Scan packages + ports + logs --> Report --> [Approve] actions",
    fileStructure: "/shared/config/services.json    -- service definitions with health URLs\n/shared/config/thresholds.md    -- disk, memory, CPU alert thresholds\n/shared/logs/health/            -- health check history\n/shared/logs/incidents/         -- incident and resolution log\n/shared/reports/security/       -- weekly security audit reports",
    featuresTable: [
      { feature: "Health checks", details: "Every 15 minutes, all configured services" },
      { feature: "Auto-restart", details: "Detects down services and restarts them" },
      { feature: "Security audit", details: "Weekly scan of packages, ports, and logs" },
      { feature: "Backup verification", details: "Daily check of backup integrity" },
      { feature: "Approval for actions", details: "Security fixes require Telegram approval" },
      { feature: "24h trend tracking", details: "Disk and memory usage trends" },
    ],
  },

  "customer-service": {
    schedule: [
      { time: "Every 30 min", action: "Monitor Gmail for new customer inquiries" },
      { time: "18:00", action: "Daily summary: inquiries by category, response times" },
      { time: "10:00", action: "Check for unanswered inquiries older than 4 hours" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/customer-service`",
      "Run `npx seclaw add customer-service --key YOUR_LICENSE_KEY`",
      "Connect Gmail via `npx seclaw integrations`",
      "Add your FAQ at `/shared/knowledge/faq.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Monitor inbox (30m) --> Classify intent --> Draft from knowledge base --> [Approve] --> Send\nDaily summary --> Aggregate stats --> Category breakdown --> Response times --> Telegram",
    fileStructure: "/shared/knowledge/faq.md          -- frequently asked questions\n/shared/knowledge/services.md     -- service descriptions\n/shared/templates/responses/      -- response templates\n/shared/logs/inquiries/           -- inquiry log with status\n/shared/config/escalation.md      -- escalation rules",
    featuresTable: [
      { feature: "Intent classification", details: "FAQ, appointment, complaint, review, escalation" },
      { feature: "Knowledge base replies", details: "Drafts from your FAQ and service docs" },
      { feature: "Approval required", details: "Every reply needs Telegram approval" },
      { feature: "Multi-language", details: "Detects language and responds accordingly" },
      { feature: "Escalation rules", details: "Auto-escalates based on configurable rules" },
      { feature: "Response tracking", details: "Flags unanswered inquiries after 4 hours" },
    ],
  },

  "sales-agent": {
    schedule: [
      { time: "Every 4 hours", action: "Monitor X for buying signals and competitor mentions" },
      { time: "On detection", action: "Score leads 1-10, surface 7+ to Telegram" },
      { time: "On approval", action: "Log outreach, set 3-day follow-up reminder" },
      { time: "Day 3", action: "Draft follow-up messages for non-responders" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/sales-agent`",
      "Run `npx seclaw add sales-agent --key YOUR_LICENSE_KEY`",
      "Create your product info at `/shared/config/product-info.md`",
      "Message your bot on Telegram to get started",
    ],
    howItWorks: "Monitor (every 4h) --> Score (1-10) --> Qualify (7+) --> Draft --> Approve (Telegram) --> Log --> Follow-up (Day 3)",
    fileStructure: "/shared/config/product-info.md    -- your product, ICP, value props\n/shared/leads/YYYY-MM-DD.md      -- all detected leads with scores\n/shared/outreach/drafts/          -- pending outreach drafts\n/shared/outreach/sent/            -- sent log with follow-up dates",
    featuresTable: [
      { feature: "Buying signal detection", details: "Complaints, competitor mentions, \"looking for\" posts" },
      { feature: "Lead scoring", details: "1-10 scale based on signal, fit, timing, authority" },
      { feature: "No auto-outreach", details: "Requires Telegram approval before sending" },
      { feature: "Follow-up system", details: "3-day automatic reminders for non-responders" },
      { feature: "CRM webhook", details: "Optional integration with external CRM" },
    ],
  },

  "six-agent-company": {
    schedule: [
      { time: "09:00", action: "Daily standup: all 6 agents report status" },
      { time: "Every 4 hours", action: "Work cycle: prioritize, assign, execute, quality check" },
    ],
    setup: [
      "Purchase at `seclawai.com/templates/six-agent-company`",
      "Run `npx seclaw add six-agent-company --key YOUR_LICENSE_KEY`",
      "Assign missions via Telegram -- the Coordinator handles the rest",
    ],
    howItWorks: "User --> Coordinator --> Assigned Agent --> Observer QC --> Deliver\n                                                    --> Retry (max 3)\n                                                    --> Escalate to human",
    fileStructure: "/shared/missions/              -- task tracking (MISSION-001.md)\n/shared/proposals/             -- plans and proposals before execution\n/shared/events/                -- significant event log\n/shared/memory/episodes/       -- daily event logs\n/shared/memory/knowledge/      -- accumulated domain knowledge\n/shared/memory/procedures/     -- standard operating procedures\n/shared/memory/sentiment/      -- user satisfaction tracking\n/shared/memory/relationships/  -- contact and relationship data",
    featuresTable: [
      { feature: "6 specialized agents", details: "Coordinator, Executor, Observer, Analyst, Content, Growth" },
      { feature: "Quality gate", details: "Observer reviews everything before delivery" },
      { feature: "Ralph Wiggum Loop", details: "3 retries max, then human escalation" },
      { feature: "5-type memory", details: "Episodic, semantic, procedural, emotional, relationship" },
      { feature: "Mission tracking", details: "Structured mission files with status and priority" },
      { feature: "Daily standups", details: "09:00 team status summary via Telegram" },
    ],
  },
};

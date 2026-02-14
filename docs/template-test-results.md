# Template Smoke Test Results

**Date:** 2026-02-14T14:34:26Z
**Agent:** seclaw-agent-1
**LLM:** OpenRouter / google/gemini-3-flash-preview
**Test Duration:** ~7 minutes (15 templates, sequential)

## Results: 15/15 PASS

| # | Template | Price | Time | LLM Calls | Tools Used | Telegram Response |
|---|----------|-------|------|-----------|------------|-------------------|
| 1 | inbox-agent | $19 | 7.2s | 2 | GMAIL_FETCH_EMAILS, read_file | Checked inbox, categorized as URGENT/ACTION/FYI |
| 2 | content-agent | $49 | 4.8s | 1 | (none) | Drafted tweet about AI productivity |
| 3 | customer-service | $79 | 5.8s | 2 | GMAIL_FETCH_EMAILS | Scanned Gmail for customer inquiries |
| 4 | devops-agent | $79 | 5.5s | 2 | execute_command, read_file | Ran service health checks |
| 5 | earnings-tracker | $29 | 11.9s | 4 | GOOGLECALENDAR_GET_CURRENT_DATE_TIME, execute_command, list_directory | Checked upcoming earnings reports |
| 6 | family-calendar | $39 | 8.5s | 3 | GOOGLECALENDAR_FIND_EVENT, list_directory | Showed family schedule for today |
| 7 | health-tracker | $29 | 6.7s | 3 | update_memory, write_file | Logged breakfast + energy level to daily log |
| 8 | knowledge-base | $39 | 4.4s | 2 | save_note | Saved note via workspace tool |
| 9 | personal-crm | $49 | 15.1s | 5 | GMAIL_FETCH_EMAILS, GOOGLECALENDAR_FIND_EVENT, GOOGLECALENDAR_GET_CURRENT_DATE_TIME, list_directory | Discovered new contacts from email + calendar |
| 10 | reddit-hn-digest | $19 | 16.6s | 5 | execute_command, list_directory, list_files, write_file | Fetched HN trends, saved digest |
| 11 | research-agent | $39 | 24.1s | 6 | execute_command, list_directory, read_file, save_report | Generated AI trends research report |
| 12 | sales-agent | $79 | 24.8s | 10 | execute_command, list_directory, write_file | Found leads, scored, drafted outreach messages |
| 13 | six-agent-company | $149 | 6.5s | 2 | update_memory, write_file | Created MISSION-001, assigned to executor agent |
| 14 | youtube-creator | $69 | 14.6s | 3 | execute_command, write_file | Scouted AI topics, pitched 3 video ideas |
| 15 | youtube-digest | $19 | 11.8s | 5 | execute_command, list_directory | Checked subscribed channels for new videos |

## Response Quality Analysis

### Tier 1: Excellent (used correct domain-specific tools)
- **inbox-agent** -- Called `GMAIL_FETCH_EMAILS` with `is:unread` query, categorized by URGENT/ACTION/FYI
- **customer-service** -- Called `GMAIL_FETCH_EMAILS` for customer inquiries
- **family-calendar** -- Called `GOOGLECALENDAR_FIND_EVENT` for today's events
- **personal-crm** -- Cross-referenced Gmail + Calendar to discover contacts (most sophisticated tool usage)
- **health-tracker** -- Logged meal + mood to `update_memory` and created daily health log file

### Tier 2: Good (used workspace tools correctly)
- **knowledge-base** -- Used `save_note` to persist information
- **six-agent-company** -- Created mission file, assigned to sub-agent, used `update_memory`
- **content-agent** -- Generated tweet draft (no tools needed, pure LLM)
- **devops-agent** -- Used `execute_command` + `read_file` for health checks

### Tier 3: Functional but limited (no API integrations available)
- **sales-agent** -- Simulated X/Twitter search via `execute_command` (no Twitter API connected), still created leads file + outreach drafts. **10 LLM calls** = most complex workflow
- **research-agent** -- Used shell commands for research (no Tavily/web search), saved report. 24s response
- **reddit-hn-digest** -- No Reddit/HN API connected, used shell fallback
- **youtube-creator** -- No YouTube API, used shell for trend scouting
- **youtube-digest** -- No YouTube API, checked channels via fallback
- **earnings-tracker** -- Used calendar + shell to check earnings data

## Key Findings

### What Works
1. **System prompts load correctly** -- Each template's personality and behavior rules are respected
2. **Tool selection is appropriate** -- LLM picks the right tools for each template's domain
3. **Composio integrations work** -- Gmail and Calendar tools fire correctly for templates that need them
4. **Workspace tools work** -- update_memory, write_file, save_note, save_report all function
5. **Turkish language detection** -- Agent detects user language and responds in Turkish (user's Telegram language)
6. **Response formatting** -- Bullet points, headers, structured output for Telegram

### What Needs Improvement
1. **Capability loading warning** -- All tests show `WARN: capability=none` because `composeCapabilityPrompt()` falls back but doesn't log the active capability name correctly. The system prompt IS loaded (verified by response behavior), but health endpoint shows `capabilities:[]`
2. **Missing API integrations** -- Templates that need Twitter, Reddit, HN, YouTube, Tavily fall back to `execute_command` (shell). Agent works around it gracefully, but real API data would be better
3. **Sales agent is expensive** -- 10 LLM calls, 24.8s. Each call costs tokens. Could be optimized
4. **No attribution footer** -- Responses don't include which template/capability answered (PRD Phase 2)

### Performance Distribution

| Speed Tier | Templates | Avg Time |
|------------|-----------|----------|
| Fast (<7s) | content-agent, knowledge-base, devops-agent, customer-service, health-tracker, six-agent-company | 5.5s |
| Medium (7-15s) | inbox-agent, family-calendar, earnings-tracker, youtube-creator, youtube-digest, personal-crm | 11.7s |
| Slow (>15s) | reddit-hn-digest, research-agent, sales-agent | 21.8s |

## Methodology

Each template was tested by:
1. Writing `installed.json` with template as active capability
2. Restarting the agent container (`docker restart seclaw-agent-1`)
3. Waiting for health check to pass
4. Sending a simulated Telegram webhook to `localhost:3000/webhook`
5. Waiting up to 60s for LLM completion in Docker logs
6. Parsing: response time, tools called, error presence
7. Capturing actual Telegram reply text

**Test harness:** `scripts/test-templates.sh`
**Individual logs:** `/tmp/seclaw-template-tests/<template-id>.log`

## Recommendations

1. **Connect missing integrations** -- Add Tavily (web search) for research/sales/earnings templates. This would dramatically improve Tier 3 templates
2. **Fix capability tracking** -- `installed.json` v2 schema with `active` field (from PRD)
3. **Optimize sales-agent** -- Reduce tool call loop from 10 to 5 by batching operations
4. **Add attribution** -- Show `_Inbox Agent | gmail_` footer in Telegram (PRD Phase 2)
5. **Run tests on CI** -- Add this test script to GitHub Actions for regression testing

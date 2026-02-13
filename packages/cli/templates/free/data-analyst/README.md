# Data Analyst

Privacy-first local data analysis. All data stays on your machine.

## What it does

- **Drop files** -- Put CSV/JSON/TSV files in `/shared/data/inbox/`
- **Auto-profile** -- Agent detects new files, profiles them (row count, columns, types, stats)
- **Ask questions** -- "What's the monthly average revenue?" -- agent writes Python, executes it, returns the answer
- **Weekly reports** -- Monday 9AM summary of all data processed that week
- **100% local** -- No data leaves your machine. Python runs inside the sandbox.

## Setup

1. Run `npx seclaw create` and select this template
2. Start with `docker compose up -d`
3. Drop a CSV file into `shared/data/inbox/`
4. Ask your agent via Telegram: "Analyze sales.csv"

## How it works

```
User drops file --> Agent profiles it --> Ready for questions
User asks question --> Agent writes Python --> Executes locally --> Returns answer
```

The agent uses Desktop Commander MCP's `execute_command` to run Python scripts with pandas. This enables real computation -- not LLM approximation.

## Example questions

- "sales.csv'deki aylik ortalama gelir ne?"
- "Find duplicates in contacts.json"
- "Top 10 products by revenue"
- "Correlation between marketing_spend and sales"
- "Compare this month's CSV to last month's"

## File structure

```
/shared/data/inbox/          -- drop data files here
/shared/data/profiles/       -- auto-generated data profiles
/shared/data/scripts/        -- Python scripts (audit trail)
/shared/data/results/        -- analysis outputs
/shared/data/reports/        -- weekly reports
/shared/data/processed.json  -- processed files manifest
```

## Key features

| Feature | Details |
|---------|---------|
| Python execution | Real pandas operations, not LLM guessing |
| Auto-profiling | New files profiled automatically |
| Privacy-first | All data stays local, nothing goes to cloud |
| Audit trail | Every script saved for reproducibility |
| Weekly reports | Automated Monday morning summaries |

## Supported formats

- CSV (`.csv`)
- JSON (`.json`)
- TSV (`.tsv`)

## Free

This template is free and included with seclaw.

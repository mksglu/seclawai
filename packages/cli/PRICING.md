# seclaw — LLM Cost Guide

Your only real cost is the LLM API. Everything else is free (Docker, Inngest, Cloudflare Tunnel, Telegram).

## Quick Estimate

| Provider | Model | Monthly Cost | Best For |
|----------|-------|-------------|----------|
| **OpenRouter (auto)** | Smart routing | **~$5-15/mo** | Most users — auto picks cheap or smart model |
| Anthropic | Claude Sonnet 4.5 | ~$15-30/mo | Consistent quality, complex reasoning |
| OpenAI | GPT-4o | ~$10-25/mo | General purpose |
| Google | Gemini 2.5 Pro | ~$7-20/mo | Budget-friendly with good quality |

Estimates based on ~50 agent interactions/day with 2-3 tool calls each.

---

## How Smart Routing Saves Money

When you use **OpenRouter with `openrouter/auto`**, it automatically picks the best model for each request:

```
"What time is it?"     → Haiku 4.5    ($1/M input)    — simple, fast
"Summarize my tasks"   → Haiku 4.5    ($1/M input)    — retrieval, fast
"Write a sales pitch"  → Sonnet 4.5   ($3/M input)    — creative, smart
"Debug this code"      → Sonnet 4.5   ($3/M input)    — reasoning, smart
```

Result: ~70-80% of requests go to cheap models, ~20-30% to expensive ones.
That's **~$5-15/mo** vs **~$15-30/mo** for fixed Sonnet.

---

## Per-Request Cost Breakdown

A typical agent interaction (1 user message + AI response + 2-3 tool calls):

| Model | Input (1M tokens) | Output (1M tokens) | Per Request | Per Day (50 req) |
|-------|-------------------|---------------------|-------------|------------------|
| Claude Haiku 4.5 | $1.00 | $5.00 | ~$0.01 | ~$0.50 |
| Claude Sonnet 4.5 | $3.00 | $15.00 | ~$0.04 | ~$2.00 |
| GPT-4o | $2.50 | $10.00 | ~$0.03 | ~$1.50 |
| Gemini 2.5 Pro | $1.25 | $10.00 | ~$0.02 | ~$1.00 |
| Gemini 2.5 Flash | $0.30 | $2.50 | ~$0.005 | ~$0.25 |

Token estimate per request: ~1,500 input + ~1,000 output tokens (including tool definitions and responses).

---

## Monthly Projections

### Light Usage (~20 interactions/day)

| Provider | Model | Monthly |
|----------|-------|---------|
| OpenRouter (auto) | Smart routing | **~$3-8** |
| Anthropic | Sonnet 4.5 | ~$12-18 |
| OpenAI | GPT-4o | ~$8-15 |
| Google | Gemini 2.5 Pro | ~$5-10 |

### Medium Usage (~50 interactions/day)

| Provider | Model | Monthly |
|----------|-------|---------|
| OpenRouter (auto) | Smart routing | **~$5-15** |
| Anthropic | Sonnet 4.5 | ~$20-35 |
| OpenAI | GPT-4o | ~$15-25 |
| Google | Gemini 2.5 Pro | ~$10-20 |

### Heavy Usage (~150 interactions/day + scheduled tasks)

| Provider | Model | Monthly |
|----------|-------|---------|
| OpenRouter (auto) | Smart routing | **~$15-40** |
| Anthropic | Sonnet 4.5 | ~$60-100 |
| OpenAI | GPT-4o | ~$45-75 |
| Google | Gemini 2.5 Pro | ~$30-60 |

---

## OpenRouter Specifics

- **No markup** on model pricing (pass-through)
- **5% fee** when using your own API keys from other providers
- Free tier: 1,000,000 requests/month (BYOK)
- You only pay for successful requests (failed fallbacks are free)
- Single API key for 100+ models across all providers

Get your key: https://openrouter.ai/keys

---

## Cost Optimization Tips

1. **Use OpenRouter auto** — let it pick the cheapest model that works
2. **Keep system prompts short** — saves input tokens on every request
3. **Use file-based memory** — cheaper than sending full history every time
4. **Batch scheduled tasks** — fewer but larger interactions vs many small ones
5. **Monitor usage** — check OpenRouter dashboard for spending patterns

---

*Prices as of February 2026. Check provider websites for latest pricing.*

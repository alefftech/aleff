---
summary: "Tavily AI Search setup for web_search"
read_when:
  - You want to use Tavily AI Search for web_search
  - You need a TAVILY_API_KEY or plan details
---

# Tavily AI Search

Moltbot can use Tavily as a provider for `web_search`. Tavily offers AI-powered search with high-quality results and automatic answer generation.

## Get an API key

1) Create a Tavily account at https://tavily.com
2) In the dashboard, generate an API key
3) Store the key in config (recommended) or set `TAVILY_API_KEY` in the Gateway environment

## Config example

```json5
{
  tools: {
    web: {
      search: {
        provider: "tavily",
        apiKey: "tvly-...",
        maxResults: 5,
        timeoutSeconds: 30
      }
    }
  }
}
```

## Auto-detection

If you don't specify a `provider`, Moltbot will automatically detect which search API to use based on available keys:

**Priority order:**
1. Tavily (if `TAVILY_API_KEY` is set)
2. Brave (if `BRAVE_API_KEY` is set)
3. Perplexity (if `PERPLEXITY_API_KEY` or `OPENROUTER_API_KEY` is set)

## Features

- **AI-powered results** — Context-aware content extraction
- **Auto-generated answers** — Synthesized responses to queries
- **High relevance** — Semantic search with quality scoring
- **Fast performance** — Optimized for real-time queries

## Notes

- Tavily provides both free tier and paid plans
- Check the Tavily dashboard for current rate limits
- The API returns structured results with quality scores

See [Web tools](/tools/web) for the full web_search configuration.

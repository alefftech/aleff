# Multi-LLM Guide

This guide explains how to configure multiple LLM providers in Aleff/Moltbot for cost optimization, redundancy, and flexibility.

## Overview

Aleff supports multiple LLM providers simultaneously:

| Provider | Status | Cost Tier | Best For |
|----------|--------|-----------|----------|
| Anthropic (Claude) | Native | $$$ | Quality |
| OpenRouter | Native | $$ | Variety |
| DeepSeek | Native | $ | Cost |
| Ollama | Native | Free | Privacy |
| Gemini | Native | $$ | Speed |
| OpenAI | Native | $$ | GPT models |

## Quick Start

### 1. Set up API keys

```bash
# Primary (Claude)
export ANTHROPIC_API_KEY="sk-ant-..."

# Fallback options
export DEEPSEEK_API_KEY="sk-..."
export OPENROUTER_API_KEY="sk-or-..."
export OLLAMA_API_KEY="ollama"  # Any value enables local Ollama
```

### 2. Use switch-model.sh

```bash
# Switch to cost-saving mode (DeepSeek)
./scripts/switch-model.sh cheap

# Switch back to best quality (Claude)
./scripts/switch-model.sh best

# Enable automatic fallback
./scripts/switch-model.sh fallback

# Check current status
./scripts/switch-model.sh status
```

## Model Presets

| Preset | Model | Cost (per 1M) | Use Case |
|--------|-------|---------------|----------|
| `best` | claude-opus-4-5 | $15/$75 | Highest quality |
| `fast` | claude-haiku-3-5 | $0.80/$4 | Quick responses |
| `cheap` | deepseek-chat | $0.14/$0.28 | Cost savings |
| `think` | deepseek-reasoner | $0.55/$2.19 | Complex reasoning |
| `local` | ollama/llama3.3 | FREE | Offline/privacy |

## Configuration

### moltbot.json Structure

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallbacks": [
          "openrouter/anthropic/claude-sonnet-4-5",
          "deepseek/deepseek-chat",
          "ollama/llama3.3"
        ]
      },
      "models": {
        "anthropic/claude-opus-4-5": { "alias": "best" },
        "anthropic/claude-haiku-3-5": { "alias": "fast" },
        "deepseek/deepseek-chat": { "alias": "cheap" },
        "deepseek/deepseek-reasoner": { "alias": "think" },
        "ollama/llama3.3": { "alias": "local" }
      }
    }
  }
}
```

### Environment Variables

| Provider | Env Var | Required |
|----------|---------|----------|
| Anthropic | `ANTHROPIC_API_KEY` | For Claude models |
| DeepSeek | `DEEPSEEK_API_KEY` | For DeepSeek models |
| OpenRouter | `OPENROUTER_API_KEY` | For OpenRouter |
| Ollama | `OLLAMA_API_KEY` | Any value enables |
| OpenAI | `OPENAI_API_KEY` | For GPT models |
| Gemini | `GEMINI_API_KEY` | For Gemini models |
| Groq | `GROQ_API_KEY` | For Groq models |

## Fallback System

The fallback system automatically switches providers when errors occur:

```
Primary: Claude Opus 4.5
    ↓ (error/rate-limit/timeout)
Fallback 1: OpenRouter Claude Sonnet
    ↓ (DOWN)
Fallback 2: DeepSeek Chat
    ↓ (DOWN)
Fallback 3: Ollama Local
```

### Fallback Triggers

- Rate limiting (429)
- API errors (5xx)
- Timeout (configurable)
- Authentication failure
- Network errors

### Logging

When fallback occurs, you'll see logs like:

```
[gateway] Fallback triggered: anthropic/claude-opus-4-5 → deepseek/deepseek-chat (rate_limit)
```

## Cost Optimization Strategies

### Strategy 1: Always Cheap

Best for high-volume, cost-sensitive workloads.

```bash
./scripts/switch-model.sh cheap
```

Savings: **99%** compared to Claude Opus

### Strategy 2: Quality with Fallback

Best for production with cost protection.

```json
{
  "model": {
    "primary": "anthropic/claude-opus-4-5",
    "fallbacks": ["deepseek/deepseek-chat"]
  }
}
```

You get Claude quality, but if rate-limited, DeepSeek takes over.

### Strategy 3: Tiered Quality

Best for mixed workloads.

```json
{
  "model": {
    "primary": "anthropic/claude-haiku-3-5",
    "fallbacks": ["deepseek/deepseek-chat", "ollama/llama3.3"]
  }
}
```

Fast and affordable, with local backup.

### Strategy 4: Local First (Privacy)

Best for sensitive data.

```bash
./scripts/switch-model.sh local
```

All processing stays on your machine.

## Provider-Specific Notes

### Anthropic (Claude)

- Highest quality
- Native tool use
- Best for complex tasks
- 200K context window

### DeepSeek

- 99% cost savings
- Good for general tasks
- 64K context window
- No vision support

### OpenRouter

- Access to many models
- Good fallback option
- May have availability issues
- Variable pricing

### Ollama

- Free (local compute)
- No API costs
- Works offline
- Quality depends on model

## Monitoring

### Check Current Model

```bash
./scripts/switch-model.sh status
```

### View Fallback Events

```bash
docker logs aleffai 2>&1 | grep -i fallback
```

### Cost Tracking

Check your provider dashboards:
- Anthropic: console.anthropic.com
- DeepSeek: platform.deepseek.com
- OpenRouter: openrouter.ai/dashboard

## Troubleshooting

### Model not found

```bash
# List available models
docker exec aleffai moltbot models list

# Check provider is configured
docker exec aleffai printenv | grep -E "(ANTHROPIC|DEEPSEEK|OPENROUTER)"
```

### Fallback not working

1. Ensure fallback models have API keys configured
2. Check `model.fallbacks` array in moltbot.json
3. View logs for fallback events

### Stuck on slow model

```bash
# Force switch to faster model
./scripts/switch-model.sh fast
docker restart aleffai
```

## Best Practices

1. **Always configure fallbacks** - Prevents downtime
2. **Use presets** - Easier than manual config
3. **Monitor costs** - Check provider dashboards weekly
4. **Test fallbacks** - Verify they work before relying on them
5. **Keep Ollama ready** - Ultimate fallback for offline

## Migration from Single-Provider

If you were using only Claude:

```bash
# 1. Add DeepSeek key
export DEEPSEEK_API_KEY="sk-..."

# 2. Enable fallback
./scripts/switch-model.sh fallback

# 3. Restart
docker restart aleffai
```

Your system now has 99% cheaper fallback protection.

---

**Last Updated:** 2026-01-29

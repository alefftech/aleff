# DeepSeek Provider

DeepSeek is a cost-effective LLM provider with OpenAI-compatible API, offering up to **99% cost savings** compared to Claude.

## Quick Setup

```bash
# 1. Get API key from https://platform.deepseek.com/
export DEEPSEEK_API_KEY="sk-..."

# 2. Add to run-aleffai.sh or .env
echo 'export DEEPSEEK_API_KEY="sk-..."' >> ~/.bashrc

# 3. Restart container
docker restart aleffai
```

## Available Models

| Model | ID | Use Case | Cost (per 1M tokens) |
|-------|-----|----------|---------------------|
| DeepSeek Chat | `deepseek/deepseek-chat` | General conversation | $0.14 in / $0.28 out |
| DeepSeek Coder | `deepseek/deepseek-coder` | Code generation | $0.14 in / $0.28 out |
| DeepSeek Reasoner | `deepseek/deepseek-reasoner` | Complex reasoning (R1) | $0.55 in / $2.19 out |

## Cost Comparison

| Provider | Input (1M) | Output (1M) | Savings vs Claude Opus |
|----------|------------|-------------|------------------------|
| Claude Opus 4.5 | $15.00 | $75.00 | baseline |
| Claude Sonnet 4 | $3.00 | $15.00 | 80% |
| DeepSeek Chat | $0.14 | $0.28 | **99%** |
| DeepSeek Reasoner | $0.55 | $2.19 | 96% |

## Switching to DeepSeek

### Quick Switch (Recommended)

```bash
./scripts/switch-model.sh cheap
docker restart aleffai
```

### Manual Configuration

Edit `data/moltbot.json`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-chat"
      }
    }
  }
}
```

## Using as Fallback

DeepSeek works great as a fallback when Claude is unavailable:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallbacks": [
          "deepseek/deepseek-chat"
        ]
      }
    }
  }
}
```

## Cache Pricing

DeepSeek offers aggressive cache discounts:

| Operation | DeepSeek Chat | DeepSeek Reasoner |
|-----------|---------------|-------------------|
| Cache Hit (read) | $0.014/1M | $0.14/1M |
| Cache Miss (input) | $0.14/1M | $0.55/1M |

This means repeated context is **10x cheaper**.

## Limitations

- No vision/image support (text only)
- 64K context window (vs 200K for Claude)
- Slightly lower quality on complex tasks
- No streaming thinking tokens

## When to Use

**Use DeepSeek for:**
- High-volume, cost-sensitive workloads
- Simple conversations and Q&A
- Code generation tasks
- Fallback when Claude is rate-limited

**Use Claude for:**
- Complex reasoning tasks
- Multi-modal (images)
- Highest quality requirements
- Long context (>64K tokens)

## API Details

- **Base URL:** `https://api.deepseek.com/v1`
- **API Format:** OpenAI-compatible
- **Auth:** Bearer token (`DEEPSEEK_API_KEY`)

## Troubleshooting

### Model not appearing

```bash
# Check if env var is set
docker exec aleffai printenv | grep DEEPSEEK

# Check models list
docker exec aleffai moltbot models list | grep deepseek
```

### Authentication error

Verify your API key at https://platform.deepseek.com/usage

### Rate limiting

DeepSeek has generous rate limits, but if hit:
1. Check your tier at platform.deepseek.com
2. Enable fallback to spread load

---

**Last Updated:** 2026-01-29

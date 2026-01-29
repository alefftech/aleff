---
name: apify
description: Web scraping via Apify actors. Use for LinkedIn posts, Google Maps businesses, Instagram profiles, YouTube channels, Twitter/X data. Enriches lead/client data.
homepage: https://apify.com
metadata:
  moltbot:
    emoji: 🕷️
    requires:
      env: [APIFY_API_TOKEN]
---

# Apify Web Scraping

Scrape data from social media, maps, and web platforms using Apify actors. Perfect for lead generation, competitor analysis, and market research.

## When to Use

Use this skill when asked to:
- Extract LinkedIn posts, profiles, or company data
- Get Google Maps business listings
- Scrape Instagram profiles, posts, or hashtags
- Download YouTube channel data or video metadata
- Extract Twitter/X tweets, profiles, or trends
- Gather business data for CRM enrichment
- Research competitors or market trends

## Quick Start

### Setup
```bash
# Set API token (get from https://console.apify.com/account/integrations)
export APIFY_API_TOKEN="your_token_here"
```

### Basic Usage
```bash
# Run an actor via Apify CLI
apify call apify/instagram-profile-scraper \
  --input '{"usernames": ["mentoringbase"]}' \
  --output dataset.json
```

## Common Actors

### LinkedIn
**LinkedIn Post Scraper** (`apify/linkedin-post-scraper`)
```json
{
  "urls": ["https://linkedin.com/in/username"],
  "maxPosts": 50
}
```

**LinkedIn Company Scraper** (`apify/linkedin-company-scraper`)
```json
{
  "companyUrls": ["https://linkedin.com/company/iavancada"],
  "includeEmployees": true
}
```

### Google Maps
**Google Maps Scraper** (`compass/google-maps-scraper`)
```json
{
  "searchStrings": ["Advogados em São Paulo"],
  "maxReviews": 10,
  "language": "pt"
}
```

Output: Business name, address, phone, website, rating, reviews

### Instagram
**Instagram Profile Scraper** (`apify/instagram-profile-scraper`)
```json
{
  "usernames": ["mentoringbase"],
  "resultsLimit": 100
}
```

**Instagram Hashtag Scraper** (`apify/instagram-hashtag-scraper`)
```json
{
  "hashtags": ["#mentoringbr", "#iabrasil"],
  "resultsLimit": 50
}
```

### YouTube
**YouTube Channel Scraper** (`bernardo/youtube-scraper`)
```json
{
  "startUrls": ["https://youtube.com/@channelname"],
  "maxResults": 100
}
```

Output: Videos, titles, views, likes, comments, descriptions

### Twitter/X
**Twitter Scraper** (`apify/twitter-scraper`)
```json
{
  "searchTerms": ["#IA #Brasil"],
  "maxTweets": 100,
  "language": "pt"
}
```

## Integration with Aleff

### Lead Enrichment (IAVANCADA)
```bash
# Enrich client data from LinkedIn
echo '["empresa-xyz", "empresa-abc"]' | \
  jq -r '.[]' | while read company; do
    apify call apify/linkedin-company-scraper \
      --input "{\"companyUrls\": [\"https://linkedin.com/company/$company\"]}" \
      --output "leads/$company.json"
  done
```

### Market Research (MENTORINGBASE)
```bash
# Find mentoring competitors
apify call compass/google-maps-scraper \
  --input '{
    "searchStrings": ["Plataforma de mentoria Brasil"],
    "maxReviews": 5
  }' \
  --output competitors.json
```

### Content Strategy (CMO)
```bash
# Analyze Instagram engagement
apify call apify/instagram-profile-scraper \
  --input '{
    "usernames": ["competitor1", "competitor2"],
    "resultsLimit": 50
  }' \
  --output instagram-analysis.json

# Extract top performing posts
cat instagram-analysis.json | jq '[.[] | select(.likesCount > 1000)]'
```

### Legal Intelligence (AGILCONTRATOS)
```bash
# Find law firms in region
apify call compass/google-maps-scraper \
  --input '{
    "searchStrings": ["Escritório de advocacia São Paulo"],
    "maxReviews": 10,
    "language": "pt"
  }' \
  --output legal-competitors.json
```

## Using Apify API Directly

### Node.js
```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Run actor
const run = await client.actor('apify/instagram-profile-scraper').call({
  usernames: ['mentoringbase'],
  resultsLimit: 50,
});

// Get results
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

### Python
```python
from apify_client import ApifyClient

client = ApifyClient(os.getenv('APIFY_API_TOKEN'))

# Run actor
run = client.actor('apify/instagram-profile-scraper').call(
    run_input={'usernames': ['mentoringbase'], 'resultsLimit': 50}
)

# Get results
items = client.dataset(run['defaultDatasetId']).list_items().items
print(items)
```

### Bash (curl)
```bash
# Start actor run
RUN_ID=$(curl -X POST \
  "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"usernames": ["mentoringbase"]}' | jq -r '.data.id')

# Wait and get results
sleep 60
curl "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs/$RUN_ID/dataset/items?token=$APIFY_API_TOKEN"
```

## Best Practices

### Rate Limits
- Free tier: 10K actor compute units/month
- Paid: Scales with usage
- Use `maxResults` to limit data extraction

### Cost Optimization
```json
{
  "maxItems": 100,           // Limit results
  "proxyConfiguration": {
    "useApifyProxy": false   // Disable if not needed
  }
}
```

### Data Storage
```bash
# Export to CSV for analysis
apify call actor-id --output data.json
cat data.json | jq -r '.[] | [.name, .email, .phone] | @csv' > leads.csv
```

### Scheduling (Production)
```bash
# Schedule daily scrapes
curl -X POST "https://api.apify.com/v2/actor-tasks/TASK_ID/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json"
```

## Popular Actors

| Platform | Actor | Use Case |
|----------|-------|----------|
| LinkedIn | `apify/linkedin-post-scraper` | Posts, engagement |
| LinkedIn | `apify/linkedin-company-scraper` | Company data, employees |
| Google Maps | `compass/google-maps-scraper` | Business listings |
| Instagram | `apify/instagram-profile-scraper` | Profiles, posts |
| Instagram | `apify/instagram-hashtag-scraper` | Hashtag research |
| YouTube | `bernardo/youtube-scraper` | Videos, channels |
| Twitter/X | `apify/twitter-scraper` | Tweets, trends |
| Facebook | `apify/facebook-pages-scraper` | Pages, posts |
| Amazon | `apify/amazon-product-scraper` | Products, reviews |
| Google | `apify/google-search-scraper` | Search results |

## Use Cases by Team

### IAVANCADA (Consultoria AI)
- Scrape client LinkedIn activity
- Monitor competitor content
- Generate prospect lists from Google Maps

### AGILCONTRATOS (Jurídico)
- Find law firms for partnerships
- Analyze legal market trends
- Extract public legal documents

### MENTORINGBASE (Mentoria)
- Research mentoring platforms
- Analyze mentor profiles
- Track education trends on social media

### CFO
- Competitor pricing research
- Market size estimation
- Lead generation ROI tracking

## Error Handling

```bash
# Check run status
apify info runs/RUN_ID

# Retry failed run
apify call actor-id --retry-on-failure 3
```

## Limitations

- Respects robots.txt and platform ToS
- Some platforms require proxies (Instagram, LinkedIn)
- Data freshness depends on actor implementation
- Rate limits apply per platform

## Getting Started

1. Sign up: https://console.apify.com/sign-up
2. Get API token: https://console.apify.com/account/integrations
3. Set token: `export APIFY_API_TOKEN="your_token"`
4. Browse actors: https://apify.com/store
5. Test an actor: `apify call actor-id --input '{}'`

## Resources

- **Apify Store**: https://apify.com/store
- **API Docs**: https://docs.apify.com/api/v2
- **SDK Docs**: https://docs.apify.com/sdk
- **Pricing**: https://apify.com/pricing

## When NOT to Use

- Real-time data (use APIs instead)
- Authenticated private accounts
- Large-scale scraping (check Apify pricing)
- Personal/sensitive data (LGPD/GDPR compliance required)

## Safety Rails

⚠️ **Always verify**:
- Data usage complies with LGPD/GDPR
- Platform ToS allows scraping
- Client consents to data collection
- Data is anonymized when shared

Use Apify responsibly for legitimate business intelligence and lead generation.

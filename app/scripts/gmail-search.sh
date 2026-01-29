#!/bin/bash
# Search Gmail for messages
# Usage: gmail-search.sh "query" [maxResults]

set -e

QUERY="${1:-is:unread}"
MAX_RESULTS="${2:-10}"

SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/google-token.sh")

# Search for messages
MESSAGES=$(curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=$(echo "$QUERY" | jq -sRr @uri)&maxResults=$MAX_RESULTS" \
  -H "Authorization: Bearer $TOKEN")

# Check for errors
if echo "$MESSAGES" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: $(echo "$MESSAGES" | jq -r '.error.message')" >&2
  exit 1
fi

# Get message IDs
IDS=$(echo "$MESSAGES" | jq -r '.messages[]?.id // empty')

if [ -z "$IDS" ]; then
  echo '{"emails": [], "message": "No emails found"}'
  exit 0
fi

# Fetch details for each message
EMAILS="[]"
for ID in $IDS; do
  DETAIL=$(curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages/$ID?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date" \
    -H "Authorization: Bearer $TOKEN")

  FROM=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="From") | .value // ""')
  SUBJECT=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="Subject") | .value // ""')
  DATE=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="Date") | .value // ""')
  SNIPPET=$(echo "$DETAIL" | jq -r '.snippet // ""')

  EMAIL=$(jq -n --arg id "$ID" --arg from "$FROM" --arg subject "$SUBJECT" --arg date "$DATE" --arg snippet "$SNIPPET" \
    '{id: $id, from: $from, subject: $subject, date: $date, snippet: $snippet}')

  EMAILS=$(echo "$EMAILS" | jq --argjson email "$EMAIL" '. + [$email]')
done

echo "$EMAILS" | jq '{emails: ., count: length}'

#!/bin/bash
# Read full content of a Gmail message
# Usage: gmail-read.sh <message_id>

set -e

MESSAGE_ID="${1}"

if [ -z "$MESSAGE_ID" ]; then
  echo "Usage: gmail-read.sh <message_id>" >&2
  exit 1
fi

SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/google-token.sh")

# Get full message
DETAIL=$(curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages/$MESSAGE_ID?format=full" \
  -H "Authorization: Bearer $TOKEN")

# Check for errors
if echo "$DETAIL" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: $(echo "$DETAIL" | jq -r '.error.message')" >&2
  exit 1
fi

FROM=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="From") | .value // ""')
TO=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="To") | .value // ""')
SUBJECT=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="Subject") | .value // ""')
DATE=$(echo "$DETAIL" | jq -r '.payload.headers[] | select(.name=="Date") | .value // ""')

# Extract body (try text/plain first)
BODY=$(echo "$DETAIL" | jq -r '
  def decode_base64: gsub("-"; "+") | gsub("_"; "/") | @base64d;
  .payload.parts[]? | select(.mimeType=="text/plain") | .body.data // empty
' 2>/dev/null | head -1)

if [ -z "$BODY" ]; then
  # Try direct body
  BODY=$(echo "$DETAIL" | jq -r '.payload.body.data // empty')
fi

if [ -n "$BODY" ]; then
  # Decode base64
  BODY_DECODED=$(echo "$BODY" | tr '_-' '/+' | base64 -d 2>/dev/null || echo "[Could not decode body]")
else
  BODY_DECODED="[No text body found]"
fi

jq -n --arg id "$MESSAGE_ID" --arg from "$FROM" --arg to "$TO" --arg subject "$SUBJECT" --arg date "$DATE" --arg body "$BODY_DECODED" \
  '{id: $id, from: $from, to: $to, subject: $subject, date: $date, body: $body}'

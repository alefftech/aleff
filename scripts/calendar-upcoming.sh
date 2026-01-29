#!/bin/bash
# Get upcoming calendar events
# Usage: calendar-upcoming.sh [days]

set -e

DAYS="${1:-7}"

SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/google-token.sh")

# Calculate date range
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
END_DATE=$(date -u -d "+$DAYS days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+${DAYS}d +%Y-%m-%dT%H:%M:%SZ)

# Get events
EVENTS=$(curl -s "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=$NOW&timeMax=$END_DATE&singleEvents=true&orderBy=startTime&maxResults=50" \
  -H "Authorization: Bearer $TOKEN")

# Check for errors
if echo "$EVENTS" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: $(echo "$EVENTS" | jq -r '.error.message')" >&2
  exit 1
fi

echo "$EVENTS" | jq --arg from "$(date +%Y-%m-%d)" --arg days "$DAYS" '{
  from: $from,
  days: ($days | tonumber),
  events: [.items[]? | {
    id: .id,
    title: (.summary // "(No title)"),
    start: (.start.dateTime // .start.date),
    end: (.end.dateTime // .end.date),
    location: .location
  }],
  count: (.items | length)
}'

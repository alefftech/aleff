#!/bin/bash
# Get today's calendar events
# Usage: calendar-today.sh

set -e

SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/google-token.sh")

# Calculate today's start and end
TODAY=$(date +%Y-%m-%d)
START="${TODAY}T00:00:00Z"
END="${TODAY}T23:59:59Z"

# Get events
EVENTS=$(curl -s "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=$START&timeMax=$END&singleEvents=true&orderBy=startTime" \
  -H "Authorization: Bearer $TOKEN")

# Check for errors
if echo "$EVENTS" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: $(echo "$EVENTS" | jq -r '.error.message')" >&2
  exit 1
fi

echo "$EVENTS" | jq --arg date "$TODAY" '{
  date: $date,
  events: [.items[]? | {
    id: .id,
    title: (.summary // "(No title)"),
    start: (.start.dateTime // .start.date),
    end: (.end.dateTime // .end.date),
    location: .location
  }],
  count: (.items | length)
}'

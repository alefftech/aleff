#!/bin/bash
# Create a calendar event with Google Meet link
# Usage: calendar-create.sh "Title" "2026-01-30T14:00:00" "2026-01-30T15:00:00" ["attendee@email.com,other@email.com"] ["Description"]
#
# Examples:
#   calendar-create.sh "Reunião" "2026-01-30T14:00:00" "2026-01-30T15:00:00"
#   calendar-create.sh "1:1 com João" "2026-01-30T10:00:00" "2026-01-30T10:30:00" "joao@empresa.com"
#   calendar-create.sh "Planning" "2026-01-30T09:00:00" "2026-01-30T10:00:00" "time@empresa.com,gestor@empresa.com" "Reunião de planejamento semanal"

set -e

TITLE="${1}"
START="${2}"
END="${3}"
ATTENDEES="${4:-}"
DESCRIPTION="${5:-}"

if [ -z "$TITLE" ] || [ -z "$START" ] || [ -z "$END" ]; then
  echo "Usage: calendar-create.sh \"Title\" \"YYYY-MM-DDTHH:MM:SS\" \"YYYY-MM-DDTHH:MM:SS\" [attendees] [description]" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  calendar-create.sh \"Reunião\" \"2026-01-30T14:00:00\" \"2026-01-30T15:00:00\"" >&2
  echo "  calendar-create.sh \"1:1\" \"2026-01-30T10:00:00\" \"2026-01-30T10:30:00\" \"joao@email.com\"" >&2
  exit 1
fi

SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/google-token.sh")

# Build attendees JSON array
ATTENDEES_JSON="[]"
if [ -n "$ATTENDEES" ]; then
  ATTENDEES_JSON=$(echo "$ATTENDEES" | tr ',' '\n' | jq -R '{email: .}' | jq -s '.')
fi

# Generate unique request ID
REQUEST_ID="meet-$(date +%s)-$$"

# Create event with Meet conference
EVENT_JSON=$(jq -n \
  --arg title "$TITLE" \
  --arg startTime "$START" \
  --arg endTime "$END" \
  --arg desc "$DESCRIPTION" \
  --arg reqId "$REQUEST_ID" \
  --argjson attendees "$ATTENDEES_JSON" \
  '{
    summary: $title,
    description: $desc,
    start: {
      dateTime: $startTime,
      timeZone: "America/Sao_Paulo"
    },
    "end": {
      dateTime: $endTime,
      timeZone: "America/Sao_Paulo"
    },
    attendees: $attendees,
    conferenceData: {
      createRequest: {
        requestId: $reqId,
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        {method: "popup", minutes: 10}
      ]
    }
  }')

# Create event with conferenceDataVersion=1 to generate Meet link
RESULT=$(curl -s -X POST \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EVENT_JSON")

# Check for errors
if echo "$RESULT" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: $(echo "$RESULT" | jq -r '.error.message')" >&2
  exit 1
fi

# Extract relevant info
echo "$RESULT" | jq '{
  success: true,
  id: .id,
  title: .summary,
  start: .start.dateTime,
  end: .end.dateTime,
  meetLink: .conferenceData.entryPoints[0].uri,
  htmlLink: .htmlLink,
  attendees: [.attendees[]?.email]
}'

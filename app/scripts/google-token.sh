#!/bin/bash
# Get a fresh Google OAuth access token using the refresh token

set -e

# Use env vars from the container
CLIENT_ID="${GOOGLE_CLIENT_ID}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"
REFRESH_TOKEN="${GOOGLE_REFRESH_TOKEN}"

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$REFRESH_TOKEN" ]; then
  echo "Error: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be set" >&2
  exit 1
fi

curl -s -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}" \
  -d "grant_type=refresh_token" | jq -r '.access_token'

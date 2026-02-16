#!/bin/bash
# Chrome Web Store Upload Script
# Usage: ./cws-upload.sh <extension-dir> [extension-id]
# If extension-id is omitted, creates a new item

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$PROJECT_DIR/.env.cws"

EXT_DIR="$1"
EXT_ID="${2:-}"

# Get access token
ACCESS_TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$CWS_CLIENT_ID" \
  -d "client_secret=$CWS_CLIENT_SECRET" \
  -d "refresh_token=$CWS_REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create zip from src/
ZIP_FILE="/tmp/cws-upload-$(basename "$EXT_DIR").zip"
rm -f "$ZIP_FILE"
cd "$EXT_DIR/src"
zip -r "$ZIP_FILE" . -x ".*" > /dev/null
cd - > /dev/null

echo "📦 Packaged: $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"

if [ -z "$EXT_ID" ]; then
  # Create new item
  echo "🆕 Creating new Chrome Web Store item..."
  RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "x-goog-api-version: 2" \
    -T "$ZIP_FILE" \
    "https://www.googleapis.com/upload/chromewebstore/v1.1/items")
else
  # Update existing item
  echo "🔄 Updating item: $EXT_ID"
  RESULT=$(curl -s -X PUT \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "x-goog-api-version: 2" \
    -T "$ZIP_FILE" \
    "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$EXT_ID")
fi

echo "$RESULT" | python3 -m json.tool

# Extract ID from result
NEW_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
UPLOAD_STATE=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('uploadState',''))" 2>/dev/null || echo "")

if [ "$UPLOAD_STATE" = "SUCCESS" ]; then
  echo "✅ Upload successful! ID: $NEW_ID"
  
  # Auto-publish
  echo "🚀 Publishing..."
  PUB_RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "x-goog-api-version: 2" \
    -H "Content-Length: 0" \
    "https://www.googleapis.com/chromewebstore/v1.1/items/$NEW_ID/publish")
  echo "$PUB_RESULT" | python3 -m json.tool
else
  echo "❌ Upload state: $UPLOAD_STATE"
fi

rm -f "$ZIP_FILE"

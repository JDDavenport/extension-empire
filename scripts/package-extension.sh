#!/usr/bin/env bash
set -euo pipefail

# Package a Chrome extension for Web Store upload
# Usage: ./package-extension.sh <extension-name>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <extension-name>"
  echo "Example: $0 mercari-depop-auto"
  exit 1
fi

EXT_NAME="$1"
SRC_DIR="$ROOT/extensions/$EXT_NAME/src"
OUT_DIR="$ROOT/extensions/$EXT_NAME/dist"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: $SRC_DIR does not exist"
  exit 1
fi

mkdir -p "$OUT_DIR"

# Get version from manifest
VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SRC_DIR/manifest.json" | head -1 | grep -o '[0-9][0-9.]*')
ZIPNAME="${EXT_NAME}-v${VERSION}.zip"

echo "📦 Packaging $EXT_NAME v$VERSION..."

cd "$SRC_DIR"
zip -r "$OUT_DIR/$ZIPNAME" . \
  -x "*.svg" \
  -x "*.DS_Store" \
  -x "README*" \
  -x "readme*" \
  -x "*.md"

echo "✅ Created: extensions/$EXT_NAME/dist/$ZIPNAME"
echo "📏 Size: $(du -h "$OUT_DIR/$ZIPNAME" | cut -f1)"

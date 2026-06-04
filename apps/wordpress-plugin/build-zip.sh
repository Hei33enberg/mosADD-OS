#!/usr/bin/env bash
# build-zip.sh — package the WordPress plugin into a distributable ZIP.
# Run from anywhere; uses script-relative paths.
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PLUGIN_DIR="$HERE/plugin"
DIST_DIR="$HERE/dist"

# Pull the version from the plugin header (the line "Version: X.Y.Z").
VERSION="$(grep -E '^[[:space:]]*\*?[[:space:]]*Version:' "$PLUGIN_DIR/mosadd-mirc.php" | head -n1 | sed -E 's/.*Version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
if [[ -z "$VERSION" ]]; then
  echo "could not read Version from $PLUGIN_DIR/mosadd-mirc.php" >&2
  exit 1
fi

OUT_ZIP="$DIST_DIR/mosadd-mirc-$VERSION.zip"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# WordPress requires the plugin folder name to match the slug.
cp -R "$PLUGIN_DIR" "$STAGE/mosadd-mirc"

mkdir -p "$DIST_DIR"
rm -f "$OUT_ZIP"
(cd "$STAGE" && zip -r "$OUT_ZIP" mosadd-mirc -x '*.DS_Store' >/dev/null)

echo "→ $OUT_ZIP"
echo "  size: $(stat -c%s "$OUT_ZIP" 2>/dev/null || stat -f%z "$OUT_ZIP") bytes"
echo
echo "next:"
echo "  1. WP admin → Plugins → Add New → Upload Plugin → choose this ZIP."
echo "  2. Settings → mosadd mIRC → paste m_pk_live_… key → save."

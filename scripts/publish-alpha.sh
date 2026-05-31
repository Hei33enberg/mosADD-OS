#!/usr/bin/env bash
#
# publish-alpha.sh — publish the alpha packages to npm.
#
# Order matters: protocol + crypto + threat-engine first (mcp depends on protocol).
#
# Usage:
#   export NPM_TOKEN=npm_xxx                 # granular token, scope @m0ssad
#   ./scripts/publish-alpha.sh               # dry run by default
#   PUBLISH=1 ./scripts/publish-alpha.sh     # actually publish
#
# Access mode is controlled by ACCESS env var. Defaults to "public" because
# npm Free accounts cannot publish restricted scoped packages. If you have npm
# Pro/Teams/Enterprise and want true private packages, set ACCESS=restricted.
# Either way, --tag=alpha keeps `npm install @mosadd/mcp` (which resolves to
# `latest`) from picking this up — users must explicitly install @alpha.

set -euo pipefail

ACCESS="${ACCESS:-public}"
TAG="${TAG:-alpha}"
PUBLISH="${PUBLISH:-0}"

cd "$(dirname "$0")/.."

if [[ -z "${NPM_TOKEN:-}" && "${PUBLISH}" == "1" ]]; then
  echo "ERROR: NPM_TOKEN env var required for real publish. Generate at https://www.npmjs.com/settings/<your-user>/tokens" >&2
  echo "       Or set PUBLISH=0 (default) for dry-run." >&2
  exit 1
fi

# Set up auth if publishing for real.
if [[ "${PUBLISH}" == "1" ]]; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${HOME}/.npmrc.publish.tmp"
  export NPM_CONFIG_USERCONFIG="${HOME}/.npmrc.publish.tmp"
  trap 'rm -f "${HOME}/.npmrc.publish.tmp"' EXIT
fi

PKGS=(
  "packages/protocol"
  "packages/crypto"
  "packages/threat-engine"
  "packages/mcp"
)

echo "==========================================="
echo "  mosadd-os alpha publish"
echo "  access: ${ACCESS}"
echo "  tag:    ${TAG}"
echo "  mode:   $([[ "${PUBLISH}" == "1" ]] && echo "LIVE PUBLISH" || echo "dry-run")"
echo "==========================================="

# Verify everything builds first.
echo ""
echo "Building all packages..."
pnpm -r build

# Publish each in order.
for pkg in "${PKGS[@]}"; do
  echo ""
  echo "→ ${pkg}"
  if [[ "${PUBLISH}" == "1" ]]; then
    pnpm publish "${pkg}" --access "${ACCESS}" --tag "${TAG}" --no-git-checks
  else
    pnpm publish "${pkg}" --access "${ACCESS}" --tag "${TAG}" --no-git-checks --dry-run
  fi
done

echo ""
echo "==========================================="
echo "  Done."
echo "==========================================="
if [[ "${PUBLISH}" == "1" ]]; then
  echo "  Try it:"
  echo "    npx @mosadd/mcp@${TAG}"
  echo ""
  echo "  Tag the release in git:"
  echo "    git tag v3.0.0-${TAG}.0 && git push --tags"
else
  echo "  Dry-run complete. Run with PUBLISH=1 to publish for real."
fi

#!/usr/bin/env bash
# Sample pre-push hook: scans only the commits about to be pushed
# (since_ref..HEAD) rather than full history, and blocks the push if
# any CRITICAL finding is detected.
#
# Install:
#   cp hooks/pre-push.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
#
# Requires target_profile.yaml to already exist (run `opsec-scan --init-profile` once).

set -euo pipefail

REMOTE_REF="${1:-origin/main}"
REPORT_DIR="$(git rev-parse --show-toplevel)/.opsec-scan"
mkdir -p "$REPORT_DIR"

echo "[pre-push] Scanning commits since ${REMOTE_REF}..."

opsec-scan \
  --repo . \
  --since-ref "${REMOTE_REF}" \
  --profile target_profile.yaml \
  --output "${REPORT_DIR}/pre-push-report.html" \
  --fail-on CRITICAL

STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo ""
  echo "[pre-push] BLOCKED: CRITICAL findings detected in commits being pushed."
  echo "[pre-push] Review ${REPORT_DIR}/pre-push-report.html before pushing."
  echo "[pre-push] To bypass (not recommended): git push --no-verify"
  exit 1
fi

echo "[pre-push] Clean — no CRITICAL findings in pushed commits."
exit 0

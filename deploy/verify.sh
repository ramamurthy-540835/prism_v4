#!/usr/bin/env bash
set -euo pipefail
API_URL=${1:?Usage: verify.sh https://prism-api-...run.app}
status=$(curl -sS -o /dev/null -w '%{http_code}' "$API_URL/health")
test "$status" = "200"
# Authentication is mandatory: an unauthenticated API call must be rejected,
# proving this is the Python FastAPI service rather than UI-only deployment.
status=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API_URL/api/knowledge/documents/upload-url" -H 'Content-Type: application/json' -d '{}')
test "$status" = "401"
echo "Python API verification passed"

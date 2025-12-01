#!/usr/bin/env bash

set -euo pipefail
set -x

# Always execute from repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "This script must be run from the repository root where backend/ and frontend/ exist." >&2
  exit 1
fi

echo "Generating OpenAPI schema..."
(
  cd backend
  uv run python generate_openapi.py
)

echo "Generating frontend client..."
(
  cd frontend
  npm run generate-client
)

echo "Client generation completed."


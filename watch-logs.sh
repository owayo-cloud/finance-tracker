#!/bin/bash
# Script to watch logs from both backend and frontend services
# Usage: ./watch-logs.sh

echo "Watching logs from backend and frontend services..."
echo "Press Ctrl+C to stop"
echo ""

docker compose logs -f backend frontend


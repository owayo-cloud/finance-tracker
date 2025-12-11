#!/bin/bash
# Script to watch logs from both backend and frontend services with error highlighting
# Usage: ./watch-logs.sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}Watching logs from backend and frontend services...${NC}"
echo -e "${YELLOW}Errors and HTTP status codes will be highlighted${NC}"
echo -e "${WHITE}Press Ctrl+C to stop${NC}"
echo ""

# Function to colorize log lines
colorize_logs() {
    while IFS= read -r line; do
        # Check for errors (case insensitive)
        if echo "$line" | grep -qiE "(error|exception|traceback|failed|failure|critical)"; then
            echo -e "${RED}${line}${NC}"
        # Check for HTTP 4xx errors (client errors)
        elif echo "$line" | grep -qE "(Status: [4][0-9]{2}|status.*[4][0-9]{2}|HTTP.*[4][0-9]{2}|404|403|401|400|422|429)"; then
            echo -e "${YELLOW}${line}${NC}"
        # Check for HTTP 5xx errors (server errors)
        elif echo "$line" | grep -qE "(Status: [5][0-9]{2}|status.*[5][0-9]{2}|HTTP.*[5][0-9]{2}|500|502|503|504)"; then
            echo -e "${RED}${line}${NC}"
        # Check for warnings
        elif echo "$line" | grep -qiE "(warning|warn)"; then
            echo -e "${YELLOW}${line}${NC}"
        # Check for successful HTTP 2xx
        elif echo "$line" | grep -qE "(Status: [2][0-9]{2}|status.*[2][0-9]{2}|HTTP.*[2][0-9]{2}|200|201|204)"; then
            echo -e "${GREEN}${line}${NC}"
        # Check for INFO level logs
        elif echo "$line" | grep -qiE "(INFO|info)"; then
            echo -e "${CYAN}${line}${NC}"
        # Check for DEBUG level logs
        elif echo "$line" | grep -qiE "(DEBUG|debug)"; then
            echo -e "${BLUE}${line}${NC}"
        # Default: print as is
        else
            echo "$line"
        fi
    done
}

# Watch logs and colorize them
docker compose logs -f backend frontend 2>&1 | colorize_logs


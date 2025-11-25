#!/bin/bash
#
# Supervisor Management Helper Script
# Provides shortcuts for common supervisor operations
#

set -e

CONTAINER_NAME="${CONTAINER_NAME:-finance-tracker-backend-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_usage() {
    cat << EOF
Supervisor Management Helper

Usage: $0 <command> [options]

Commands:
    status              Show status of all processes
    logs <process>      Tail logs for a specific process (fastapi|scheduler|all)
    restart <process>   Restart a process (fastapi|scheduler|all)
    start <process>     Start a process
    stop <process>      Stop a process
    reload              Reload supervisor configuration
    shell               Open supervisorctl interactive shell
    build-templates     Rebuild email templates from MJML sources

Examples:
    $0 status
    $0 logs scheduler
    $0 restart fastapi
    $0 build-templates

Environment Variables:
    CONTAINER_NAME      Name of the backend container (default: finance-tracker-backend-1)

EOF
}

function check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}Error: Container '${CONTAINER_NAME}' is not running${NC}"
        echo "Available containers:"
        docker ps --format 'table {{.Names}}\t{{.Status}}'
        exit 1
    fi
}

function supervisor_status() {
    echo -e "${GREEN}Supervisor Process Status:${NC}"
    docker exec -it "$CONTAINER_NAME" supervisorctl status
}

function supervisor_logs() {
    local process="$1"
    
    if [ -z "$process" ]; then
        echo -e "${RED}Error: Process name required${NC}"
        echo "Usage: $0 logs <fastapi|scheduler|all>"
        exit 1
    fi
    
    case "$process" in
        fastapi)
            echo -e "${GREEN}Following FastAPI logs...${NC}"
            docker exec -it "$CONTAINER_NAME" tail -f /var/log/supervisor/fastapi.log
            ;;
        scheduler)
            echo -e "${GREEN}Following Scheduler logs...${NC}"
            docker exec -it "$CONTAINER_NAME" tail -f /var/log/supervisor/scheduler.log
            ;;
        all)
            echo -e "${GREEN}Following all Supervisor logs...${NC}"
            docker exec -it "$CONTAINER_NAME" tail -f /var/log/supervisor/*.log
            ;;
        *)
            echo -e "${RED}Error: Unknown process '${process}'${NC}"
            echo "Available: fastapi, scheduler, all"
            exit 1
            ;;
    esac
}

function supervisor_restart() {
    local process="$1"
    
    if [ -z "$process" ]; then
        echo -e "${RED}Error: Process name required${NC}"
        echo "Usage: $0 restart <fastapi|scheduler|all>"
        exit 1
    fi
    
    case "$process" in
        fastapi|scheduler)
            echo -e "${YELLOW}Restarting ${process}...${NC}"
            docker exec -it "$CONTAINER_NAME" supervisorctl restart "$process"
            ;;
        all)
            echo -e "${YELLOW}Restarting all processes...${NC}"
            docker exec -it "$CONTAINER_NAME" supervisorctl restart all
            ;;
        *)
            echo -e "${RED}Error: Unknown process '${process}'${NC}"
            echo "Available: fastapi, scheduler, all"
            exit 1
            ;;
    esac
}

function supervisor_start() {
    local process="$1"
    
    if [ -z "$process" ]; then
        echo -e "${RED}Error: Process name required${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Starting ${process}...${NC}"
    docker exec -it "$CONTAINER_NAME" supervisorctl start "$process"
}

function supervisor_stop() {
    local process="$1"
    
    if [ -z "$process" ]; then
        echo -e "${RED}Error: Process name required${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Stopping ${process}...${NC}"
    docker exec -it "$CONTAINER_NAME" supervisorctl stop "$process"
}

function supervisor_reload() {
    echo -e "${YELLOW}Reloading Supervisor configuration...${NC}"
    docker exec -it "$CONTAINER_NAME" supervisorctl reread
    docker exec -it "$CONTAINER_NAME" supervisorctl update
}

function supervisor_shell() {
    echo -e "${GREEN}Opening Supervisor interactive shell...${NC}"
    echo "Type 'help' for available commands, 'exit' to quit"
    docker exec -it "$CONTAINER_NAME" supervisorctl
}

function build_email_templates() {
    echo -e "${GREEN}Rebuilding email templates from MJML sources...${NC}"
    
    local templates=(
        "debt_reminder"
        "reorder_alert"
        "low_stock_notification"
        "new_account"
        "reset_password"
        "test_email"
    )
    
    for template in "${templates[@]}"; do
        if [ -f "app/email-templates/src/${template}.mjml" ]; then
            echo -e "${YELLOW}Building ${template}.html...${NC}"
            npx mjml "app/email-templates/src/${template}.mjml" -o "app/email-templates/build/${template}.html"
            echo -e "${GREEN}✓ ${template}.html${NC}"
        else
            echo -e "${YELLOW}⚠ Skipping ${template} (source not found)${NC}"
        fi
    done
    
    echo -e "${GREEN}Email templates rebuilt successfully!${NC}"
    echo -e "${YELLOW}Remember to restart the backend container to use the updated templates${NC}"
}

# Main script logic
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

COMMAND="$1"
shift

case "$COMMAND" in
    status)
        check_container
        supervisor_status
        ;;
    logs)
        check_container
        supervisor_logs "$@"
        ;;
    restart)
        check_container
        supervisor_restart "$@"
        ;;
    start)
        check_container
        supervisor_start "$@"
        ;;
    stop)
        check_container
        supervisor_stop "$@"
        ;;
    reload)
        check_container
        supervisor_reload
        ;;
    shell)
        check_container
        supervisor_shell
        ;;
    build-templates)
        build_email_templates
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo -e "${RED}Error: Unknown command '${COMMAND}'${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac

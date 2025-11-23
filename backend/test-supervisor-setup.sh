#!/bin/bash
#
# Integration Test for Supervisor Setup
# Tests that all components are working correctly
#

set -e

echo "========================================"
echo "Supervisor Integration Test"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

function test_passed() {
    echo -e "${GREEN}✓${NC} $1"
}

function test_failed() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

function test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Check if supervisor config exists
echo "Test 1: Supervisor Configuration"
if [ -f "supervisord.conf" ]; then
    test_passed "supervisord.conf exists"
else
    test_failed "supervisord.conf not found"
fi

# Test 2: Check if scheduler exists
echo ""
echo "Test 2: Scheduler Script"
if [ -f "scheduler.py" ]; then
    test_passed "scheduler.py exists"
else
    test_failed "scheduler.py not found"
fi

# Test 3: Check email templates (MJML sources)
echo ""
echo "Test 3: Email Template Sources (MJML)"
TEMPLATES=("debt_reminder" "reorder_alert" "low_stock_notification" "new_account" "reset_password" "test_email")
for template in "${TEMPLATES[@]}"; do
    if [ -f "app/email-templates/src/${template}.mjml" ]; then
        test_passed "app/email-templates/src/${template}.mjml"
    else
        test_failed "app/email-templates/src/${template}.mjml not found"
    fi
done

# Test 4: Check built email templates (HTML)
echo ""
echo "Test 4: Built Email Templates (HTML)"
for template in "${TEMPLATES[@]}"; do
    if [ -f "app/email-templates/build/${template}.html" ]; then
        test_passed "app/email-templates/build/${template}.html"
    else
        test_warning "app/email-templates/build/${template}.html not found (will be built during Docker build)"
    fi
done

# Test 5: Python imports
echo ""
echo "Test 5: Python Module Imports"
if python -c "import sys; sys.path.insert(0, '.'); from app.background_services import send_debt_reminder_emails, send_reorder_alerts, cleanup_old_notifications" 2>/dev/null; then
    test_passed "Background services import successfully"
else
    test_failed "Background services import failed"
fi

if python -c "from apscheduler.schedulers.blocking import BlockingScheduler; from apscheduler.triggers.cron import CronTrigger" 2>/dev/null; then
    test_passed "APScheduler imports successfully"
else
    test_failed "APScheduler not installed or import failed"
fi

# Test 6: Check pyproject.toml has apscheduler
echo ""
echo "Test 6: Dependencies"
if grep -q "apscheduler" pyproject.toml; then
    test_passed "apscheduler listed in pyproject.toml"
else
    test_failed "apscheduler not in pyproject.toml dependencies"
fi

# Test 7: Check Dockerfile has supervisor and MJML
echo ""
echo "Test 7: Dockerfile Configuration"
if grep -q "supervisor" Dockerfile; then
    test_passed "Supervisor installation in Dockerfile"
else
    test_failed "Supervisor not found in Dockerfile"
fi

if grep -q "mjml" Dockerfile; then
    test_passed "MJML installation in Dockerfile"
else
    test_failed "MJML not found in Dockerfile"
fi

if grep -q "supervisord.conf" Dockerfile; then
    test_passed "supervisord.conf copied in Dockerfile"
else
    test_failed "supervisord.conf not copied in Dockerfile"
fi

if grep -q "supervisord" Dockerfile && grep -q "CMD" Dockerfile; then
    test_passed "CMD uses supervisord in Dockerfile"
else
    test_failed "Dockerfile CMD doesn't use supervisord"
fi

# Test 8: Check docker-compose.yml
echo ""
echo "Test 8: Docker Compose Configuration"
if [ -f "../docker-compose.yml" ]; then
    if grep -q "supervisor-logs" ../docker-compose.yml; then
        test_passed "supervisor-logs volume in docker-compose.yml"
    else
        test_failed "supervisor-logs volume not found in docker-compose.yml"
    fi
else
    test_warning "docker-compose.yml not found (run from backend directory)"
fi

# Test 9: Check documentation
echo ""
echo "Test 9: Documentation"
DOCS=("SUPERVISOR.md" "QUICK_REFERENCE.md" "supervisor-ctl.sh")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        test_passed "$doc exists"
    else
        test_failed "$doc not found"
    fi
done

# Test 10: Check utils.py has email generators
echo ""
echo "Test 10: Email Generator Functions"
EMAIL_FUNCS=("generate_debt_reminder_email" "generate_reorder_alert_email" "generate_low_stock_notification_email")
for func in "${EMAIL_FUNCS[@]}"; do
    if grep -q "$func" app/utils.py; then
        test_passed "$func in app/utils.py"
    else
        test_failed "$func not found in app/utils.py"
    fi
done

# Summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "✓ Supervisor configuration is complete"
    echo "✓ Email templates are ready"
    echo "✓ Background services are configured"
    echo "✓ Documentation is in place"
    echo ""
    echo "Next steps:"
    echo "1. Build Docker image: docker-compose build backend"
    echo "2. Start services: docker-compose up -d backend"
    echo "3. Verify: ./supervisor-ctl.sh status"
    exit 0
else
    echo -e "${RED}$FAILED test(s) failed${NC}"
    echo ""
    echo "Please review the failed tests above and fix the issues."
    exit 1
fi

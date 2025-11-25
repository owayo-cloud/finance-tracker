#!/bin/bash

# Deployment Status Checker Script
# This script helps verify deployment status and configuration

set -e

echo "=========================================="
echo "Deployment Status Checker"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check git status
echo "1. Checking Git Status..."
echo "----------------------------"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "Current branch: ${GREEN}${CURRENT_BRANCH}${NC}"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    git status --short
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# Check recent commits
echo ""
echo "Recent local commits:"
git log --oneline -5 2>/dev/null || echo "No commits found"

# Check remote status
echo ""
echo "2. Checking Remote Status..."
echo "----------------------------"
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "No remote configured")
echo "Remote URL: ${REMOTE_URL}"

# Check if master/main exists
if git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
    MASTER_EXISTS="master"
elif git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
    MASTER_EXISTS="main"
else
    MASTER_EXISTS="none"
fi

if [ "$MASTER_EXISTS" != "none" ]; then
    echo "Master/Main branch: ${GREEN}${MASTER_EXISTS}${NC}"
    
    # Check if local is ahead/behind remote
    if git fetch origin ${MASTER_EXISTS} --quiet 2>/dev/null; then
        LOCAL_COMMITS=$(git rev-list HEAD...origin/${MASTER_EXISTS} --count 2>/dev/null || echo "0")
        REMOTE_COMMITS=$(git rev-list origin/${MASTER_EXISTS}...HEAD --count 2>/dev/null || echo "0")
        
        if [ "$LOCAL_COMMITS" -gt 0 ]; then
            echo -e "${YELLOW}⚠ Local branch is ${LOCAL_COMMITS} commit(s) ahead of remote${NC}"
            echo "   You may need to push: git push origin ${MASTER_EXISTS}"
        elif [ "$REMOTE_COMMITS" -gt 0 ]; then
            echo -e "${YELLOW}⚠ Remote branch is ${REMOTE_COMMITS} commit(s) ahead of local${NC}"
            echo "   You may need to pull: git pull origin ${MASTER_EXISTS}"
        else
            echo -e "${GREEN}✓ Local and remote are in sync${NC}"
        fi
        
        echo ""
        echo "Recent remote commits:"
        git log origin/${MASTER_EXISTS} --oneline -5 2>/dev/null || echo "No remote commits found"
    else
        echo -e "${RED}✗ Could not fetch from remote${NC}"
    fi
else
    echo -e "${RED}✗ No master/main branch found${NC}"
fi

# Check workflow files
echo ""
echo "3. Checking Workflow Configuration..."
echo "----------------------------"
if [ -f ".github/workflows/deploy-production.yml" ]; then
    echo -e "${GREEN}✓ Production deployment workflow exists${NC}"
    
    # Check triggers
    if grep -q "workflow_dispatch" .github/workflows/deploy-production.yml; then
        echo -e "${GREEN}✓ Manual trigger enabled${NC}"
    fi
    
    if grep -q "workflow_run" .github/workflows/deploy-production.yml; then
        echo -e "${GREEN}✓ Auto-deploy after CI enabled${NC}"
    fi
    
    if grep -q "push:" .github/workflows/deploy-production.yml; then
        echo -e "${GREEN}✓ Push trigger enabled${NC}"
        echo "   Triggers on branches:"
        grep -A 5 "push:" .github/workflows/deploy-production.yml | grep "branches:" -A 3 | grep -E "^\s+-" | sed 's/^/     /'
    fi
else
    echo -e "${RED}✗ Production deployment workflow not found${NC}"
fi

if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✓ CI workflow exists${NC}"
else
    echo -e "${YELLOW}⚠ CI workflow not found${NC}"
fi

# Check Docker configuration
echo ""
echo "4. Checking Docker Configuration..."
echo "----------------------------"
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
    
    # Check if frontend service exists
    if grep -q "frontend:" docker-compose.yml; then
        echo -e "${GREEN}✓ Frontend service configured${NC}"
    fi
    
    # Check if backend service exists
    if grep -q "backend:" docker-compose.yml; then
        echo -e "${GREEN}✓ Backend service configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ docker-compose.yml not found${NC}"
fi

# Summary and recommendations
echo ""
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠ You are not on master/main branch${NC}"
    echo "   Current branch: ${CURRENT_BRANCH}"
    echo "   To deploy, you need to:"
    echo "   1. Merge/push your changes to master/main"
    echo "   2. Or manually trigger deployment from GitHub Actions"
fi

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
    echo "   Commit and push your changes first"
fi

if [ "$LOCAL_COMMITS" -gt 0 ] 2>/dev/null; then
    echo -e "${YELLOW}⚠ Your local branch has unpushed commits${NC}"
    echo "   Run: git push origin ${MASTER_EXISTS}"
fi

echo ""
echo "Next Steps:"
echo "1. Check GitHub Actions: https://github.com/YOUR_REPO/actions"
echo "2. Verify 'CI' workflow completed successfully"
echo "3. Verify 'Deploy to Production' workflow ran"
echo "4. If needed, manually trigger: Actions → Deploy to Production → Run workflow"
echo "5. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo ""


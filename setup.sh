#!/bin/bash

set -e

echo "🚀 Setting up Finance Tracker project..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example.env...${NC}"
    cp example.env .env
    echo -e "${GREEN}✅ Created .env file from example.env${NC}"
    echo -e "${YELLOW}⚠️  Please review and update .env file with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file exists (keeping as is)${NC}"
fi

# Check Docker
echo ""
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    docker --version
    
    # Check Docker Compose
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose is available${NC}"
        docker compose version
    else
        echo -e "${RED}❌ Docker Compose not found${NC}"
        echo "Please install Docker Compose"
        exit 1
    fi
    
    # Create traefik-public network if it doesn't exist (for production)
    # For local dev, docker-compose.override.yml creates it automatically
    if ! docker network ls | grep -q traefik-public; then
        echo ""
        echo "Creating traefik-public Docker network..."
        docker network create traefik-public 2>/dev/null || true
        echo -e "${GREEN}✅ traefik-public network ready${NC}"
    else
        echo -e "${GREEN}✅ traefik-public network already exists${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo "Please install Docker to run the project with Docker Compose"
    echo "Visit: https://docs.docker.com/get-docker/"
fi

# Check uv (for local backend development)
echo ""
echo "Checking uv installation (for local backend development)..."
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✅ uv is installed${NC}"
    uv --version
    
    # Install backend dependencies if .venv doesn't exist
    if [ ! -d "backend/.venv" ]; then
        echo ""
        echo "Installing backend Python dependencies..."
        cd backend
        uv sync --python 3.10
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
        cd ..
    else
        echo -e "${GREEN}✅ Backend virtual environment exists${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  uv is not installed (optional for local backend development)${NC}"
    echo "Install with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "Or use Docker for backend development"
fi

# Check Node.js (for local frontend development)
echo ""
echo "Checking Node.js installation (for local frontend development)..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js is installed${NC}"
    node --version
    if command -v npm &> /dev/null; then
        npm --version
    
        # Install frontend dependencies if node_modules doesn't exist
        if [ ! -d "frontend/node_modules" ]; then
            echo ""
            echo "Installing frontend dependencies..."
            cd frontend
            npm install
            echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
            cd ..
        else
            echo -e "${GREEN}✅ Frontend node_modules exists${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  npm is not in PATH (optional for local frontend development)${NC}"
        echo "Or use Docker for frontend development"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js is not installed (optional for local frontend development)${NC}"
    echo "Install Node.js from: https://nodejs.org/"
    echo "Or use Docker for frontend development"
fi

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review and update .env file if needed"
echo "2. Start the project with: docker compose watch"
echo ""
echo "Available services:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Adminer (DB): http://localhost:8080"
echo "  - Traefik UI: http://localhost:8090"
echo "  - MailCatcher: http://localhost:1080"
echo ""


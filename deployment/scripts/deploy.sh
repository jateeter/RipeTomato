#!/bin/bash
# Idaho Events - Docker Deploy Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${GREEN}=== Idaho Events - Docker Deploy Script ===${NC}\n"

# Parse arguments
ENVIRONMENT="${1:-production}"

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${BLUE}Deploying to DEVELOPMENT environment...${NC}"
    COMPOSE_FILE="docker-compose.dev.yml"
else
    echo -e "${BLUE}Deploying to PRODUCTION environment...${NC}"
    COMPOSE_FILE="docker-compose.yml"
fi

echo "Compose file: $COMPOSE_FILE"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down || true

echo -e "\n${YELLOW}Removing old images (keeping latest)...${NC}"
docker image prune -f

echo -e "\n${YELLOW}Building fresh images...${NC}"
docker-compose -f "$COMPOSE_FILE" build

echo -e "\n${YELLOW}Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check service health
echo -e "\n${YELLOW}Checking service health...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Get running container name
CONTAINER_NAME=$(docker-compose -f "$COMPOSE_FILE" ps -q | head -n 1)
if [ -n "$CONTAINER_NAME" ]; then
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_NAME" | sed 's/^\///')

    echo -e "\n${YELLOW}Container logs (last 20 lines):${NC}"
    docker logs --tail 20 "$CONTAINER_NAME"

    echo -e "\n${GREEN}✓ Deployment successful!${NC}"
    echo -e "\n${BLUE}Application is running:${NC}"

    if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
        echo -e "  ${GREEN}Frontend:${NC} http://localhost:3000"
    else
        echo -e "  ${GREEN}Frontend:${NC} http://localhost"
    fi
    echo -e "  ${GREEN}Proxy:${NC} http://localhost:8080"
    echo -e "  ${GREEN}Health:${NC} http://localhost/health"

    echo -e "\n${YELLOW}Useful commands:${NC}"
    echo -e "  View logs: ${GREEN}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  Stop: ${GREEN}docker-compose -f $COMPOSE_FILE down${NC}"
    echo -e "  Restart: ${GREEN}docker-compose -f $COMPOSE_FILE restart${NC}"
else
    echo -e "\n${RED}✗ Deployment failed! No containers running.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Deploy complete!${NC}"

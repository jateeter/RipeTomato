#!/bin/bash
# Idaho Events - Docker Build Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${GREEN}=== Idaho Events - Docker Build Script ===${NC}\n"

# Parse arguments
BUILD_TYPE="${1:-production}"
TAG="${2:-latest}"

if [ "$BUILD_TYPE" = "dev" ] || [ "$BUILD_TYPE" = "development" ]; then
    echo -e "${YELLOW}Building development image...${NC}"
    DOCKERFILE="Dockerfile.dev"
    IMAGE_NAME="idaho-events:dev-${TAG}"
else
    echo -e "${YELLOW}Building production image...${NC}"
    DOCKERFILE="Dockerfile"
    IMAGE_NAME="idaho-events:${TAG}"
fi

echo "Dockerfile: $DOCKERFILE"
echo "Image: $IMAGE_NAME"
echo ""

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build \
    -f "$DOCKERFILE" \
    -t "$IMAGE_NAME" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    .

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Build successful!${NC}"
    echo -e "Image: ${GREEN}$IMAGE_NAME${NC}"

    # Show image info
    echo -e "\n${YELLOW}Image information:${NC}"
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
else
    echo -e "\n${RED}✗ Build failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}Build complete!${NC}"

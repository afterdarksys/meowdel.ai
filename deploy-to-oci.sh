#!/bin/bash

# Meowdel OCI Deployment Script
# Deploys to Oracle Cloud Infrastructure at 129.80.158.147

set -e

echo "🚀 Deploying Meowdel to OCI..."

# Colors
GREEN='\033[0.32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
OCI_HOST="${OCI_HOST:-129.80.158.147}"
OCI_USER="${OCI_USER:-ubuntu}"
APP_NAME="meowdel"
REMOTE_PATH="/opt/meowdel"

echo -e "${BLUE}Target: ${OCI_USER}@${OCI_HOST}${NC}"

# Step 1: Build Docker image locally
echo -e "\n${BLUE}Step 1: Building Docker image...${NC}"
cd "$(dirname "$0")"
docker compose -f docker-compose.production.yml build

# Step 2: Save image to tarball
echo -e "\n${BLUE}Step 2: Saving Docker image...${NC}"
docker save meowdelai-meowdel-web:latest | gzip > /tmp/meowdel-web.tar.gz

# Step 3: Copy to OCI
echo -e "\n${BLUE}Step 3: Copying to OCI server...${NC}"
scp -C /tmp/meowdel-web.tar.gz ${OCI_USER}@${OCI_HOST}:/tmp/
scp docker-compose.production.yml ${OCI_USER}@${OCI_HOST}:${REMOTE_PATH}/
scp web-app/.env ${OCI_USER}@${OCI_HOST}:${REMOTE_PATH}/.env

# Step 4: Deploy on OCI
echo -e "\n${BLUE}Step 4: Deploying on OCI...${NC}"
ssh ${OCI_USER}@${OCI_HOST} << 'ENDSSH'
set -e

# Load the image
echo "Loading Docker image..."
docker load < /tmp/meowdel-web.tar.gz
rm /tmp/meowdel-web.tar.gz

# Navigate to app directory
cd /opt/meowdel

# Stop existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.production.yml down || true

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.production.yml up -d

# Show status
echo "Checking container status..."
docker compose -f docker-compose.production.yml ps

# Show logs
echo "Recent logs:"
docker compose -f docker-compose.production.yml logs --tail=50

ENDSSH

# Cleanup
rm /tmp/meowdel-web.tar.gz

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Site should be live at: https://meowdel.ai${NC}"
echo -e "\n${BLUE}To view logs:${NC}"
echo -e "ssh ${OCI_USER}@${OCI_HOST} 'cd ${REMOTE_PATH} && docker compose -f docker-compose.production.yml logs -f'"

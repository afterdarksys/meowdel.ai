#!/bin/bash

# Meowdel Kubernetes Deployment Script
# Deploys updated app to OCI Kubernetes cluster

set -e

echo "🐱 Deploying Meowdel to Kubernetes..."

# Configuration
OCIR_REGION="us-ashburn-1"
OCIR_NAMESPACE="idd2oizp8xvc"
IMAGE_NAME="meowdel-web"
IMAGE_TAG="build-$(date +%Y%m%d-%H%M%S)"
FULL_IMAGE="${OCIR_REGION}.ocir.io/${OCIR_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE="${OCIR_REGION}.ocir.io/${OCIR_NAMESPACE}/${IMAGE_NAME}:latest"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Target Image: ${FULL_IMAGE}${NC}"

# Step 1: Ensure Docker image is built
echo -e "\n${BLUE}Step 1: Checking local Docker image...${NC}"
if ! docker images | grep -q "meowdelai-meowdel-web.*latest"; then
    echo -e "${RED}Docker image not found! Building...${NC}"
    docker compose -f docker-compose.production.yml build
else
    echo -e "${GREEN}✓ Docker image found${NC}"
fi

# Step 2: Tag image for OCIR
echo -e "\n${BLUE}Step 2: Tagging image for OCIR...${NC}"
docker tag meowdelai-meowdel-web:latest ${FULL_IMAGE}
docker tag meowdelai-meowdel-web:latest ${LATEST_IMAGE}
echo -e "${GREEN}✓ Tagged as ${FULL_IMAGE}${NC}"
echo -e "${GREEN}✓ Tagged as ${LATEST_IMAGE}${NC}"

# Step 3: Push to OCIR
echo -e "\n${BLUE}Step 3: Pushing to OCI Container Registry...${NC}"
echo "Note: Make sure you're logged in with: docker login ${OCIR_REGION}.ocir.io"
docker push ${FULL_IMAGE}
docker push ${LATEST_IMAGE}
echo -e "${GREEN}✓ Pushed to registry${NC}"

# Step 4: Update Kubernetes secrets if needed
echo -e "\n${BLUE}Step 4: Updating Kubernetes configuration...${NC}"

# Update the ConfigMap and Secrets with new environment variables
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: meowdel-config
  namespace: meowdel
data:
  NEXT_PUBLIC_SITE_URL: "https://meowdel.ai"
  NODE_ENV: "production"
---
apiVersion: v1
kind: Secret
metadata:
  name: meowdel-secrets
  namespace: meowdel
type: Opaque
stringData:
  ANTHROPIC_API_KEY: "$(grep ANTHROPIC_API_KEY web-app/.env | cut -d'=' -f2)"
  STRIPE_SECRET_KEY: "$(grep STRIPE_SECRET_KEY web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "$(grep NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY web-app/.env | cut -d'=' -f2)"
  STRIPE_WEBHOOK_SECRET: "$(grep STRIPE_WEBHOOK_SECRET web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PRICE_PURR: "$(grep NEXT_PUBLIC_STRIPE_PRICE_PURR web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PRICE_MEOW: "$(grep NEXT_PUBLIC_STRIPE_PRICE_MEOW web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PRICE_BISCUITS: "$(grep NEXT_PUBLIC_STRIPE_PRICE_BISCUITS web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PRICE_SWAT: "$(grep NEXT_PUBLIC_STRIPE_PRICE_SWAT web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_PRICE_ROAR: "$(grep NEXT_PUBLIC_STRIPE_PRICE_ROAR web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_ADDON_VOICE: "$(grep NEXT_PUBLIC_STRIPE_ADDON_VOICE web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_ADDON_WAKEUP: "$(grep NEXT_PUBLIC_STRIPE_ADDON_WAKEUP web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_ADDON_TEXTS: "$(grep NEXT_PUBLIC_STRIPE_ADDON_TEXTS web-app/.env | cut -d'=' -f2)"
  NEXT_PUBLIC_STRIPE_ADDON_REMINDERS: "$(grep NEXT_PUBLIC_STRIPE_ADDON_REMINDERS web-app/.env | cut -d'=' -f2)"
  OPENROUTER_API_KEY: "$(grep OPENROUTER_API_KEY web-app/.env | cut -d'=' -f2 || echo '')"
  ELEVENLABS_API_KEY: "$(grep ELEVENLABS_API_KEY web-app/.env | cut -d'=' -f2 || echo '')"
  ULTRAVOX_API_KEY: "$(grep ULTRAVOX_API_KEY web-app/.env | cut -d'=' -f2 || echo '')"
  DATABASE_URL: "postgresql://postgres:postgres_secure_2025@postgresql.databases.svc.cluster.local:5432/meowdel"
  OAUTH2_PROVIDER_URL: "https://adsas.id/application/o"
  OAUTH2_CLIENT_ID: "meowdel-client"
  OAUTH2_CLIENT_SECRET: "$(grep OAUTH2_CLIENT_SECRET web-app/.env | cut -d'=' -f2)"
  OAUTH2_REDIRECT_URI: "https://meowdel.ai/api/auth/callback"
  OAUTH2_SCOPES: "openid profile email"
EOF

echo -e "${GREEN}✓ Updated ConfigMap and Secrets${NC}"

# Step 5: Update deployment with new image tag
echo -e "\n${BLUE}Step 5: Updating deployment with new image...${NC}"
kubectl set image deployment/meowdel-web meowdel=${FULL_IMAGE} -n meowdel
echo -e "${GREEN}✓ Deployment updated with ${FULL_IMAGE}${NC}"

# Step 6: Wait for rollout
echo -e "\n${BLUE}Step 6: Waiting for rollout to complete...${NC}"
kubectl rollout status deployment/meowdel-web -n meowdel --timeout=5m
echo -e "${GREEN}✓ Rollout complete!${NC}"

# Step 7: Show status
echo -e "\n${BLUE}Deployment Status:${NC}"
kubectl get pods -n meowdel -l app=meowdel
echo ""
kubectl get ingress -n meowdel

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Site should be live at: https://meowdel.ai${NC}"
echo ""
echo -e "${BLUE}To view logs:${NC}"
echo "kubectl logs -f -n meowdel -l app=meowdel --tail=100"
echo ""
echo -e "${BLUE}To check pod status:${NC}"
echo "kubectl get pods -n meowdel -w"

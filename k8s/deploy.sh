#!/bin/bash
# 🐱 Meowdel Kubernetes Deployment Script
# Quick deployment for the impatient cat at 4AM

set -e  # Exit on error

echo "🐱 Meowdel K8s Deployment Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if we have a kubeconfig
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster. Check your kubeconfig.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"
kubectl cluster-info | head -1
echo ""

# Step 1: Create namespace
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f namespace.yaml

# Step 2: Create secrets (if they exist)
if [ -f "secrets.yaml" ]; then
    echo -e "${YELLOW}🔐 Applying secrets...${NC}"
    kubectl apply -f secrets.yaml
else
    echo -e "${RED}⚠️  WARNING: secrets.yaml not found!${NC}"
    echo "   Copy secrets.example.yaml to secrets.yaml and fill in values"
    echo "   Deployment will continue but may fail without secrets..."
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 3: Create ConfigMap
echo -e "${YELLOW}⚙️  Creating ConfigMap...${NC}"
kubectl apply -f configmap.yaml

# Step 4: Deploy PostgreSQL
echo -e "${YELLOW}🐘 Deploying PostgreSQL...${NC}"
kubectl apply -f postgres-deployment.yaml
echo "   Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n meowdel --timeout=120s || true

# Step 5: Deploy Redis
echo -e "${YELLOW}💾 Deploying Redis...${NC}"
kubectl apply -f redis-deployment.yaml
echo "   Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n meowdel --timeout=60s || true

# Step 6: Deploy Ollama
echo -e "${YELLOW}🤖 Deploying Ollama (Local AI)...${NC}"
kubectl apply -f ollama-deployment.yaml
echo "   Waiting for Ollama to be ready..."
kubectl wait --for=condition=ready pod -l app=ollama -n meowdel --timeout=180s || true

# Step 7: Pull Ollama models (run init job)
echo -e "${YELLOW}📥 Pulling AI models (this may take a few minutes)...${NC}"
kubectl wait --for=condition=complete job/ollama-model-init -n meowdel --timeout=600s || echo "   Model init still running in background..."

# Step 8: Deploy Web App
echo -e "${YELLOW}🌐 Deploying Web Application...${NC}"
kubectl apply -f web-app-deployment.yaml
echo "   Waiting for web app to be ready..."
kubectl wait --for=condition=ready pod -l app=meowdel-web -n meowdel --timeout=180s || true

# Step 9: Deploy Ingress
echo -e "${YELLOW}🚪 Setting up Ingress...${NC}"
kubectl apply -f ingress.yaml

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📊 Checking status..."
kubectl get pods -n meowdel
echo ""
kubectl get svc -n meowdel
echo ""

# Get ingress info
echo -e "${YELLOW}🌍 Ingress Status:${NC}"
kubectl get ingress -n meowdel

echo ""
echo -e "${GREEN}✅ All done! Meowdel is deploying!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Check pod logs: kubectl logs -f -l app=meowdel-web -n meowdel"
echo "   2. Check health: curl http://your-ingress-ip/api/ai/health"
echo "   3. Monitor pods: kubectl get pods -n meowdel -w"
echo ""
echo "🐱 Happy deploying! *purr*"

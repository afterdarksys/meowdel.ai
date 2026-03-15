#!/bin/bash
# 🐱 Nuclear option - delete everything

echo "⚠️  WARNING: This will DELETE ALL Meowdel resources!"
echo "   - All pods, services, deployments"
echo "   - Persistent volumes (DATA LOSS!)"
echo "   - Secrets and ConfigMaps"
echo ""
read -p "Are you SURE? Type 'destroy' to confirm: " CONFIRM

if [ "$CONFIRM" != "destroy" ]; then
    echo "❌ Cancelled"
    exit 1
fi

echo "💣 Destroying Meowdel namespace and all resources..."
kubectl delete namespace meowdel

echo "🧹 Cleanup complete"
echo "   To redeploy: ./deploy.sh"

#!/bin/bash
# 🐱 Quick rollback script

set -e

echo "🔄 Rolling back Meowdel deployment..."

kubectl rollout undo deployment/meowdel-web -n meowdel

echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/meowdel-web -n meowdel

echo "✅ Rollback complete!"
kubectl get pods -n meowdel

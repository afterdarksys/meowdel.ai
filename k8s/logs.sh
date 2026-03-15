#!/bin/bash
# 🐱 Quick logs viewer

COMPONENT=${1:-web}

case $COMPONENT in
  web)
    kubectl logs -f -l app=meowdel-web -n meowdel --tail=100
    ;;
  postgres)
    kubectl logs -f -l app=postgres -n meowdel --tail=100
    ;;
  redis)
    kubectl logs -f -l app=redis -n meowdel --tail=100
    ;;
  ollama)
    kubectl logs -f -l app=ollama -n meowdel --tail=100
    ;;
  *)
    echo "Usage: ./logs.sh [web|postgres|redis|ollama]"
    echo "Default: web"
    ;;
esac

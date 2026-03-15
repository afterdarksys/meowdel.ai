# 🐱 Meowdel Kubernetes Deployment Guide

*Production-ready K8s manifests for the smartest AI cat on the internet!*

## Quick Start (5 Minutes)

```bash
# 1. Setup secrets
cp secrets.example.yaml secrets.yaml
# Edit secrets.yaml with your real values

# 2. Deploy everything
./deploy.sh

# 3. Watch it come alive
kubectl get pods -n meowdel -w
```

That's it! *purr* 🎉

## What Gets Deployed

### Core Services
- **Web App** (Next.js) - 3 replicas with auto-scaling
- **PostgreSQL** - Database with persistent storage
- **Redis** - Caching & rate limiting
- **Ollama** - Local AI models (cost savings!)

### Features Included
- ✅ Auto-scaling (2-10 pods based on CPU/memory)
- ✅ Health checks & liveness probes
- ✅ Persistent storage for database & AI models
- ✅ TLS/HTTPS with cert-manager
- ✅ Ingress with rate limiting
- ✅ Resource limits & requests
- ✅ Automatic Ollama model pulling

## Architecture

```
Internet
   ↓
[Ingress] (TLS, rate limiting)
   ↓
[Load Balancer]
   ↓
[Web App Pods] (3-10 replicas, auto-scale)
   ├──→ [PostgreSQL] (persistent data)
   ├──→ [Redis] (caching)
   └──→ [Ollama] (local AI)
```

## Prerequisites

### Required
- Kubernetes cluster (1.24+)
- `kubectl` configured
- Storage class for PVCs
- 4+ GB RAM available
- 8+ GB disk for Ollama models

### Optional
- NGINX Ingress Controller
- cert-manager (for automatic TLS)
- GPU node (for faster Ollama)

## Deployment Files

```
k8s/
├── deploy.sh              # 🚀 Main deployment script
├── rollback.sh            # 🔄 Quick rollback
├── logs.sh                # 📋 View logs
├── destroy.sh             # 💣 Delete everything
├── namespace.yaml         # Meowdel namespace
├── configmap.yaml         # Non-sensitive config
├── secrets.example.yaml   # Template for secrets
├── postgres-deployment.yaml
├── redis-deployment.yaml
├── ollama-deployment.yaml
├── web-app-deployment.yaml
├── ingress.yaml
└── README.md             # This file
```

## Configuration

### 1. Secrets Setup

```bash
cp secrets.example.yaml secrets.yaml
```

Edit `secrets.yaml` with real values:

```yaml
stringData:
  POSTGRES_PASSWORD: "your_postgres_password"
  ANTHROPIC_API_KEY: "sk-ant-..."
  OAUTH2_CLIENT_SECRET: "your_oauth_secret"
  # etc...
```

**IMPORTANT:** Never commit `secrets.yaml` to git!

### 2. ConfigMap Customization

Edit `configmap.yaml` for your environment:

```yaml
data:
  NEXT_PUBLIC_SITE_URL: "https://your-domain.com"
  OAUTH2_PROVIDER_URL: "https://your-auth-provider.com"
  # etc...
```

### 3. Ingress Setup

Edit `ingress.yaml`:

```yaml
spec:
  tls:
    - hosts:
        - your-domain.com  # Change this
  rules:
    - host: your-domain.com  # And this
```

## Deployment

### Full Deployment

```bash
./deploy.sh
```

This will:
1. Create namespace
2. Apply secrets & config
3. Deploy PostgreSQL
4. Deploy Redis
5. Deploy Ollama
6. Pull AI models (llama3.2:3b, mistral:7b)
7. Deploy web app
8. Setup ingress

### Manual Deployment

```bash
# Apply in order
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f ollama-deployment.yaml
kubectl apply -f web-app-deployment.yaml
kubectl apply -f ingress.yaml
```

## Common Operations

### View Logs

```bash
# Web app logs
./logs.sh web

# Database logs
./logs.sh postgres

# Ollama logs
./logs.sh ollama

# Or directly
kubectl logs -f -l app=meowdel-web -n meowdel
```

### Check Status

```bash
# All pods
kubectl get pods -n meowdel

# Services
kubectl get svc -n meowdel

# Ingress
kubectl get ingress -n meowdel

# Full status
kubectl get all -n meowdel
```

### Scale Web App

```bash
# Manual scaling
kubectl scale deployment meowdel-web -n meowdel --replicas=5

# Check auto-scaling status
kubectl get hpa -n meowdel
```

### Update Deployment

```bash
# Update image
kubectl set image deployment/meowdel-web web=meowdel/web-app:v2 -n meowdel

# Watch rollout
kubectl rollout status deployment/meowdel-web -n meowdel
```

### Rollback

```bash
# Quick rollback
./rollback.sh

# Or manually
kubectl rollout undo deployment/meowdel-web -n meowdel

# Check history
kubectl rollout history deployment/meowdel-web -n meowdel
```

### Debug Pod

```bash
# Shell into web app
kubectl exec -it deployment/meowdel-web -n meowdel -- /bin/sh

# Shell into postgres
kubectl exec -it deployment/postgres -n meowdel -- psql -U meowdel

# Shell into redis
kubectl exec -it deployment/redis -n meowdel -- redis-cli
```

### Check Health

```bash
# Port forward to test locally
kubectl port-forward -n meowdel svc/meowdel-web-service 3000:80

# Then visit
curl http://localhost:3000/api/ai/health
```

## GPU Support (Optional)

### Enable GPU for Ollama

1. Ensure your cluster has GPU nodes
2. Install NVIDIA device plugin:

```bash
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.0/nvidia-device-plugin.yml
```

3. Uncomment GPU sections in `ollama-deployment.yaml`:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1  # Uncomment this

nodeSelector:
  gpu: "true"  # Uncomment this section
```

4. Redeploy:

```bash
kubectl apply -f ollama-deployment.yaml
```

## Monitoring & Observability

### Install Prometheus & Grafana (Optional)

```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Default credentials: admin / prom-operator

### Useful Metrics

- Request rate
- Response times
- Pod CPU/memory usage
- AI model usage (local vs Claude)
- Cost savings

## Troubleshooting

### Pod Won't Start

```bash
# Check events
kubectl describe pod <pod-name> -n meowdel

# Check logs
kubectl logs <pod-name> -n meowdel

# Check previous logs if crashed
kubectl logs <pod-name> -n meowdel --previous
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -n meowdel -- psql -h postgres-service -U meowdel

# Check database logs
kubectl logs -l app=postgres -n meowdel
```

### Ollama Not Loading Models

```bash
# Check Ollama logs
kubectl logs -l app=ollama -n meowdel

# Check model init job
kubectl logs job/ollama-model-init -n meowdel

# Manually pull models
kubectl exec -it deployment/ollama -n meowdel -- ollama pull llama3.2:3b
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress meowdel-ingress -n meowdel

# Check NGINX ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Verify DNS
nslookup meowdel.ai
```

## Resource Requirements

### Minimum

- 4 CPU cores
- 8 GB RAM
- 50 GB disk

### Recommended

- 8 CPU cores
- 16 GB RAM
- 100 GB disk
- GPU (optional, for faster Ollama)

### Per Component

| Component | CPU (request/limit) | Memory (request/limit) |
|-----------|---------------------|------------------------|
| Web App   | 500m / 2000m       | 512Mi / 2Gi           |
| PostgreSQL| 250m / 1000m       | 256Mi / 1Gi           |
| Redis     | 100m / 500m        | 128Mi / 512Mi         |
| Ollama    | 2000m / 4000m      | 4Gi / 8Gi             |

## Security

### Best Practices

1. **Secrets Management**
   - Use external secrets operator
   - Rotate secrets regularly
   - Never commit secrets to git

2. **Network Policies**
   - Restrict pod-to-pod communication
   - Only allow necessary ingress

3. **RBAC**
   - Use service accounts
   - Principle of least privilege

4. **TLS**
   - Always use HTTPS
   - Auto-renew certificates with cert-manager

### Network Policy Example

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: meowdel-web-policy
  namespace: meowdel
spec:
  podSelector:
    matchLabels:
      app: meowdel-web
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
        - podSelector:
            matchLabels:
              app: redis
        - podSelector:
            matchLabels:
              app: ollama
```

## Cost Optimization

### Right-Sizing

Monitor actual usage and adjust:

```bash
# Check resource usage
kubectl top pods -n meowdel
kubectl top nodes
```

Adjust resources in deployment files accordingly.

### Spot Instances

Use spot/preemptible instances for non-critical workloads:

```yaml
spec:
  tolerations:
    - key: "node.kubernetes.io/spot"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
```

### Ollama Savings

With hybrid AI:
- **70-90% cost reduction** on AI inference
- Local models handle simple tasks
- Claude for complex reasoning only

## Backup & Disaster Recovery

### Database Backup

```bash
# Create backup
kubectl exec deployment/postgres -n meowdel -- pg_dump -U meowdel meowdel > backup.sql

# Restore backup
kubectl exec -i deployment/postgres -n meowdel -- psql -U meowdel meowdel < backup.sql
```

### Automated Backups

Use a CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: meowdel
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15-alpine
              command:
                - /bin/sh
                - -c
                - pg_dump -h postgres-service -U meowdel meowdel > /backup/db_$(date +%Y%m%d).sql
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: meowdel-secrets
                      key: POSTGRES_PASSWORD
          restartPolicy: OnFailure
```

## Cleanup

### Remove Everything

```bash
# Interactive (safe)
./destroy.sh

# Force delete (dangerous!)
kubectl delete namespace meowdel --force --grace-period=0
```

## Support

### Get Help

```bash
# All resources in namespace
kubectl get all -n meowdel

# Describe problematic resource
kubectl describe <resource> <name> -n meowdel

# View events
kubectl get events -n meowdel --sort-by='.lastTimestamp'
```

### Useful Commands Cheat Sheet

```bash
# Quick status
kubectl get pods -n meowdel

# Follow logs
./logs.sh web

# Restart deployment
kubectl rollout restart deployment/meowdel-web -n meowdel

# Scale up
kubectl scale deployment/meowdel-web -n meowdel --replicas=5

# Update image
kubectl set image deployment/meowdel-web web=meowdel/web-app:v2 -n meowdel

# Port forward
kubectl port-forward -n meowdel svc/meowdel-web-service 3000:80

# Shell into pod
kubectl exec -it deployment/meowdel-web -n meowdel -- /bin/sh

# Delete pod (will auto-recreate)
kubectl delete pod <pod-name> -n meowdel
```

## What's Next?

- [ ] Setup monitoring with Prometheus/Grafana
- [ ] Configure automated backups
- [ ] Setup CI/CD pipeline
- [ ] Add network policies
- [ ] Configure external secrets
- [ ] Setup logging with ELK/Loki
- [ ] Add more comprehensive tests
- [ ] Configure autoscaling policies

---

## 🎉 You Did It!

Meowdel is now running on Kubernetes!

*Happy purring from your DevOps cat!* 🐱✨

**Need help?** Check the logs, describe the resources, and debug like a cat - curious and persistent!

*Paw bump!* 🐾

# 🚀 Meowdel Deployment Guide

*meow* Ready to share Meowdel with the world? Let's deploy! 🐱

## Pre-Deployment Checklist

- [ ] Built and tested locally
- [ ] Environment variables configured
- [ ] Domain DNS configured (if deploying web app)
- [ ] Anthropic API key ready (optional, for real Claude integration)

## Deploying the Web App

### Option 1: Vercel (Recommended - Easiest!)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd web-app
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add ANTHROPIC_API_KEY production
   vercel env add NEXT_PUBLIC_SITE_URL production
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Configure Domain**
   - Go to Vercel dashboard
   - Add `meowdel.ai` as custom domain
   - Update DNS:
     - Add CNAME: `www` → `cname.vercel-dns.com`
     - Add A record: `@` → Vercel IP (shown in dashboard)

### Option 2: Docker

1. **Build the Image**
   ```bash
   cd web-app
   docker build -t meowdel-web:latest .
   ```

2. **Run Locally to Test**
   ```bash
   docker run -p 3000:3000 \
     -e ANTHROPIC_API_KEY=your_key \
     -e NEXT_PUBLIC_SITE_URL=https://meowdel.ai \
     meowdel-web:latest
   ```

3. **Deploy to Production**

   **Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   **Push to Registry:**
   ```bash
   docker tag meowdel-web:latest us-ashburn-1.ocir.io/yournamespace/meowdel-web:latest
   docker push us-ashburn-1.ocir.io/yournamespace/meowdel-web:latest
   ```

### Option 3: OCI Container Instances

1. **Build and Push**
   ```bash
   docker build -t us-ashburn-1.ocir.io/yournamespace/meowdel-web:latest web-app/
   docker push us-ashburn-1.ocir.io/yournamespace/meowdel-web:latest
   ```

2. **Create Container Instance**
   ```bash
   oci container-instances container-instance create \
     --compartment-id YOUR_COMPARTMENT_ID \
     --availability-domain YOUR_AD \
     --shape CI.Standard.E4.Flex \
     --containers '[{
       "imageUrl": "us-ashburn-1.ocir.io/yournamespace/meowdel-web:latest",
       "displayName": "meowdel-web"
     }]'
   ```

3. **Configure Load Balancer**
   - Point to container instance
   - Configure SSL certificate
   - Set up health checks

## Deploying the MCP Server

The MCP server runs locally on users' machines through Claude Desktop.

### Publish to npm (Optional)

1. **Prepare Package**
   ```bash
   cd mcp-server
   npm run build
   ```

2. **Publish**
   ```bash
   npm publish --access public
   ```

3. **Users Install Via**
   ```bash
   npm install -g @meowdel/mcp-server
   ```

### Distribute as Binary (Alternative)

Using `pkg` to create standalone executables:

```bash
npm install -g pkg
cd mcp-server
pkg . --targets node20-macos-arm64,node20-linux-x64,node20-win-x64
```

## DNS Configuration

### For meowdel.ai

1. **A Records**
   ```
   @ → Your server IP or load balancer
   www → Your server IP or load balancer
   ```

2. **CNAME (if using Vercel/Netlify)**
   ```
   www → cname.vercel-dns.com (or your provider)
   ```

3. **SSL Certificate**
   - Let's Encrypt (automatic with Vercel)
   - Or OCI Certificates service
   - Or Cloudflare SSL

## Environment Variables

### Production

Required for web app:
```bash
ANTHROPIC_API_KEY=sk-ant-... # Optional, for real Claude integration
NEXT_PUBLIC_SITE_URL=https://meowdel.ai
NODE_ENV=production
```

## Monitoring & Maintenance

### Web App

- **Logs**: Check Vercel dashboard or Docker logs
- **Errors**: Monitor console for errors
- **Analytics**: Add Vercel Analytics or Google Analytics

### Health Check Endpoint

Create `app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    meow: true,
    timestamp: new Date().toISOString()
  });
}
```

## Scaling

### Auto-scaling on Vercel
- Automatic based on traffic
- No configuration needed!

### Docker/OCI
- Set up Kubernetes cluster
- Configure horizontal pod autoscaling
- Use load balancer

## Rollback Plan

### Vercel
```bash
vercel rollback
```

### Docker
```bash
docker-compose down
docker-compose up -d --force-recreate --build
```

## Security Checklist

- [ ] Environment variables secured (not in code)
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled (if using API routes)
- [ ] No API keys in client-side code
- [ ] Dependencies updated and audited

## Cost Estimates

### Vercel (Hobby Plan)
- FREE for personal projects
- Includes SSL, CDN, analytics
- Upgrade to Pro ($20/mo) for custom domain + team features

### OCI
- Container Instances: ~$30-50/month
- Load Balancer: ~$10/month
- DNS: FREE

### Anthropic API (Optional)
- Pay-per-use based on tokens
- Estimate ~$1-10/month for moderate use

## Post-Deployment

1. **Test Everything**
   ```bash
   curl https://meowdel.ai/api/health
   ```

2. **Monitor First 24 Hours**
   - Check error rates
   - Monitor performance
   - Watch for issues

3. **Share with the World!**
   - Tweet about it! 🐦
   - Post on Reddit
   - Show your friends
   - Let Meowdel meet new humans! *meow*

---

*purr* Your Meowdel is now live! 🎉🐱

Need help? Check the logs, or meow at us in the issues!

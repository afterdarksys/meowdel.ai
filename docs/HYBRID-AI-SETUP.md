# Hybrid AI System Setup Guide

## Overview

Meowdel now uses a **hybrid AI architecture** that intelligently routes between:
- **Local models** (Ollama) - Free, fast, good for simple tasks
- **Claude API** - Premium, powerful, for complex reasoning

This saves significant AI costs while maintaining quality! 🐱💰

## Architecture

```
User Message
    ↓
Hybrid Router (analyzes complexity)
    ↓
    ├──→ [SIMPLE] → Ollama (local, free)
    │    - Greetings
    │    - Simple questions
    │    - Context analysis
    │    - Conversation summarization
    │
    └──→ [COMPLEX] → Claude (cloud, paid)
         - Code generation
         - Debugging
         - Multi-turn reasoning
         - Architecture design
```

## Cost Savings

Example monthly usage (1000 conversations):
- **All Claude**: ~$90/month
- **Hybrid (70% local)**: ~$27/month
- **Savings**: $63/month (70% reduction!) 🎉

## Installation

### 1. Install Ollama

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

**Docker:**
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### 2. Pull Recommended Models

```bash
# Fast model for chat and context (1.9GB)
ollama pull llama3.2:3b

# Better for code understanding (4.1GB)
ollama pull mistral:7b
```

**Alternative Models:**
```bash
# Even smaller, faster (1.4GB)
ollama pull llama3.2:1b

# Larger, more capable (8GB)
ollama pull llama3.1:8b
```

### 3. Verify Installation

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Test a model
ollama run llama3.2:3b "Hello, I'm a cat!"
```

### 4. Check API Health

Visit: http://localhost:3000/api/ai/health

You should see:
```json
{
  "status": "operational",
  "services": {
    "ollama": {
      "available": true,
      "models": ["llama3.2:3b", "mistral:7b"]
    },
    "claude": {
      "available": true
    }
  }
}
```

## Environment Configuration

Add to `.env`:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# For remote Ollama instance:
# OLLAMA_BASE_URL=http://your-server:11434
```

## How Routing Works

The `HybridAIRouter` analyzes each request and decides which model to use:

### Routes to **Local (Ollama)** when:
- ✅ Simple questions without code
- ✅ Greetings/casual chat
- ✅ Context analysis tasks
- ✅ Conversation summarization
- ✅ User is on Free/Purr tier (cost savings)

### Routes to **Claude** when:
- ⚡ Complex code generation
- ⚡ Error debugging
- ⚡ Multi-turn reasoning needed
- ⚡ Architecture design questions
- ⚡ User is on Roar tier (premium quality)

### Automatic Fallback:
If Ollama is unavailable, all requests automatically route to Claude.

## Model Recommendations by Use Case

| Use Case | Recommended Model | Size | Speed |
|----------|------------------|------|-------|
| Chat & Context | llama3.2:3b | 1.9GB | ⚡⚡⚡ |
| Code Understanding | mistral:7b | 4.1GB | ⚡⚡ |
| Fast Responses | llama3.2:1b | 1.4GB | ⚡⚡⚡⚡ |
| Complex Tasks | llama3.1:8b | 8GB | ⚡ |

## Conversation Features Enabled

### 1. **Conversation Memory**
- Messages saved to database
- Full conversation history
- Cross-session continuity

### 2. **Context Tracking**
- Topics discussed
- User emotion detection
- Problem-solving phase
- Expertise level detection

### 3. **Proactive Engagement**
- Asks follow-up questions
- Checks understanding
- Suggests next steps

### 4. **Multi-turn Reasoning**
- Breaks down complex problems
- Tracks reasoning steps
- Methodical problem solving

### 5. **Automatic Summarization**
- Summarizes long conversations
- Extracts key decisions
- Tracks action items

## Database Setup

Run migrations to create new tables:

```bash
# Using Drizzle
npx drizzle-kit push

# Or generate migration
npx drizzle-kit generate
npx drizzle-kit migrate
```

**New Tables:**
- `conversation_context` - Topic tracking, emotions, problem-solving state
- `conversation_summaries` - Automatic summarization
- `conversation_reasoning_steps` - Multi-turn reasoning tracking

## Testing

### Test Local Model
```bash
curl -X POST http://localhost:3000/api/pets/meowdel/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "userId": "test-user",
    "userTier": "free"
  }'
```

Response should show: `"modelUsed": "local"`

### Test Claude Routing
```bash
curl -X POST http://localhost:3000/api/pets/meowdel/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Debug this error: TypeError: Cannot read property x of undefined",
    "userId": "test-user",
    "userTier": "meow"
  }'
```

Response should show: `"modelUsed": "claude"`

## Monitoring

### Check AI Health
```bash
curl http://localhost:3000/api/ai/health
```

### View Ollama Logs
```bash
# macOS
tail -f ~/Library/Logs/Ollama/server.log

# Linux
sudo journalctl -u ollama -f

# Docker
docker logs -f ollama
```

### Monitor Costs
The API response includes cost estimates:
```json
{
  "modelUsed": "claude",
  "estimatedCost": 0.0045
}
```

## Troubleshooting

### "Ollama is not available"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama (macOS)
ollama serve

# Restart Ollama service (Linux)
sudo systemctl restart ollama
```

### "No models found"
```bash
# List installed models
ollama list

# Pull a model
ollama pull llama3.2:3b
```

### Slow Responses
```bash
# Use smaller model
ollama pull llama3.2:1b

# Check system resources
ollama ps
```

### High Memory Usage
```bash
# Unload unused models
ollama stop llama3.1:8b

# Or use smaller models
ollama pull llama3.2:3b  # Instead of 8b
```

## Performance Tuning

### GPU Acceleration
Ollama automatically uses GPU if available (NVIDIA/AMD/Metal).

Check GPU usage:
```bash
# NVIDIA
nvidia-smi

# macOS Metal
ollama ps
```

### Model Selection Strategy

**Development:**
- Use `llama3.2:1b` for speed
- Fast iteration, good enough for testing

**Production:**
- Use `llama3.2:3b` for balance
- Good quality, reasonable speed

**Premium Users:**
- Route directly to Claude
- Best quality, skip local models

## Advanced Configuration

### Custom Routing Logic

Edit `/lib/ai/hybrid-router.ts`:

```typescript
// Increase free tier local usage
if (userTier === 'free') {
  return { model: 'local', ... }
}

// Always use Claude for employees
if (isEmployee) {
  return { model: 'claude', ... }
}
```

### Multiple Ollama Instances

Load balance across multiple Ollama servers:

```typescript
// In ollama-client.ts
const OLLAMA_SERVERS = [
  'http://localhost:11434',
  'http://ollama-2:11434',
  'http://ollama-3:11434',
]

// Round-robin or least-loaded selection
```

## Production Deployment

### Docker Compose

```yaml
services:
  ollama:
    image: ollama/ollama
    volumes:
      - ollama:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  web-app:
    build: .
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: ollama
        image: ollama/ollama
        resources:
          limits:
            nvidia.com/gpu: 1
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
spec:
  ports:
  - port: 11434
```

## Cost Analysis

### Sample Usage Pattern (1000 requests/day)

**Scenario 1: All Claude**
- 1000 requests × 500 tokens avg × $0.003/1K tokens
- Cost: $1.50/day = **$45/month**

**Scenario 2: 70% Local, 30% Claude**
- 700 requests × 0 (free)
- 300 requests × 500 tokens × $0.003/1K tokens
- Cost: $0.45/day = **$13.50/month**
- **Savings: 70% ($31.50/month)**

**Scenario 3: 90% Local, 10% Claude** (free tier users)
- 900 requests × 0 (free)
- 100 requests × 500 tokens × $0.003/1K tokens
- Cost: $0.15/day = **$4.50/month**
- **Savings: 90% ($40.50/month)**

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull recommended models
3. ✅ Run database migrations
4. ✅ Test health endpoint
5. ✅ Monitor cost savings
6. 🎉 Enjoy smart, cost-effective AI!

## Support

- **Ollama Docs**: https://ollama.com/docs
- **Model Library**: https://ollama.com/library
- **GitHub Issues**: Report bugs and feature requests

---

*Happy chatting! 🐱✨*

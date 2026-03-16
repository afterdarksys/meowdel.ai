# Published Meowdel SDKs

Official client libraries for the Meowdel AI API, published and ready for use.

## Python SDK v0.1.0

**Published:** March 16, 2026

**PyPI Package:**
- URL: https://pypi.org/project/meowdel/0.1.0/
- Install: `pip install meowdel`

**GitHub Repository:**
- URL: https://github.com/straticus1/meowdel-python
- Tag: v0.1.0

**Installation:**
```bash
pip install meowdel
```

**Quick Start:**
```python
from meowdel import MeowdelClient

client = MeowdelClient(api_key="mdl_your_key")
response = client.chat("How do I fix this bug?")
print(response.message)
```

**Features:**
- Type hints and dataclasses
- Automatic retries with exponential backoff
- Context manager support
- Comprehensive error handling
- Environment variable configuration

---

## Go SDK v0.1.0

**Published:** March 16, 2026

**pkg.go.dev:**
- URL: https://pkg.go.dev/github.com/straticus1/meowdel-go@v0.1.0
- Install: `go get github.com/straticus1/meowdel-go@v0.1.0`

**GitHub Repository:**
- URL: https://github.com/straticus1/meowdel-go
- Tag: v0.1.0

**Installation:**
```bash
go get github.com/straticus1/meowdel-go@v0.1.0
```

**Quick Start:**
```go
import "github.com/straticus1/meowdel-go/meowdel"

client, _ := meowdel.NewClient(&meowdel.Config{
    APIKey: "mdl_your_key",
})
resp, _ := client.Chat(&meowdel.ChatRequest{
    Message: "What is a goroutine?",
})
fmt.Println(resp.Message)
```

**Features:**
- Idiomatic Go design
- Custom error types
- Configurable timeouts
- Built-in health checks
- Zero dependencies (except stdlib)

---

## Common Features

All SDKs support:
- ✅ Chat API (`/api/v1/chat`)
- ✅ Combine operations API (`/api/v1/combine`)
- ✅ Multiple AI personalities (mittens, luna, professor, ninja, zoomies)
- ✅ Brain knowledge graph context
- ✅ Conversation history
- ✅ API key authentication
- ✅ Error handling
- ✅ Health checks

---

## Getting API Keys

1. Sign up at https://meowdel.ai
2. Go to https://meowdel.ai/profile
3. Generate an API key
4. Set environment variable: `export MEOWDEL_API_KEY=mdl_your_key`

---

## Node.js/TypeScript SDK

Available in the CLI tool at `cli/src/api/`

For standalone use:
```typescript
import { createApiClient, chatRequest } from '@meowdel/sdk'

const response = await chatRequest("Hello", {
    personality: "mittens"
})
```

---

## Publishing Notes

- Python SDK uses setup.py for PyPI compatibility (pyproject.toml backed up)
- Go SDK automatically indexed by pkg.go.dev on tag push
- Both repos are public on GitHub
- Version tags follow semantic versioning (v0.1.0)

---

## Future Updates

To publish new versions:

1. Update version in source files
2. Commit changes
3. Tag new version: `git tag v0.x.x && git push origin v0.x.x`
4. Python: Rebuild and upload to PyPI: `python3 setup.py sdist bdist_wheel && twine upload dist/*`
5. Go: Trigger pkg.go.dev: `curl "https://proxy.golang.org/github.com/straticus1/meowdel-go/@v/v0.x.x.info"`

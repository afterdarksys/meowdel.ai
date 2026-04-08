# Meowdel SDKs

Official client libraries for the Meowdel AI API in multiple languages.

## Available SDKs

### Python SDK (`sdk/python/`)

```bash
cd sdk/python
pip install -e .
```

**Usage:**
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

### Go SDK (`sdk/go/`)

```bash
go get github.com/afterdarksystems/meowdel-go
```

**Usage:**
```go
import "github.com/afterdarksystems/meowdel-go/meowdel"

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

### Node.js/TypeScript SDK (`cli/src/api/`)

Available in the CLI tool. For standalone use:

```typescript
import { createApiClient, chatRequest } from '@meowdel/sdk'

const response = await chatRequest("Hello", {
    personality: "mittens"
})
```

## Common Features

All SDKs support:
- ✅ Chat API (`/api/v1/chat`)
- ✅ Combine operations API (`/api/v1/combine`)
- ✅ Multiple AI personalities
- ✅ Brain knowledge graph context
- ✅ Conversation history
- ✅ API key authentication
- ✅ Error handling
- ✅ Health checks

## Getting Your API Key

1. Sign up at https://meowdel.ai
2. Go to https://meowdel.ai/profile
3. Generate an API key
4. Set environment variable: `export MEOWDEL_API_KEY=mdl_your_key`

## Examples

See the `examples/` directory in each SDK for complete working examples:

- Python: `sdk/python/examples/`
- Go: `sdk/go/examples/`

## Documentation

- API Docs: https://docs.meowdel.ai
- Python SDK: `sdk/python/README.md`
- Go SDK: `sdk/go/README.md`

## License

MIT

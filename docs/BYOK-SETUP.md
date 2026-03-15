# Bring Your Own Keys (BYOK) Setup Guide

This guide explains how to set up and use the BYOK feature in Meowdel, allowing users to bring their own AI provider API keys.

## Overview

BYOK allows logged-in users to:
- Store their own API keys for AI providers (Anthropic, AWS Bedrock, GCP Vertex AI, Azure OpenAI, Oracle)
- Use their keys instead of the shared pool
- Manage multiple keys per provider
- Validate keys before use
- Track usage statistics

## Security Features

- **AES-256-GCM Encryption**: All API keys are encrypted before storage
- **Master Key**: Uses environment variable for encryption key derivation
- **Secure Storage**: Keys are never logged or exposed in responses
- **Per-User Isolation**: Users can only access their own keys
- **Audit Trail**: Key usage is tracked for security and analytics

## Setup Instructions

### 1. Generate Encryption Master Key

Generate a secure master key for encrypting API keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a 64-character hexadecimal string like:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 2. Set Environment Variables

Add the encryption master key to your `.env` file:

```bash
# BYOK Encryption
ENCRYPTION_MASTER_KEY=your_generated_key_here_64_chars_minimum
```

**IMPORTANT**:
- Keep this key secure and never commit it to version control
- If you lose this key, all encrypted API keys will be unrecoverable
- Use a different key for each environment (dev, staging, prod)
- The key must be at least 32 characters long

### 3. Run Database Migrations

Apply the database schema changes:

```bash
cd web-app
npx drizzle-kit push
```

This will create the `user_provider_keys` table.

### 4. Verify Setup

Test that encryption is working:

```bash
# In your Node.js environment
node -e "
const { validateEncryptionSetup } = require('./lib/encryption');
try {
  validateEncryptionSetup();
  console.log('✅ Encryption setup is valid');
} catch (error) {
  console.error('❌ Encryption setup failed:', error.message);
}
"
```

## User Guide

### Accessing BYOK Settings

1. Log in to Meowdel
2. Navigate to Settings (`/settings`)
3. Find the "Bring Your Own Keys (BYOK)" section

### Adding an API Key

1. Click "Add API Key"
2. Select the provider (e.g., Anthropic)
3. Enter a friendly name (e.g., "Production Key", "Personal")
4. Paste your API key
5. (Optional) Configure region/endpoint for cloud providers
6. (Optional) Set as default key for this provider
7. Click "Add Key"

### Validating a Key

1. Find your key in the list
2. Click "Validate"
3. The system will make a test request to verify the key works
4. Status will update to "valid" or "invalid"

### Managing Keys

- **Enable/Disable**: Temporarily deactivate a key without deleting it
- **Set as Default**: Choose which key to use when you have multiple for one provider
- **Delete**: Permanently remove a key

### Key Usage

Once you have a valid API key configured:
- Meowdel will automatically use your key when making requests
- You'll see "user's key (BYOK)" in the logs instead of cost estimates
- Usage statistics are tracked per key

## Supported Providers

### Currently Implemented

- **Anthropic (Claude)**: ✅ Fully supported
  - Validation: Yes
  - Used in chat automatically: Yes

### Planned

- **AWS Bedrock**: 🚧 Schema ready, integration pending
- **GCP Vertex AI**: 🚧 Schema ready, integration pending
- **Azure OpenAI**: 🚧 Schema ready, integration pending
- **Oracle Generative AI**: 🚧 Schema ready, integration pending

## API Reference

### Endpoints

- `GET /api/user/provider-keys` - List all keys
- `POST /api/user/provider-keys` - Add a new key
- `PATCH /api/user/provider-keys/[keyId]` - Update a key
- `DELETE /api/user/provider-keys/[keyId]` - Delete a key
- `POST /api/user/provider-keys/[keyId]/validate` - Validate a key

### Database Schema

```sql
CREATE TABLE user_provider_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50), -- 'anthropic', 'aws_bedrock', etc.
  key_name VARCHAR(255),
  encrypted_key TEXT, -- AES-256-GCM encrypted
  key_prefix VARCHAR(10), -- First 8 chars for display
  region VARCHAR(50),
  endpoint TEXT,
  model_preferences JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  last_validated_at TIMESTAMP,
  validation_status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Best Practices

### For System Administrators

1. **Rotate Encryption Keys**: Plan for key rotation
   - Store old keys for decryption of existing data
   - Implement re-encryption process when rotating

2. **Backup Strategy**:
   - Backup encryption keys separately from database
   - Use a key management service (KMS) for production

3. **Monitor Usage**:
   - Track validation failures
   - Alert on suspicious key usage patterns
   - Monitor for key exfiltration attempts

4. **Access Control**:
   - Limit access to `ENCRYPTION_MASTER_KEY`
   - Use environment-specific keys
   - Never log decrypted keys

### For Users

1. **API Key Security**:
   - Never share your API keys
   - Use separate keys for different applications
   - Rotate keys periodically
   - Delete unused keys

2. **Validation**:
   - Always validate keys after adding them
   - Re-validate if you see unexpected errors
   - Check validation status regularly

## Troubleshooting

### "ENCRYPTION_MASTER_KEY environment variable is not set"

**Solution**: Add `ENCRYPTION_MASTER_KEY` to your `.env` file

### "ENCRYPTION_MASTER_KEY must be at least 32 characters long"

**Solution**: Generate a new key using the command in step 1 above

### "Decryption failed"

**Possible causes**:
- Encryption key changed (old keys can't be decrypted)
- Corrupted encrypted data
- Database migration issue

**Solution**: Delete and re-add the affected API keys

### "Validation failed: Invalid API key"

**Possible causes**:
- Wrong API key copied
- Key has been revoked by the provider
- Insufficient permissions on the key

**Solution**:
1. Check your API key with the provider
2. Generate a new key if needed
3. Update the key in Meowdel settings

### Keys not being used in chat

**Check**:
1. Is the key active? (not disabled)
2. Is the key validated? (status should be "valid")
3. Are you logged in? (BYOK only works for authenticated users)
4. Check browser console and server logs for errors

## Development

### Testing Encryption

```typescript
import { encrypt, decrypt, generateMasterKey } from '@/lib/encryption'

// Generate a test key
const masterKey = generateMasterKey()
console.log('Master key:', masterKey)

// Test encryption/decryption
const plaintext = 'sk-ant-api03-test-key'
const encrypted = encrypt(plaintext)
console.log('Encrypted:', encrypted)

const decrypted = decrypt(encrypted)
console.log('Decrypted:', decrypted)
console.log('Match:', plaintext === decrypted)
```

### Adding a New Provider

1. Add provider to `SUPPORTED_PROVIDERS` in `/app/api/user/provider-keys/route.ts`
2. Add provider label to `PROVIDER_LABELS` in `/components/settings/ProviderKeysManager.tsx`
3. Implement validation function in `/app/api/user/provider-keys/[keyId]/validate/route.ts`
4. Update chat route or add new integration point to use the provider

## Future Enhancements

- [ ] Key rotation UI
- [ ] Key expiration reminders
- [ ] Usage analytics dashboard
- [ ] Rate limiting per key
- [ ] Key sharing within teams
- [ ] External KMS integration
- [ ] Audit log viewer
- [ ] Cost tracking per key
- [ ] Model preferences per provider
- [ ] Webhook notifications for key issues

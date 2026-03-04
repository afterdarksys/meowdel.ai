# PostgreSQL Database Setup for BrowserID

The BrowserID system has been migrated from in-memory storage to PostgreSQL for production-ready persistence.

## What Was Done

✅ Created database schema (`lib/db/schema.ts`)
✅ Created migration SQL (`drizzle/migrations/add_browserid_tables.sql`)
✅ Created database service layer (`lib/db/browserid.service.ts`)
✅ Updated all API routes to use PostgreSQL
✅ Added DATABASE_URL to Kubernetes deployment config

## Database Tables

The migration creates 4 tables:

1. **browserid_users** - Core user identification and cat personality data
2. **browserid_oauth_mappings** - Links BrowserIDs to OAuth accounts for cross-device sync
3. **browserid_conversations** - Chat history and sentiment tracking
4. **browserid_solved_problems** - Problems solved together with the AI Cat

## Setup Steps

### Option 1: Use Existing PostgreSQL Instance

If you already have a PostgreSQL instance (as mentioned), follow these steps:

1. **Get your PostgreSQL connection string**
   ```bash
   # Format: postgresql://user:password@host:port/database?sslmode=require
   # Example: postgresql://meowdel:pass@db.example.com:5432/meowdel?sslmode=require
   ```

2. **Add DATABASE_URL to your local .env**
   ```bash
   echo "DATABASE_URL=postgresql://your-connection-string" >> .env
   ```

3. **Run the migration**
   ```bash
   ./scripts/run-migration.sh
   ```

   Or manually:
   ```bash
   psql "$DATABASE_URL" -f drizzle/migrations/add_browserid_tables.sql
   ```

4. **Test locally**
   ```bash
   npm run build && npm start
   ```

### Option 2: Use Neon PostgreSQL (Serverless)

1. **Create a Neon project** at https://neon.tech
   - Free tier: 0.5 GB storage, 1 compute unit
   - Automatic scaling and branching

2. **Copy the connection string**
   - Go to your Neon dashboard
   - Copy the connection string (includes pooling)

3. **Add to .env**
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/meowdel?sslmode=require
   ```

4. **Run migration** (same as above)

### Option 3: Local PostgreSQL for Testing

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb meowdel

# Add to .env
DATABASE_URL=postgresql://localhost/meowdel

# Run migration
./scripts/run-migration.sh
```

## Production Deployment

### Update Kubernetes Secret

Edit `k8s-deployment.yaml` and replace the DATABASE_URL placeholder:

```yaml
stringData:
  DATABASE_URL: "postgresql://actual-connection-string"
```

### Apply the changes

```bash
kubectl apply -f k8s-deployment.yaml
```

Or use the deploy script if available:
```bash
./deploy-k8s.sh
```

## Verification

After running the migration, verify the tables exist:

```bash
psql "$DATABASE_URL" -c "\dt"
```

Should show:
```
 browserid_users
 browserid_oauth_mappings
 browserid_conversations
 browserid_solved_problems
```

## What's Next

1. Set up your DATABASE_URL (choose option above)
2. Run the migration
3. Test locally
4. Deploy to production

The BrowserID system will automatically:
- Track returning users across sessions
- Persist cat personality preferences
- Sync data across devices when OAuth is linked
- Store conversation history and solved problems

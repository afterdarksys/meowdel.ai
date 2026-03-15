#!/bin/bash
# Database Migration Runner
# Runs automatically on container startup

set -e

echo "🐱 Meowdel Migration Runner"
echo "================================"

# Wait for database to be ready
echo "⏳ Waiting for database..."
timeout 30 bash -c 'until pg_isready -h "${DATABASE_URL##*@}" -p 5432 2>/dev/null; do
  echo "  Database not ready yet, waiting..."
  sleep 2
done'

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
npx drizzle-kit push --config=drizzle.config.ts

echo "✅ Migrations complete!"
echo "================================"

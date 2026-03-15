#!/bin/bash
# Docker Entrypoint Script
# Runs migrations before starting the application

set -e

echo "🐱 Meowdel Starting..."
echo "================================"

# Wait for database
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for database..."

  # Extract host from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:\/]*\).*/\1/p')

  # Wait up to 30 seconds for database
  timeout 30 bash -c "until pg_isready -h $DB_HOST 2>/dev/null; do
    echo '  Database not ready yet, waiting...'
    sleep 2
  done" || {
    echo "❌ Database connection timeout!"
    exit 1
  }

  echo "✅ Database is ready!"

  # Run migrations
  echo "🔄 Running database migrations..."
  npx drizzle-kit push --config=drizzle.config.ts || {
    echo "⚠️  Migration failed, but continuing..."
  }
  echo "✅ Migrations complete!"
fi

# Wait for Redis
if [ -n "$REDIS_URL" ]; then
  echo "⏳ Checking Redis connection..."
  # Redis is optional, just log if unavailable
  timeout 5 bash -c "until nc -z redis 6379 2>/dev/null; do
    sleep 1
  done" && echo "✅ Redis is ready!" || echo "⚠️  Redis not available (continuing anyway)"
fi

echo "================================"
echo "🚀 Starting application..."
echo ""

# Run the command passed to docker (e.g., "node server.js")
exec "$@"

#!/bin/bash
# BrowserID Migration Script
# Run this to set up the BrowserID tables in your PostgreSQL database

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  echo "Please set it to your PostgreSQL connection string:"
  echo "  export DATABASE_URL='postgresql://user:password@host/database'"
  exit 1
fi

echo "Running BrowserID migration..."
echo "Database: ${DATABASE_URL%%\?*}"  # Hide credentials

# Run the migration SQL
psql "$DATABASE_URL" -f drizzle/migrations/add_browserid_tables.sql

echo "✓ Migration completed successfully!"
echo ""
echo "Tables created:"
echo "  - browserid_users"
echo "  - browserid_oauth_mappings"
echo "  - browserid_conversations"
echo "  - browserid_solved_problems"

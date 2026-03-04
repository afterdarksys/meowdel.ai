#!/bin/bash

# Meowdel Deployment Script
# *meow* Let's deploy this thing! 🐱

set -e

echo "🐱 Starting Meowdel deployment..."
echo ""

# Function to print cat-themed messages
cat_message() {
    echo "😸 $1"
}

# Choose deployment type
echo "Which component do you want to deploy?"
echo "1) Web App (Next.js)"
echo "2) MCP Server"
echo "3) Both"
read -p "Enter choice [1-3]: " choice

case $choice in
    1|3)
        cat_message "Deploying Web App... *purr*"
        cd web-app

        # Check if .env exists
        if [ ! -f .env ]; then
            cat_message "No .env file found! Copy .env.example and configure it first!"
            cat_message "cp .env.example .env"
            exit 1
        fi

        # Build the app
        cat_message "Building Next.js app... *kneads paws*"
        npm install
        npm run build

        # Ask for deployment method
        echo ""
        echo "How do you want to deploy?"
        echo "1) Vercel (recommended)"
        echo "2) Docker"
        echo "3) Just build (manual deployment)"
        read -p "Enter choice [1-3]: " deploy_method

        case $deploy_method in
            1)
                cat_message "Deploying to Vercel... *tail swish*"
                npx vercel --prod
                ;;
            2)
                cat_message "Building Docker image... *swats at keyboard*"
                docker build -t meowdel-web .
                cat_message "Run with: docker run -p 3000:3000 --env-file .env meowdel-web"
                ;;
            3)
                cat_message "Build complete! Deploy the .next folder manually"
                ;;
        esac

        cd ..
        ;;
esac

case $choice in
    2|3)
        cat_message "Building MCP Server... *mrrp*"
        cd mcp-server
        npm install
        npm run build

        cat_message "MCP Server built successfully!"
        cat_message "Add to Claude Desktop config:"
        echo ""
        echo '{
  "mcpServers": {
    "meowdel": {
      "command": "node",
      "args": ["'$(pwd)'/dist/index.js"]
    }
  }
}'
        echo ""
        cd ..
        ;;
esac

echo ""
cat_message "Deployment complete! *purr purr*"
cat_message "Time for a nap! 😴🐱"

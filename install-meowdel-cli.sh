#!/bin/bash
# Meowdel CLI Installation Script

set -e

echo "🐱 Installing Meowdel CLI..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -r "$SCRIPT_DIR/requirements-cli.txt"

echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check API key
echo ""
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set${NC}"
    echo ""
    echo "To use Meowdel CLI, you need to set your Anthropic API key:"
    echo ""
    echo "  export ANTHROPIC_API_KEY='your-api-key-here'"
    echo ""
    echo "Add it to your shell profile (~/.zshrc or ~/.bashrc) to make it permanent:"
    echo ""
    echo "  echo 'export ANTHROPIC_API_KEY=\"your-key\"' >> ~/.zshrc"
    echo "  source ~/.zshrc"
    echo ""
else
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${NC}"
fi

# Create history directory
HISTORY_DIR="$HOME/.meowdel/history"
mkdir -p "$HISTORY_DIR"
echo -e "${GREEN}✓ Created history directory: $HISTORY_DIR${NC}"

# Ask about global installation
echo ""
echo "Would you like to install Meowdel globally? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Check if we can write to /usr/local/bin
    if [ -w "/usr/local/bin" ]; then
        ln -sf "$SCRIPT_DIR/meowdel" /usr/local/bin/meowdel
        echo -e "${GREEN}✓ Installed to /usr/local/bin/meowdel${NC}"
        echo ""
        echo "You can now run 'meowdel' from anywhere!"
    else
        echo ""
        echo "Run this command to install globally (requires sudo):"
        echo ""
        echo "  sudo ln -sf $SCRIPT_DIR/meowdel /usr/local/bin/meowdel"
        echo ""
    fi
else
    echo ""
    echo "You can run Meowdel with:"
    echo "  $SCRIPT_DIR/meowdel"
    echo ""
    echo "Or add to your PATH:"
    echo "  echo 'export PATH=\"$SCRIPT_DIR:\$PATH\"' >> ~/.zshrc"
    echo "  source ~/.zshrc"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Installation complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🐱 Try it out:"
echo ""
echo "  # Interactive mode"
echo "  meowdel"
echo ""
echo "  # Single question"
echo "  meowdel \"How do I center a div?\""
echo ""
echo "*meow* Happy coding! 🐱"
echo ""

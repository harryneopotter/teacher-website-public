#!/bin/bash
# Script to install pre-commit hooks for sensitive data protection
# Usage: bash .githooks/install.sh

set -e

echo "🔧 Installing pre-commit hooks..."

# Check if .githooks/pre-commit exists
if [ ! -f ".githooks/pre-commit" ]; then
    echo "❌ Error: .githooks/pre-commit not found"
    exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed at .git/hooks/pre-commit"

# Alternatively, configure Git to use .githooks directory
read -p "Do you want to configure Git to use .githooks directory for all hooks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git config core.hooksPath .githooks
    chmod +x .githooks/pre-commit
    echo "✅ Git configured to use .githooks directory"
    echo "   All hooks in .githooks will now be executed automatically"
fi

# Check for gitleaks installation
echo ""
echo "🔍 Checking for gitleaks installation..."
if command -v gitleaks &> /dev/null; then
    echo "✅ gitleaks is installed ($(gitleaks version))"
else
    echo "⚠️  gitleaks is not installed"
    echo ""
    echo "To install gitleaks:"
    echo "  • macOS: brew install gitleaks"
    echo "  • Linux: wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64"
    echo "           chmod +x gitleaks-linux-amd64"
    echo "           sudo mv gitleaks-linux-amd64 /usr/local/bin/gitleaks"
    echo "  • Windows: Download from https://github.com/gitleaks/gitleaks/releases"
    echo ""
    echo "The pre-commit hook will still run basic checks without gitleaks,"
    echo "but we strongly recommend installing it for comprehensive scanning."
fi

echo ""
echo "🎉 Setup complete! Your commits will now be checked for sensitive data."
echo ""
echo "To test the hook, try: git commit --allow-empty -m 'Test commit'"
echo "To bypass the hook (not recommended): git commit --no-verify"

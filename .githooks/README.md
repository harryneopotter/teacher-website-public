# Git Hooks for Security

This directory contains Git hooks to prevent committing sensitive data.

## Installation

Run the installation script:

```bash
bash .githooks/install.sh
```

This will:
1. Copy the pre-commit hook to `.git/hooks/`
2. Make it executable
3. Optionally configure Git to use `.githooks` for all hooks
4. Check for gitleaks installation

## Manual Installation

If you prefer to install manually:

```bash
# Copy the hook
cp .githooks/pre-commit .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit
```

Or configure Git to use this directory:

```bash
git config core.hooksPath .githooks
```

## What the Pre-commit Hook Does

The pre-commit hook performs the following checks before allowing a commit:

1. **Gitleaks Scan** (if installed): Runs a comprehensive scan for over 900 types of secrets and credentials
2. **Basic Pattern Matching**: Checks for common sensitive data patterns:
   - Passwords
   - API keys
   - Tokens
   - Private keys
   - Telegram bot tokens
   - Stripe keys
   - Google API keys

## Bypassing the Hook

If you need to bypass the hook (not recommended):

```bash
git commit --no-verify
```

**⚠️ Warning:** Only bypass the hook if you're absolutely certain the flagged content is not sensitive.

## False Positives

If the hook flags non-sensitive content:

1. For gitleaks: Add exceptions to `.gitleaks.toml`
2. For basic checks: The hook skips `.md` files and files with "example" in the name
3. Consider updating the hook script to add more specific allowlist rules

## Recommended Tools

### Gitleaks

Install gitleaks for comprehensive secret scanning:

```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64
chmod +x gitleaks-linux-amd64
sudo mv gitleaks-linux-amd64 /usr/local/bin/gitleaks

# Verify
gitleaks version
```

### Manual Scanning

Run a full repository scan at any time:

```bash
# Scan unstaged changes
gitleaks protect --verbose

# Scan entire history
gitleaks detect --verbose

# Scan with config
gitleaks detect --config .gitleaks.toml
```

## Troubleshooting

### Hook Not Running

Ensure the hook is executable:
```bash
chmod +x .git/hooks/pre-commit
```

Or check if hooks are disabled:
```bash
git config --get core.hooksPath
```

### Gitleaks Not Found

The hook will still run basic checks if gitleaks is not installed, but we strongly recommend installing it.

### Permission Denied

Make sure the scripts have execute permissions:
```bash
chmod +x .githooks/pre-commit
chmod +x .githooks/install.sh
```

## Additional Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Sensitive Data Removal Guide](../SENSITIVE_DATA_REMOVAL_GUIDE.md)

# 🔒 Removing Sensitive Data from Git History

This guide provides a comprehensive, step-by-step process for removing sensitive data (passwords, API keys, personal information, etc.) from your Git commit messages and repository history.

## ⚠️ Critical Warnings

Removing sensitive data from commit messages requires **rewriting the repository's history**. This is a **destructive action** that changes commit hashes for all subsequent commits.

### Before You Begin

- **📦 Backup First:** Create a full backup of your repository before starting
- **👥 Coordinate with Team:** All collaborators must delete their existing clones and re-clone the repository after you push the changes. Merging old branches will reintroduce the sensitive data
- **🔀 Open Pull Requests:** Rewriting history will break open PRs. Close or merge them before proceeding
- **🔐 Revoke Exposed Secrets:** If you exposed API keys, passwords, or tokens, rotate them immediately. History rewriting alone does not make them secure again

---

## 📋 Prerequisites

- Python 3.6 or higher installed
- Git 2.22 or higher
- Administrative access to the repository
- Backup of the repository

---

## 🛠️ Step-by-Step Guide

We recommend using **`git-filter-repo`** for this task. It is safer and faster than the older `git filter-branch`.

### 1. Install git-filter-repo

You can install via pip or a package manager:

```bash
# Using pip
pip install git-filter-repo

# Using Homebrew (macOS)
brew install git-filter-repo

# Verify installation
git filter-repo --version
```

### 2. Clone a Fresh Copy

Work on a fresh clone to ensure no old refs interfere:

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Create a backup branch before making changes
git branch backup-before-cleanup
```

### 3. Create a Replacement File

Create a text file (e.g., `replacements.txt`) defining the text to scrub. The format is:

```text
original_text==>new_text
```

**Example `replacements.txt`:**

```text
alice@example.com==>[EMAIL REDACTED]
password123==>[REDACTED]
sk_live_51AbC123456==>[API_KEY_REDACTED]
my-secret-token==>[TOKEN_REDACTED]
192.168.1.100==>[IP_REDACTED]
```

**Tips for creating replacements:**
- Use specific patterns to avoid false positives
- Test on a copy first if unsure
- Consider regex patterns for complex cases
- Be thorough - check all variations of the sensitive data

### 4. Rewrite Commit Messages

Run the filter command to replace text in **commit messages**:

```bash
# Replace text in commit messages
git filter-repo --replace-message replacements.txt
```

**Note:** If you also need to remove sensitive data from **file contents** (not just commit messages), you can run:

```bash
# Replace text in file contents
git filter-repo --replace-text replacements.txt
```

You can run both commands if needed, but do them separately to verify each step.

### 5. Verify the Changes

Before pushing, verify that the sensitive data has been removed:

```bash
# Check commit messages
git log --all --format="%H|%s|%b" | grep -i "sensitive-term"

# Check file contents
git grep -i "sensitive-term" $(git rev-list --all)

# View recent history
git log --oneline --graph --all
```

### 6. Force Push Changes

Once verified, force push the rewritten history:

```bash
# Push all refs (branches and tags)
git push --force --all origin

# Push tags if needed
git push --force --tags origin
```

**Alternative (more careful approach):**
```bash
# Push to a new branch first for verification
git push origin rewritten-history

# After team verification, force push to main
git push --force origin rewritten-history:main
```

---

## 🧹 Cleanup & Final Steps

### 1. Contact GitHub Support

Even after force-pushing, old commits may still be accessible via:
- Direct commit URLs
- Cached views on GitHub
- Pull request references
- GitHub's internal caches

**You must [contact GitHub Support](https://support.github.com/)** with:
- Your repository details (owner/repo)
- Confirmation that you've force-pushed cleaned history
- Request to remove cached views and unreachable objects

**Reference:** [GitHub Docs - Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

### 2. Update Team Members

Notify all collaborators to:

```bash
# Delete their local repository
cd .. && rm -rf your-repo

# Re-clone from scratch
git clone https://github.com/your-username/your-repo.git
```

**⚠️ Important:** Do NOT let team members pull/merge their old branches - this will reintroduce the sensitive data.

### 3. Clean Up Local Repository

After pushing, clean up your local repository:

```bash
# Remove the backup branch (optional, after verification)
git branch -D backup-before-cleanup

# Expire reflog and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## 🛡️ Preventing Future Leaks

### Option 1: Pre-commit Hooks with git-secrets

Install and configure `git-secrets` to block commits containing sensitive patterns:

```bash
# Install git-secrets (macOS)
brew install git-secrets

# Install git-secrets (Linux)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# Configure in your repository
cd /path/to/your/repo
git secrets --install
git secrets --register-aws  # If using AWS keys

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add '[a-zA-Z0-9_]{32,}'  # Potential API keys

# Scan entire repository
git secrets --scan-history
```

### Option 2: Pre-commit Hooks with gitleaks

`gitleaks` is another powerful tool for detecting secrets:

```bash
# Install gitleaks (macOS)
brew install gitleaks

# Install gitleaks (Linux)
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64
chmod +x gitleaks-linux-amd64
sudo mv gitleaks-linux-amd64 /usr/local/bin/gitleaks

# Scan repository
gitleaks detect --source . --verbose

# Add as pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
gitleaks protect --verbose --redact --staged
EOF

chmod +x .git/hooks/pre-commit
```

### Option 3: GitHub Push Protection

Enable GitHub's built-in push protection:

1. Go to repository **Settings** → **Code security and analysis**
2. Enable **Push protection** under "Secret scanning"
3. Configure patterns and exclusions as needed

**Reference:** [GitHub Docs - Best practices for preventing data leaks](https://docs.github.com/en/code-security/getting-started/best-practices-for-preventing-data-leaks-in-your-organization)

### Option 4: Create a `.gitleaksignore` File

For false positives, create a `.gitleaksignore` file:

```text
# Example .gitleaksignore
# Ignore test files
tests/fixtures/sample-data.json:password
# Ignore specific commit
commit:abc123def456
```

---

## 📊 Verification Checklist

After completing the cleanup, verify:

- [ ] Sensitive data removed from commit messages (`git log --all --format="%s %b" | grep -i "pattern"`)
- [ ] Sensitive data removed from file contents (`git grep -i "pattern" $(git rev-list --all)`)
- [ ] All branches updated (`git branch -r`)
- [ ] Force push completed (`git push --force`)
- [ ] GitHub Support contacted
- [ ] Team members notified
- [ ] Team members have re-cloned
- [ ] Pre-commit hooks installed
- [ ] Push protection enabled (if applicable)
- [ ] Secrets rotated/revoked

---

## 🚨 Troubleshooting

### Issue: "Cannot force push to main branch"

**Solution:** Temporarily disable branch protection:
1. Go to Settings → Branches → Branch protection rules
2. Disable the rule or add an exception for administrators
3. Force push
4. Re-enable protection

### Issue: "Old commits still visible on GitHub"

**Solution:** Contact GitHub Support - only they can purge cached commits from their servers.

### Issue: "Collaborator's PR reintroduced sensitive data"

**Solution:** 
- Close and re-open the PR from the new history
- Never merge old branches into the cleaned history

### Issue: "git-filter-repo not found"

**Solution:**
```bash
# Make sure pip bin directory is in PATH
export PATH="$HOME/.local/bin:$PATH"

# Or use full path
python3 -m pip install --user git-filter-repo
```

---

## 📚 Additional Resources

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-secrets Repository](https://github.com/awslabs/git-secrets)
- [gitleaks Repository](https://github.com/gitleaks/gitleaks)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

---

## 📝 Example Workflow

Here's a complete example workflow:

```bash
# 1. Clone and prepare
git clone https://github.com/username/repo.git
cd repo
git branch backup-before-cleanup

# 2. Create replacements file
cat > replacements.txt << EOF
mypassword123==>[REDACTED]
admin@example.com==>[EMAIL_REDACTED]
EOF

# 3. Run filter
git filter-repo --replace-message replacements.txt

# 4. Verify
git log --oneline --all | head -20

# 5. Push
git push --force --all origin

# 6. Clean up
rm replacements.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 7. Install protection
brew install gitleaks
gitleaks detect --source . --verbose
```

---

## ⚖️ Legal Considerations

- **GDPR Compliance:** Removing personal data from Git history may be required under GDPR "right to be forgotten"
- **Security Incident Response:** Document when and why data was removed for audit trails
- **Team Communication:** Ensure all stakeholders understand the implications

---

**Last Updated:** 2025-11-23  
**Status:** Production-ready guide based on industry best practices

#!/usr/bin/env bash
# ============================================================================
# Survive Fire for Brainrots - One-shot deploy script
#
# What this does:
#   1. Initializes a git repo (if not already done)
#   2. Commits all current files
#   3. Creates a public GitHub repo named survive-fire-for-brainrots
#   4. Pushes to GitHub
#   5. Enables GitHub Pages (serves from main branch / root)
#   6. Prints your live game URL
#
# Prerequisites:
#   - You must be logged into the GitHub CLI: run `gh auth login` once.
#   - You must run this script from the project root (where index.html lives).
#
# Usage:
#   bash deploy.sh
#   # or, after `chmod +x deploy.sh`:
#   ./deploy.sh
# ============================================================================

set -euo pipefail

REPO_NAME="survive-fire-for-brainrots"
GITHUB_USER="lysa-le"
PAGES_URL="https://${GITHUB_USER}.github.io/${REPO_NAME}/"

# Color helpers
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BOLD="\033[1m"
RESET="\033[0m"

step() { printf "\n${BOLD}${GREEN}▸ %s${RESET}\n" "$1"; }
warn() { printf "${YELLOW}⚠ %s${RESET}\n" "$1"; }
err()  { printf "${RED}✗ %s${RESET}\n" "$1" >&2; }
ok()   { printf "${GREEN}✓ %s${RESET}\n" "$1"; }

# ---------------------------------------------------------------------------
# 0. sanity checks
# ---------------------------------------------------------------------------

step "Checking environment..."

if [[ ! -f "index.html" ]]; then
  err "Couldn't find index.html in the current directory."
  err "Please cd into the project root first:"
  err "  cd /Users/lysa.le/survive-fire-for-brainrots"
  exit 1
fi
ok "Found index.html"

if ! command -v git >/dev/null 2>&1; then
  err "git is not installed. Install Git first: https://git-scm.com/downloads"
  exit 1
fi
ok "git installed"

if ! command -v gh >/dev/null 2>&1; then
  err "gh (GitHub CLI) is not installed."
  err "Install with Homebrew: brew install gh"
  exit 1
fi
ok "gh installed"

if ! gh auth status >/dev/null 2>&1; then
  warn "GitHub CLI is not authenticated."
  warn "Running 'gh auth login' for you - follow the prompts (choose HTTPS, browser auth)."
  gh auth login -h github.com
fi
ok "gh authenticated"

# ---------------------------------------------------------------------------
# 1. git init
# ---------------------------------------------------------------------------

if [[ ! -d ".git" ]]; then
  step "Initializing git repository..."
  git init -b main
  ok "Repository initialized on branch 'main'"
else
  ok "Git repository already exists"
fi

# Ensure user.email / user.name are set globally OR locally; abort otherwise.
if [[ -z "$(git config user.email || true)" ]]; then
  warn "git user.email not set. Setting it for this repo only."
  git config user.email "${GITHUB_USER}@users.noreply.github.com"
fi
if [[ -z "$(git config user.name || true)" ]]; then
  warn "git user.name not set. Setting it for this repo only."
  git config user.name "${GITHUB_USER}"
fi

# ---------------------------------------------------------------------------
# 2. commit
# ---------------------------------------------------------------------------

step "Staging files..."
git add -A
ok "Files staged"

if git diff --staged --quiet; then
  warn "Nothing new to commit - skipping commit step."
else
  step "Committing..."
  git commit -m "Initial release: descoped 1-day Phaser web build" >/dev/null
  ok "Initial commit created"
fi

# ---------------------------------------------------------------------------
# 3. create the GitHub repo (or detect existing)
# ---------------------------------------------------------------------------

step "Creating / detecting GitHub repo..."

if gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  ok "Repo ${GITHUB_USER}/${REPO_NAME} already exists on GitHub"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
  fi
else
  gh repo create "${GITHUB_USER}/${REPO_NAME}" --public --source=. --remote=origin --description "Survive Fire for Brainrots - a 2D web brainrot collect-a-thon" >/dev/null
  ok "Created public repo at github.com/${GITHUB_USER}/${REPO_NAME}"
fi

# ---------------------------------------------------------------------------
# 4. push
# ---------------------------------------------------------------------------

step "Pushing to GitHub..."
git push -u origin main
ok "Pushed to origin/main"

# ---------------------------------------------------------------------------
# 5. enable Pages
# ---------------------------------------------------------------------------

step "Enabling GitHub Pages (source: main / root)..."

# Check if pages already enabled
if gh api "repos/${GITHUB_USER}/${REPO_NAME}/pages" >/dev/null 2>&1; then
  ok "GitHub Pages is already enabled for this repo"
else
  if gh api -X POST "repos/${GITHUB_USER}/${REPO_NAME}/pages" \
      -f "source[branch]=main" \
      -f "source[path]=/" >/dev/null 2>&1; then
    ok "GitHub Pages enabled"
  else
    warn "Could not enable Pages via API. Open this URL and enable it manually:"
    warn "  https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
    warn "  -> Source: Deploy from a branch | Branch: main | Folder: / (root)"
  fi
fi

# ---------------------------------------------------------------------------
# 6. done
# ---------------------------------------------------------------------------

printf "\n${BOLD}${GREEN}🎉  Deploy complete!${RESET}\n"
printf "\n${BOLD}Your game will be live at:${RESET}\n"
printf "  ${BOLD}${YELLOW}%s${RESET}\n" "$PAGES_URL"
printf "\n"
printf "It usually takes 30-90 seconds for Pages to build the first time.\n"
printf "If the URL gives a 404 at first, wait a minute and refresh.\n"
printf "\n"
printf "Repo:    https://github.com/${GITHUB_USER}/${REPO_NAME}\n"
printf "Settings: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages\n"
printf "\n"

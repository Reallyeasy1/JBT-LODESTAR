#!/usr/bin/env bash
# collect-pr-context.sh
# Collects PR review context and prints it as structured sections.
# Usage: collect-pr-context.sh [base-branch] [--pr PR_NUMBER]
#
# Outputs sections prefixed with "===" so the reviewer can parse them.
# Safe: read-only, never edits files, never posts comments.

set -euo pipefail

BASE_ARG="${1:-}"
PR_NUMBER="${2:-}"
HAS_GH=false
command -v gh >/dev/null 2>&1 && HAS_GH=true

# ── Current branch ────────────────────────────────────────────────────────────
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
echo "=== CURRENT BRANCH ==="
echo "$CURRENT_BRANCH"
echo ""

# ── Infer base branch ─────────────────────────────────────────────────────────
echo "=== BASE BRANCH ==="
BASE=""

# Priority 1: explicit arg
if [ -n "$BASE_ARG" ]; then
  BASE="$BASE_ARG"
fi

# Priority 2: PR base via gh
if [ -z "$BASE" ] && $HAS_GH; then
  if [ -n "$PR_NUMBER" ]; then
    BASE=$(gh pr view "$PR_NUMBER" --json baseRefName -q '.baseRefName' 2>/dev/null || true)
  else
    BASE=$(gh pr view --json baseRefName -q '.baseRefName' 2>/dev/null || true)
  fi
fi

# Priority 3: origin/main → origin/master → main → master
if [ -z "$BASE" ]; then
  for candidate in origin/main origin/master main master; do
    if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
      BASE="$candidate"
      break
    fi
  done
fi

if [ -z "$BASE" ]; then
  echo "ERROR: could not infer base branch. Pass it explicitly."
  exit 1
fi

echo "$BASE"
echo ""

# ── Changed files ─────────────────────────────────────────────────────────────
echo "=== CHANGED FILES ==="
git diff --name-status "${BASE}...HEAD" 2>/dev/null || git diff --name-status "${BASE}" HEAD
echo ""

# ── Commits ───────────────────────────────────────────────────────────────────
echo "=== COMMITS ==="
git log --oneline "${BASE}...HEAD" 2>/dev/null || git log --oneline "${BASE}..HEAD"
echo ""

# ── Diff stat ─────────────────────────────────────────────────────────────────
echo "=== DIFF STAT ==="
git diff --stat "${BASE}...HEAD" 2>/dev/null || git diff --stat "${BASE}" HEAD
echo ""

# ── Full diff ─────────────────────────────────────────────────────────────────
echo "=== FULL DIFF ==="
git diff "${BASE}...HEAD" 2>/dev/null || git diff "${BASE}" HEAD
echo ""

# ── PR metadata ───────────────────────────────────────────────────────────────
echo "=== PR METADATA ==="
if $HAS_GH; then
  if [ -n "$PR_NUMBER" ]; then
    gh pr view "$PR_NUMBER" --json number,title,body,state,author,labels,reviewDecision 2>/dev/null \
      | sed 's/\\n/\n/g' || echo "not available"
  else
    gh pr view --json number,title,body,state,author,labels,reviewDecision 2>/dev/null \
      | sed 's/\\n/\n/g' || echo "not available"
  fi
else
  echo "gh CLI not available"
fi
echo ""

# ── CI status ─────────────────────────────────────────────────────────────────
echo "=== CI STATUS ==="
if $HAS_GH; then
  if [ -n "$PR_NUMBER" ]; then
    gh pr checks "$PR_NUMBER" 2>/dev/null || echo "not available"
  else
    gh pr checks 2>/dev/null || echo "not available"
  fi
else
  echo "gh CLI not available"
fi
echo ""

# ── Detected commands ─────────────────────────────────────────────────────────
echo "=== DETECTED COMMANDS ==="

# package.json scripts
if [ -f "package.json" ]; then
  echo "--- package.json scripts ---"
  # Extract test, lint, typecheck, build, check scripts
  node -e "
    const p = require('./package.json');
    const scripts = p.scripts || {};
    const relevant = ['test','lint','typecheck','type-check','tsc','build','check','validate','ci'];
    relevant.forEach(k => { if (scripts[k]) console.log('npm run ' + k + '  →  ' + scripts[k]); });
    // also catch any key containing those words
    Object.keys(scripts).forEach(k => {
      if (relevant.some(r => k.includes(r)) && !relevant.includes(k))
        console.log('npm run ' + k + '  →  ' + scripts[k]);
    });
  " 2>/dev/null || grep -E '"(test|lint|typecheck|type-check|build|check|ci)"' package.json || true
fi

# Makefile
if [ -f "Makefile" ]; then
  echo "--- Makefile targets ---"
  grep -E '^(test|lint|check|build|ci|typecheck|type-check|validate)[^:]*:' Makefile 2>/dev/null \
    | sed 's/:.*$//' | sed 's/^/make /' || true
fi

# pyproject.toml
if [ -f "pyproject.toml" ]; then
  echo "--- pyproject.toml ---"
  grep -A1 '\[tool\.(pytest|ruff|mypy|black|isort|pylint)\]' pyproject.toml 2>/dev/null | head -20 || true
fi

# go.mod
if [ -f "go.mod" ]; then
  echo "--- Go project detected ---"
  echo "go test ./..."
  echo "go vet ./..."
fi

# pom.xml
if [ -f "pom.xml" ]; then
  echo "--- Maven project detected ---"
  echo "mvn test"
  echo "mvn verify"
fi

# build.gradle / build.gradle.kts
if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  echo "--- Gradle project detected ---"
  echo "./gradlew test"
  echo "./gradlew check"
fi

# cargo.toml
if [ -f "Cargo.toml" ]; then
  echo "--- Rust project detected ---"
  echo "cargo test"
  echo "cargo clippy"
fi

echo ""
echo "=== END ==="

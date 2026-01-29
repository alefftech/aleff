# 📜 Code Protocol - Development Standards

This document defines coding standards, conventions, and best practices for Aleff development.

**Audience:** Developers (Claude Code sessions activated by CTO)
**Reference:** Follow this when CLAUDE.md says "Follow CODE-PROTOCOL.md"

---

## 🎯 Core Principles

1. **Clarity over cleverness** - Code should be obvious, not clever
2. **Safety first** - Never compromise security for convenience
3. **Document assumptions** - If it's not obvious, explain it
4. **Test what matters** - Focus on critical paths
5. **Anchor everything** - Use anchor comments for navigation

---

## 📝 File Structure Standards

### TypeScript Files

```typescript
/**
 * [FILE:NAME] Brief description
 *
 * Purpose: What this file does
 * Dependencies: Key dependencies
 * Usage: How to import/use
 *
 * Author: CTO Ronald + Claude Code
 * Date: YYYY-MM-DD
 */

// [IMPORT:EXTERNAL] External dependencies
import { something } from 'external-lib';

// [IMPORT:INTERNAL] Internal imports
import { helper } from './utils';

// [TYPE:DEFINITIONS] Type definitions
interface MyInterface {
  // ...
}

// [FUNCTION:MAIN] Main function
export function mainFunction() {
  // [LOGIC:CORE] Core logic
  // ...
}

// [EXPORT] Exports
export { mainFunction };
```

### Bash Scripts

```bash
#!/bin/bash
# [SCRIPT:NAME] Brief description
#
# Purpose: What this script does
# Usage: ./script.sh <args>
# Dependencies: Required binaries
#
# Author: CTO Ronald + Claude Code
# Date: YYYY-MM-DD

set -e  # Exit on error

# [CONFIG] Configuration
VARIABLE="value"

# [FUNCTION:MAIN] Main function
main() {
  # [LOG:START] Execution start
  echo "[INFO] Starting script..."

  # [LOGIC:CORE] Core logic
  # ...

  # [LOG:SUCCESS] Completion
  echo "[SUCCESS] Script completed!"
}

# [RUNTIME:ENTRY] Entry point
main "$@"
```

---

## 🏷️ Anchor Comments

### Categories

```
[STAGE:*]      - Docker build stages
[DEPS:*]       - Dependency installation
[BUILD:*]      - Build steps
[SKILLS:*]     - Skills installation
[CONFIG:*]     - Configuration
[SECURITY:*]   - Security settings
[RUNTIME:*]    - Runtime configuration
[ANIMATION:*]  - Animation logic (Remotion)
[ELEMENT:*]    - Visual elements (Remotion)
[TEST:*]       - Test sections
[LOG:*]        - Logging statements
[IMPORT:*]     - Import sections
[TYPE:*]       - Type definitions
[FUNCTION:*]   - Function definitions
[LOGIC:*]      - Logic blocks
[EXPORT:*]     - Export sections
```

### Usage Rules

✅ **Do:**
```typescript
// [FUNCTION:CALCULATE_TOTAL] Calculate order total with tax
function calculateTotal(items: Item[]): number {
  // [LOGIC:SUM] Sum item prices
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // [LOGIC:TAX] Apply tax rate
  const tax = subtotal * 0.1;

  return subtotal + tax;
}
```

❌ **Don't:**
```typescript
// Calculate total
function calculateTotal(items: Item[]): number {
  // This adds up all the prices
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  // Then we add tax
  const tax = subtotal * 0.1;
  return subtotal + tax;
}
```

---

## 📊 Structured Logging

### Log Levels

```bash
[INFO]     - Informational messages
[SUCCESS]  - Successful operations
[WARNING]  - Warnings (non-blocking)
[ERROR]    - Errors (blocking)
[DEBUG]    - Debug information (dev only)
```

### Usage

```bash
# [LOG:OPERATION] Operation description
echo "========================================"
echo "[INFO] Operation: Build Docker Image"
echo "[INFO] Version: $(git describe --tags)"
echo "[INFO] Environment: Production"
echo "========================================"

if build_image; then
  echo "[SUCCESS] Image built successfully"
else
  echo "[ERROR] Build failed: $error_message"
  exit 1
fi
```

### TypeScript Logging

```typescript
// [LOG:OPERATION] Operation start
console.log('[INFO] Starting data sync...');

try {
  // [LOGIC:SYNC] Sync logic
  await syncData();
  // [LOG:SUCCESS] Success
  console.log('[SUCCESS] Data synced successfully');
} catch (error) {
  // [LOG:ERROR] Error handling
  console.error('[ERROR] Sync failed:', error.message);
  throw error;
}
```

---

## 🔒 Security Standards

### Never Commit Secrets

```bash
# ❌ BAD - Hardcoded secret
API_KEY="sk-1234567890abcdef"

# ✅ GOOD - Environment variable
API_KEY="${API_KEY}"

# ✅ BETTER - With validation
if [ -z "$API_KEY" ]; then
  echo "[ERROR] API_KEY not set"
  exit 1
fi
```

### Environment Variables

```bash
# [CONFIG:ENV] Environment configuration
# Required variables (no defaults)
DATABASE_URL="${DATABASE_URL}"
OPENAI_API_KEY="${OPENAI_API_KEY}"

# Optional variables (with safe defaults)
LOG_LEVEL="${LOG_LEVEL:-info}"
PORT="${PORT:-18789}"
```

### Secret Scanning

Before every commit:
```bash
# Check for secrets
git secrets --scan

# Or use GitHub's secret scanner
# (runs automatically on push)
```

---

## 📦 Skill Development

### SKILL.md Template

```markdown
---
name: skill-name
description: Brief description (< 100 chars)
homepage: https://github.com/...
metadata:
  moltbot:
    emoji: 🎯
    requires:
      bins: [required-binary]
      env: [REQUIRED_ENV_VAR]
---

# Skill Name

Brief description of what the skill does.

## When to Use

Use this skill when asked to:
- Trigger phrase 1
- Trigger phrase 2
- Trigger phrase 3

## Quick Start

\`\`\`bash
skill-command --example
\`\`\`

## Use Cases by Team

### IAVANCADA (AI Consulting)
Usage example for IAVANCADA...

### AGILCONTRATOS (Legal Tech)
Usage example for AGILCONTRATOS...

### MENTORINGBASE (Mentoring Platform)
Usage example for MENTORINGBASE...

## Anchor Comments

- `[SKILL:NAME]` - Skill initialization
- `[FUNCTION:MAIN]` - Main function
- `[CONFIG]` - Configuration

## Examples

### Example 1: Basic Usage
\`\`\`bash
skill-command --input "example"
\`\`\`

### Example 2: Advanced Usage
\`\`\`bash
skill-command --input "example" --option value
\`\`\`

## Troubleshooting

### Issue: Common problem
**Solution:** How to fix it

## Resources

- Documentation: https://...
- Examples: https://...
```

### Skill Directory Structure

```
skills/skill-name/
├── SKILL.md              ← Required documentation
├── script.sh             ← Main script (if bash)
├── index.ts              ← Main script (if TypeScript)
├── examples/             ← Usage examples (optional)
│   ├── example1.sh
│   └── example2.sh
└── test.sh               ← Tests (optional but recommended)
```

---

## 🧪 Testing Standards

### Test Script Template

```bash
#!/bin/bash
# [TEST:SKILL_NAME] Skill validation tests
#
# Tests:
# 1. Binary existence
# 2. Basic functionality
# 3. Error handling
#
# Usage: ./test.sh

set -e

# [CONFIG] Test configuration
SKILL_NAME="skill-name"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# [LOG:START] Test execution start
echo "========================================"
echo "[INFO] Testing $SKILL_NAME"
echo "========================================"

# [TEST:BINARY] Check binary existence
echo "[TEST] Checking binary..."
if command -v skill-binary &> /dev/null; then
  echo "  ✅ Binary found"
else
  echo "  ❌ Binary not found"
  exit 1
fi

# [TEST:FUNCTIONALITY] Basic functionality test
echo "[TEST] Testing functionality..."
if skill-binary --test; then
  echo "  ✅ Functionality OK"
else
  echo "  ❌ Functionality failed"
  exit 1
fi

# [LOG:SUCCESS] All tests passed
echo "========================================"
echo "[SUCCESS] ✅ All tests passed!"
echo "========================================"
```

---

## 🐳 Docker Standards

### Dockerfile Structure

```dockerfile
# [STAGE:BASE] Base image
FROM node:22-bookworm

# [DEPS:SYSTEM] System dependencies
RUN apt-get update && \
    apt-get install -y package1 package2

# [BUILD:DEPS] Copy dependency manifests
COPY package.json ./

# [BUILD:INSTALL] Install dependencies
RUN npm install

# [SKILLS:CATEGORY] Install skill dependencies
RUN npm install -g skill-cli

# [BUILD:SOURCE] Copy source code
COPY . .

# [BUILD:COMPILE] Build application
RUN npm run build

# [CONFIG:ENV] Environment configuration
ENV NODE_ENV=production

# [SECURITY:USER] Run as non-root
USER node

# [RUNTIME:CMD] Start application
CMD ["node", "dist/index.js"]
```

### Volume Mounts

```bash
# Data persistence
-v /host/data:/container/data:rw

# Runtime instructions (workspace)
-v /host/workspace:/container/clawd:rw

# Configuration files
-v /host/config:/container/.config:rw
```

---

## 📝 Git Commit Standards

### Message Format

```
type(scope): brief description (< 70 chars)

[CATEGORY:IDENTIFIER] Detailed explanation

Detailed description of changes:
- Bullet point 1
- Bullet point 2
- Bullet point 3

Breaking changes (if any):
- Breaking change description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring (no behavior change)
- `perf` - Performance improvement
- `test` - Adding/updating tests
- `chore` - Maintenance (dependencies, build, etc)

### Examples

```bash
# Feature addition
git commit -m "feat(skills): add apify web scraping skill

[SKILLS:APIFY] Added web scraping via Apify actors

- LinkedIn profile scraper
- Google Maps business listings
- Instagram content extractor
- Full documentation with holding use cases

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Bug fix
git commit -m "fix(founder-memory): embeddings not saving on restart

[BUG:EMBEDDINGS] Fixed persistence issue

Root cause: Database connection closed before embeddings saved.
Solution: Await embedding save before closing connection.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Documentation
git commit -m "docs(workspace): add runtime agent instructions

[DOCS:WORKSPACE] Separated HOST/CONTAINER concerns

Created 5 workspace files:
- AGENTS.md: Operational instructions
- IDENTITY.md: Agent identity
- USER.md: User context
- TOOLS.md: Available tools
- SOUL.md: Personality

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📊 Documentation Standards

### README.md Structure

```markdown
# Project Name

Brief description (1-2 sentences)

## Status

Current status badges/info

## Features

- Feature 1
- Feature 2

## Quick Start

\`\`\`bash
command to run
\`\`\`

## Documentation

Link to detailed docs

## Architecture

High-level overview

## Development

How to contribute
```

### CHANGELOG.md Format

```markdown
# Changelog

## YYYY.MM.DD - Session Title

**Date:** YYYY-MM-DD
**Session:** Description
**Author:** CTO Ronald + Claude Code

### 🎯 Summary

High-level summary of changes.

### ✅ What Changed

1. **Feature 1**
   - Details

2. **Feature 2**
   - Details

### 📊 Metrics

- Files changed: X
- Lines added: Y
- Skills added: Z

### 🔗 Commits

- Commit 1: Description
- Commit 2: Description
```

---

## 🎨 Code Style

### TypeScript

```typescript
// [STYLE] Naming conventions
interface UserProfile { }  // PascalCase for types
const MAX_RETRIES = 3;     // UPPER_SNAKE_CASE for constants
function getUserData() { }  // camelCase for functions
const userName = "Alice";   // camelCase for variables

// [STYLE] Prefer const
const config = { };  // ✅
let config = { };    // ❌ (unless actually mutable)

// [STYLE] Use explicit types
function process(data: string): Promise<Result> { }  // ✅
function process(data) { }                            // ❌

// [STYLE] Handle errors explicitly
try {
  await riskyOperation();
} catch (error) {
  logger.error('[ERROR] Operation failed:', error);
  throw error;  // Re-throw or handle
}
```

### Bash

```bash
# [STYLE] Use strict mode
set -e  # Exit on error
set -u  # Error on undefined variable
set -o pipefail  # Pipe failures

# [STYLE] Quote variables
echo "$VARIABLE"  # ✅
echo $VARIABLE    # ❌

# [STYLE] Use functions
function do_something() {
  local arg="$1"
  echo "[INFO] Processing: $arg"
}

# [STYLE] Check command existence
if ! command -v binary &> /dev/null; then
  echo "[ERROR] binary not found"
  exit 1
fi
```

---

## ✅ Pre-Commit Checklist

```
☐ Code builds successfully (pnpm build)
☐ No TypeScript errors
☐ No hardcoded secrets
☐ Anchor comments added
☐ Structured logging used
☐ Documentation updated:
  ☐ README.md (if features changed)
  ☐ CHANGELOG.md (always)
  ☐ workspace/*.md (if agent behavior changed)
☐ Tests pass (if applicable)
☐ Commit message follows format
☐ Co-Authored-By line present
☐ Git secret scan passed
```

---

## 🔍 Code Review Standards

### What to Look For

**Safety:**
- No hardcoded secrets
- Proper error handling
- Input validation
- Security best practices

**Quality:**
- Anchor comments present
- Structured logging used
- Documentation complete
- Tests adequate

**Maintainability:**
- Clear variable names
- Logical function decomposition
- DRY principle followed
- Comments explain "why", not "what"

---

**Last Updated:** 2026-01-29
**Version:** 1.0.0
**Author:** CTO Ronald + Claude Code

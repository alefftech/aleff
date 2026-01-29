# Aleff Logging & Documentation Standards

**Version:** 1.0.0
**Date:** 2026-01-29
**Purpose:** Standardize structured logging and code navigation across the Aleff codebase

---

## 📍 Anchor Comments

Anchor comments are special code comments that enable quick navigation and section identification. They follow the format `[CATEGORY:IDENTIFIER]`.

### Format

```
[CATEGORY:IDENTIFIER] Description
```

- **CATEGORY**: Uppercase, describes the type of code section
- **IDENTIFIER**: Uppercase snake_case, identifies the specific section
- **Description**: Human-readable explanation

### Categories

#### **[STAGE:*]** - Docker Build Stages
Used in Dockerfile to mark multi-stage build steps.

```dockerfile
# [STAGE:BASE] Base image with Node.js 22
FROM node:22-bookworm
```

#### **[DEPS:*]** - Dependency Installation
Marks dependency installation blocks.

```dockerfile
# [DEPS:BUN] Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash

# [DEPS:SYSTEM] Install system dependencies
RUN apt-get update && apt-get install -y ...
```

#### **[BUILD:*]** - Build Steps
Marks application build processes.

```dockerfile
# [BUILD:COMPILE] Build TypeScript and bundle UI
RUN pnpm build

# [BUILD:SOURCE] Copy application source code
COPY . .
```

#### **[SKILLS:*]** - Skills Installation
Marks skill-specific installations in Dockerfile.

```dockerfile
# [SKILLS:BROWSER] Install browser automation tools
RUN npm install -g puppeteer playwright

# [SKILLS:GOOGLE] Install gogcli (Google Workspace integration)
RUN curl -sL https://github.com/.../gogcli_0.9.0_linux_amd64.tar.gz | tar xz
```

#### **[CONFIG:*]** - Configuration
Marks configuration sections in code or Dockerfiles.

```dockerfile
# [CONFIG:ENV] Set production environment
ENV NODE_ENV=production
```

```tsx
// [CONFIG] Composition configuration
export const courseIntroConfig = {
  id: 'CourseIntro',
  component: CourseIntro,
  durationInFrames: 150,
  fps: 30,
};
```

#### **[SECURITY:*]** - Security-Related
Marks security configurations or sensitive operations.

```dockerfile
# [SECURITY:USER] Run as non-root user with sudo privileges
USER node
```

#### **[RUNTIME:*]** - Runtime Configuration
Marks runtime startup commands or configuration.

```dockerfile
# [RUNTIME:CMD] Start application
CMD ["node", "dist/index.js"]
```

#### **[ANIMATION:*]** - Animation Logic (Remotion)
Used in Remotion video templates for animation code.

```tsx
// [ANIMATION:TITLE] Spring animation for title entrance
const titleSpring = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: { damping: 100, stiffness: 200 },
});
```

#### **[ELEMENT:*]** - Visual Elements (Remotion)
Used in Remotion templates for JSX elements.

```tsx
{/* [ELEMENT:TITLE] Main course title */}
<div style={{ fontSize: 72, fontWeight: 'bold' }}>
  {title}
</div>
```

#### **[TEST:*]** - Test Sections
Marks test code blocks in test scripts.

```bash
# [TEST:IMPORTS] Verify required Remotion imports
for template in "${TEMPLATES[@]}"; do
  if grep -q "from 'remotion'" "$filepath"; then
    echo "  ✅ $template: Remotion imports present"
  fi
done
```

#### **[LOG:*]** - Logging Statements
Marks logging or output statements in scripts.

```bash
# [LOG:START] Test execution start
echo "[INFO] Testing MENTORINGBASE Video Templates"

# [LOG:SUCCESS] All tests passed
echo "[SUCCESS] ✅ All tests passed!"
```

---

## 📊 Structured Logging

### Log Levels

Use consistent prefixes for log messages:

- `[INFO]` - Informational messages
- `[SUCCESS]` - Successful operations
- `[WARNING]` - Warnings that don't stop execution
- `[ERROR]` - Errors that prevent operation
- `[DEBUG]` - Debug information (development only)

### Examples

```bash
echo "[INFO] Starting Docker build..."
echo "[SUCCESS] Build completed in 3m 45s"
echo "[WARNING] Optional dependency not found, skipping"
echo "[ERROR] Build failed: missing required file"
```

### Structured Format

For complex operations, use structured logging:

```bash
# [LOG:OPERATION] Operation name
echo "============================================"
echo "[INFO] Operation: Build Aleff Docker Image"
echo "[INFO] Version: 2026.1.29"
echo "[INFO] Environment: Production"
echo "============================================"
```

---

## 🔍 Searching Anchor Comments

### Quick Navigation

Use your editor's search function to jump to specific sections:

```bash
# Find all animation code
/\[ANIMATION:/

# Find all skills installations
/\[SKILLS:/

# Find all configuration blocks
/\[CONFIG:/

# Find all test sections
/\[TEST:/
```

### Grep Examples

```bash
# List all anchor comments in a file
grep -n '\[.*:.*\]' Dockerfile

# Find specific category
grep -n '\[SKILLS:' Dockerfile

# Count anchor comments by category
grep -o '\[[A-Z]*:' Dockerfile | sort | uniq -c
```

---

## 📝 Documentation Standards

### File Headers

Every major file should have a header comment:

```typescript
/**
 * FILENAME - Brief description
 *
 * Purpose: What this file does
 * Dependencies: Key dependencies
 * Usage: How to use this file
 *
 * Author: CTO Ronald + Claude Code
 * Date: 2026-01-29
 */
```

### Function Documentation

```typescript
/**
 * [FUNCTION:NAME] Brief description
 *
 * @param {Type} paramName - Description
 * @returns {Type} Description
 *
 * Example:
 *   functionName('example');
 */
export function functionName(paramName: Type): ReturnType {
  // Implementation
}
```

### Skill Documentation

Every skill MUST have a `SKILL.md` with:

1. **YAML Frontmatter** with metadata
2. **Description** of what it does
3. **When to Use** trigger phrases
4. **Quick Start** examples
5. **Use Cases** specific to holding teams
6. **Anchor Comments** for code navigation

Example structure:

```markdown
---
name: skill-name
description: Brief description
metadata:
  moltbot:
    emoji: 🎯
    requires:
      bins: [binary]
---

# Skill Name

Description...

## When to Use
- Trigger phrase 1
- Trigger phrase 2

## Quick Start
\`\`\`bash
command --example
\`\`\`

## Use Cases by Team

### IAVANCADA
Usage example...

### AGILCONTRATOS
Usage example...

## Anchor Comments
- `[ANIMATION:*]` - Animation logic
- `[ELEMENT:*]` - Visual elements
```

---

## 🧪 Testing Standards

### Test Script Format

```bash
#!/bin/bash
# [TEST:SCRIPT_NAME] Brief description
#
# Tests:
# 1. Test description 1
# 2. Test description 2
#
# Usage: ./test.sh

set -e

# [CONFIG] Test configuration
VARIABLE="value"

# [TEST:SECTION_NAME] Test section description
echo "[INFO] Running tests..."

if [ condition ]; then
  echo "  ✅ Test passed"
else
  echo "  ❌ Test failed"
  exit 1
fi

# [LOG:SUCCESS] All tests passed
echo "[SUCCESS] ✅ All tests passed!"
```

---

## 📦 Git Commit Standards

### Commit Message Format

```
type(scope): brief description

[CATEGORY:IDENTIFIER] Detailed explanation

- Bullet point 1
- Bullet point 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```bash
git commit -m "feat(skills): add summarize, apify, gog-contacts

[SKILLS:WEB_INTEL] Added web intelligence capabilities

- summarize: AI-powered URL/YouTube/PDF summaries
- apify: Web scraping for LinkedIn, Google Maps, Instagram
- gog-contacts: Google Contacts management and CRM sync

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 🎯 Best Practices

### DO ✅

- **Use anchor comments** for all major sections
- **Add structured logs** to all scripts
- **Document anchor comments** in README files
- **Search-friendly identifiers** (uppercase, descriptive)
- **Consistent categories** across codebase
- **Update docs** when adding new categories

### DON'T ❌

- **Don't overuse** - Only for significant sections
- **Don't duplicate** - One anchor per logical section
- **Don't use spaces** - Use underscores in identifiers
- **Don't abbreviate** - Use clear, full words
- **Don't forget** - Add to all new code

### When to Use

**✅ Good Use Cases:**
- Major sections in Dockerfiles
- Animation logic in video templates
- Test sections in test scripts
- Configuration blocks
- Skill installations
- Build steps

**❌ Bad Use Cases:**
- Every single line of code
- Trivial comments
- Self-explanatory code
- Temporary debug code

---

## 📚 Examples in Aleff Codebase

### Dockerfile
```dockerfile
# [STAGE:BASE] Base image with Node.js 22
# [DEPS:SYSTEM] Install system dependencies
# [SKILLS:GOOGLE] Install gogcli
# [BUILD:COMPILE] Build TypeScript
# [RUNTIME:CMD] Start application
```

### Remotion Templates
```tsx
// [ANIMATION:TITLE] Spring entrance animation
// [ELEMENT:MAIN_TEXT] Main quote display
// [CONFIG] Composition configuration
```

### Test Scripts
```bash
# [TEST:FILE_EXISTS] Check if template files exist
# [LOG:START] Test execution start
# [LOG:SUCCESS] All tests passed
```

### Skills Documentation
```markdown
## Anchor Comments Guide
- `[ANIMATION:*]` - Animation logic
- `[ELEMENT:*]` - Visual components
- `[CONFIG]` - Configuration settings
```

---

## 🔧 Tools & Editor Integration

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "search.useIgnoreFiles": true,
  "editor.rulers": [80, 120],
  "files.associations": {
    "*.md": "markdown"
  }
}
```

### Grep Shortcuts

Add to `.bashrc` or `.zshrc`:

```bash
# Find anchor comments
alias find-anchors='grep -rn "\[.*:.*\]" --include="*.ts" --include="*.tsx" --include="*.sh" --include="Dockerfile"'

# Count anchors by category
alias count-anchors='find-anchors | grep -o "\[[A-Z]*:" | sort | uniq -c | sort -rn'

# Search specific category
function find-category() {
  grep -rn "\[$1:" --include="*.ts" --include="*.tsx" --include="*.sh" --include="Dockerfile"
}
```

Usage:
```bash
find-anchors
count-anchors
find-category SKILLS
find-category ANIMATION
```

---

## 📈 Metrics & Validation

### Check Anchor Comment Coverage

```bash
#!/bin/bash
# [METRICS:ANCHOR_COVERAGE] Calculate anchor comment coverage

total_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.sh" -o -name "Dockerfile" \) | wc -l)
files_with_anchors=$(grep -rl "\[.*:.*\]" --include="*.ts" --include="*.tsx" --include="*.sh" --include="Dockerfile" | wc -l)

coverage=$(echo "scale=2; $files_with_anchors / $total_files * 100" | bc)

echo "[METRICS] Anchor Comment Coverage: $coverage%"
echo "[INFO] Files with anchors: $files_with_anchors / $total_files"
```

---

## 🆕 Adding New Categories

When adding a new anchor comment category:

1. **Document it** in this file
2. **Update CLAUDE.md** with usage examples
3. **Add to search shortcuts** (if widely used)
4. **Use consistently** across codebase
5. **Announce in commit message**

Example:
```bash
git commit -m "docs(standards): add [CATEGORY:NEW] anchor comment

[DOCS:STANDARDS] New category for XYZ purposes

Usage:
// [CATEGORY:IDENTIFIER] Description

Applied to:
- file1.ts
- file2.tsx
```

---

## 📞 Contact

Questions about logging standards? Ask:
- **CTO Ronald** (supervisor)
- **Aleff** (@aleff_000_bot on Telegram)

---

**Last Updated:** 2026-01-29
**Version:** 1.0.0
**Author:** CTO Ronald + Claude Code

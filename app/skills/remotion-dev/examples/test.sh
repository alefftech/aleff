#!/bin/bash
# [TEST:REMOTION_TEMPLATES] Validate Remotion template files
#
# Tests:
# 1. Check TypeScript syntax
# 2. Verify required imports
# 3. Validate component exports
# 4. Check anchor comments presence
#
# Usage: ./test.sh

set -e

# [CONFIG] Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES=(
  "course-intro.tsx"
  "progress-tracker.tsx"
  "social-clip.tsx"
)

# [LOG:START] Test execution start
echo "============================================"
echo "[INFO] Testing MENTORINGBASE Video Templates"
echo "[INFO] Location: $SCRIPT_DIR"
echo "============================================"
echo ""

# [TEST:FILE_EXISTS] Check if template files exist
echo "[TEST] Checking template files..."
for template in "${TEMPLATES[@]}"; do
  filepath="$SCRIPT_DIR/$template"
  if [ -f "$filepath" ]; then
    echo "  ✅ Found: $template"
  else
    echo "  ❌ Missing: $template"
    exit 1
  fi
done
echo ""

# [TEST:IMPORTS] Verify required Remotion imports
echo "[TEST] Verifying Remotion imports..."
for template in "${TEMPLATES[@]}"; do
  filepath="$SCRIPT_DIR/$template"

  # Check for remotion imports
  if grep -q "from 'remotion'" "$filepath"; then
    echo "  ✅ $template: Remotion imports present"
  else
    echo "  ❌ $template: Missing Remotion imports"
    exit 1
  fi

  # Check for React import
  if grep -q "from 'react'" "$filepath"; then
    echo "  ✅ $template: React import present"
  else
    echo "  ❌ $template: Missing React import"
    exit 1
  fi
done
echo ""

# [TEST:EXPORTS] Check component exports
echo "[TEST] Checking component exports..."
for template in "${TEMPLATES[@]}"; do
  filepath="$SCRIPT_DIR/$template"

  # Check for component export
  if grep -q "export const.*React.FC" "$filepath"; then
    echo "  ✅ $template: Component exported"
  else
    echo "  ❌ $template: Component export not found"
    exit 1
  fi

  # Check for config export
  if grep -q "export const.*Config" "$filepath"; then
    echo "  ✅ $template: Config exported"
  else
    echo "  ❌ $template: Config export not found"
    exit 1
  fi
done
echo ""

# [TEST:PROPS] Verify TypeScript interfaces
echo "[TEST] Checking TypeScript interfaces..."
for template in "${TEMPLATES[@]}"; do
  filepath="$SCRIPT_DIR/$template"

  if grep -q "interface.*Props" "$filepath"; then
    echo "  ✅ $template: Props interface defined"
  else
    echo "  ❌ $template: Props interface missing"
    exit 1
  fi
done
echo ""

# [TEST:ANCHOR_COMMENTS] Check anchor comments presence
echo "[TEST] Validating anchor comments..."
for template in "${TEMPLATES[@]}"; do
  filepath="$SCRIPT_DIR/$template"

  animation_count=$(grep -c "\[ANIMATION:" "$filepath" || true)
  element_count=$(grep -c "\[ELEMENT:" "$filepath" || true)
  config_count=$(grep -c "\[CONFIG\]" "$filepath" || true)

  echo "  📊 $template:"
  echo "     - [ANIMATION:*] tags: $animation_count"
  echo "     - [ELEMENT:*] tags: $element_count"
  echo "     - [CONFIG] tags: $config_count"

  if [ "$animation_count" -gt 0 ] && [ "$element_count" -gt 0 ] && [ "$config_count" -gt 0 ]; then
    echo "  ✅ $template: Anchor comments OK"
  else
    echo "  ⚠️  $template: Missing some anchor comments"
  fi
done
echo ""

# [TEST:SYNTAX] TypeScript syntax check (if tsc available)
echo "[TEST] Checking TypeScript syntax..."
if command -v tsc &> /dev/null; then
  for template in "${TEMPLATES[@]}"; do
    filepath="$SCRIPT_DIR/$template"
    # Note: This is a basic check, full validation needs tsconfig.json
    if tsc --noEmit --jsx react --target ES2020 "$filepath" 2>&1 | grep -q "error"; then
      echo "  ❌ $template: Syntax errors found"
      tsc --noEmit --jsx react --target ES2020 "$filepath"
      exit 1
    else
      echo "  ✅ $template: Syntax OK"
    fi
  done
else
  echo "  ⚠️  tsc not found, skipping syntax validation"
fi
echo ""

# [TEST:DOCUMENTATION] Check README.md
echo "[TEST] Checking documentation..."
readme="$SCRIPT_DIR/README.md"
if [ -f "$readme" ]; then
  echo "  ✅ README.md exists"

  # Check if all templates are documented
  for template in "${TEMPLATES[@]}"; do
    template_name="${template%.tsx}"
    if grep -q "$template_name" "$readme"; then
      echo "  ✅ $template_name documented"
    else
      echo "  ⚠️  $template_name not found in README"
    fi
  done
else
  echo "  ❌ README.md missing"
  exit 1
fi
echo ""

# [LOG:SUCCESS] All tests passed
echo "============================================"
echo "[SUCCESS] ✅ All tests passed!"
echo "[INFO] Templates ready for use"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Copy templates to your Remotion project"
echo "  2. Register in src/Root.tsx"
echo "  3. Run: npx remotion preview src/index.ts"
echo ""

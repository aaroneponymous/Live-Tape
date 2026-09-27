#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

passed=0
failed=0
warnings=0

echo
echo "========================================"
echo " Live Tape Verification"
echo "========================================"
echo " root: $ROOT_DIR"
echo

pass() {
  passed=$((passed + 1))
  echo "PASS  $*"
}

fail() {
  failed=$((failed + 1))
  echo "FAIL  $*" >&2
}

warn() {
  warnings=$((warnings + 1))
  echo "WARN  $*"
}

section() {
  echo
  echo "-- $* --"
}

check_file_exists() {
  local file="$1"

  if [[ -f "$file" ]]; then
    pass "exists: $file"
  else
    fail "missing: $file"
  fi
}

check_path_exists() {
  local path="$1"

  if [[ -e "$path" ]]; then
    pass "exists: $path"
  else
    fail "missing: $path"
  fi
}

check_non_empty() {
  local file="$1"

  if [[ -s "$file" ]]; then
    pass "non-empty: $file"
  else
    fail "empty or missing: $file"
  fi
}

check_frontmatter() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    fail "cannot inspect frontmatter; missing: $file"
    return
  fi

  local first_line
  first_line="$(head -n 1 "$file")"

  if [[ "$first_line" != "---" ]]; then
    fail "frontmatter missing opening ---: $file"
    return
  fi

  if ! grep -Eq '^---[[:space:]]*$' "$file"; then
    fail "frontmatter delimiter missing: $file"
    return
  fi

  pass "frontmatter ok: $file"
}

# -----------------------------------------------------------------------------
# 1. Canonical project documentation
# -----------------------------------------------------------------------------

section "Canonical documentation"

required_project_files=(
  "docs/00_PROJECT_CHARTER.md"
  "docs/01_CURRENT_STATE.md"
  "docs/02_DECISION_LOG.md"
  "docs/03_OPEN_QUESTIONS.md"
  "docs/04_ROADMAP.md"
  "AGENTS.md"
  "CLAUDE.md"
)

for file in "${required_project_files[@]}"; do
  check_file_exists "$file"
done

# README is useful but does not determine canonical project state.
if [[ -f "README.md" ]]; then
  pass "exists: README.md"
else
  warn "README.md is missing"
fi

# -----------------------------------------------------------------------------
# 2. Agent operating system
# -----------------------------------------------------------------------------

section "Agent operating system"

check_path_exists ".cursor/rules"
check_file_exists ".cursor/rules/00-project-state.mdc"
check_file_exists ".cursor/rules/10-research-integrity.mdc"
check_file_exists ".cursor/rules/20-data-integrity.mdc"
check_file_exists ".cursor/rules/30-typescript.mdc"
check_file_exists ".cursor/rules/40-cpp-engine.mdc"

check_file_exists ".cursor/agents/researcher.md"
check_file_exists ".cursor/agents/implementer.md"
check_file_exists ".cursor/agents/verifier.md"

check_file_exists ".cursor/skills/implement-feature/SKILL.md"
check_file_exists ".cursor/skills/update-project-state/SKILL.md"

check_file_exists "tasks/TEMPLATE.md"
check_path_exists "tasks/active"
check_path_exists "tasks/completed"

check_file_exists "scripts/verify.sh"

# -----------------------------------------------------------------------------
# 3. Competing canonical document names
# -----------------------------------------------------------------------------

section "Competing doc names (should not exist)"

competing_docs="$(
  find docs \
    -type f \
    \( \
      -iname '*-final.md' -o \
      -iname '*-final-final.md' -o \
      -iname '*-v2.md' -o \
      -iname '*-new.md' -o \
      -iname '*-updated.md' \
    \) \
    -print 2>/dev/null || true
)"

if [[ -z "$competing_docs" ]]; then
  pass "no competing *-final/-v2/-new/-updated docs"
else
  fail "found competing canonical-style documents:"
  while IFS= read -r file; do
    echo "      $file" >&2
  done <<< "$competing_docs"
fi

# -----------------------------------------------------------------------------
# 4. Canonical files must not be empty
# -----------------------------------------------------------------------------

section "Canonical docs are non-empty"

canonical_non_empty=(
  "docs/00_PROJECT_CHARTER.md"
  "docs/01_CURRENT_STATE.md"
  "docs/02_DECISION_LOG.md"
  "docs/03_OPEN_QUESTIONS.md"
  "docs/04_ROADMAP.md"
  "AGENTS.md"
)

for file in "${canonical_non_empty[@]}"; do
  check_non_empty "$file"
done

# -----------------------------------------------------------------------------
# 5. Stable decision / question IDs
# -----------------------------------------------------------------------------

section "Decision / question ID presence"

if grep -Eq '^## D-[0-9]{3}([[:space:]]|$)' \
  "docs/02_DECISION_LOG.md"; then
  pass "decision log has D-NNN entries"
else
  warn "decision log missing D-NNN entries"
fi

if grep -Eq '^## Q-[0-9]{3}([[:space:]]|$)' \
  "docs/03_OPEN_QUESTIONS.md"; then
  pass "open questions have Q-NNN entries"
else
  warn "open questions missing Q-NNN entries"
fi

# Detect duplicate decision IDs.
duplicate_decisions="$(
  grep -Eo '^## D-[0-9]{3}' "docs/02_DECISION_LOG.md" \
    | sed 's/^## //' \
    | sort \
    | uniq -d \
    || true
)"

if [[ -z "$duplicate_decisions" ]]; then
  pass "decision IDs are unique"
else
  fail "duplicate decision IDs found: $duplicate_decisions"
fi

# Detect duplicate question IDs.
duplicate_questions="$(
  grep -Eo '^## Q-[0-9]{3}' "docs/03_OPEN_QUESTIONS.md" \
    | sed 's/^## //' \
    | sort \
    | uniq -d \
    || true
)"

if [[ -z "$duplicate_questions" ]]; then
  pass "open-question IDs are unique"
else
  fail "duplicate open-question IDs found: $duplicate_questions"
fi

# -----------------------------------------------------------------------------
# 6. Agent frontmatter
# -----------------------------------------------------------------------------

section "Agent frontmatter"

agents=(
  ".cursor/agents/researcher.md"
  ".cursor/agents/implementer.md"
  ".cursor/agents/verifier.md"
)

for file in "${agents[@]}"; do
  check_frontmatter "$file"
done

# -----------------------------------------------------------------------------
# 7. Skill frontmatter
# -----------------------------------------------------------------------------

section "Skill frontmatter"

skills=(
  ".cursor/skills/implement-feature/SKILL.md"
  ".cursor/skills/update-project-state/SKILL.md"
)

for file in "${skills[@]}"; do
  check_frontmatter "$file"
done

# -----------------------------------------------------------------------------
# 8. Rule frontmatter
# -----------------------------------------------------------------------------

section "Cursor rule frontmatter"

rules=(
  ".cursor/rules/00-project-state.mdc"
  ".cursor/rules/10-research-integrity.mdc"
  ".cursor/rules/20-data-integrity.mdc"
  ".cursor/rules/30-typescript.mdc"
  ".cursor/rules/40-cpp-engine.mdc"
)

for file in "${rules[@]}"; do
  check_frontmatter "$file"
done

# -----------------------------------------------------------------------------
# 9. Optional application toolchains
# -----------------------------------------------------------------------------

section "Optional toolchains (skipped if absent)"

if [[ -f "package.json" ]]; then
  pass "package.json detected"

  if command -v npm >/dev/null 2>&1; then
    echo "      NOTE: canonical TypeScript validation is not configured yet."
  else
    warn "package.json exists but npm is unavailable"
  fi
else
  pass "no package.json yet (skip TypeScript validation)"
fi

if [[ -f "CMakeLists.txt" || -f "cpp/CMakeLists.txt" ]]; then
  pass "C++ build manifest detected"
  echo "      NOTE: canonical C++ build/test validation is not configured yet."
else
  pass "no C++ build manifest yet (skip)"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

echo
echo "========================================"
echo " Summary"
echo "========================================"
echo " passed:   $passed"
echo " failed:   $failed"
echo " warnings: $warnings"
echo

if (( failed > 0 )); then
  echo "VERIFY FAILED"
  exit 1
fi

if (( warnings > 0 )); then
  echo "VERIFY PASSED WITH WARNINGS"
  exit 0
fi

echo "VERIFY PASSED"
exit 0
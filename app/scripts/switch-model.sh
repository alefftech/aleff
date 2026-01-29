#!/bin/bash
# ANCHOR: switch-model-script
# ================================================================
# switch-model.sh - Quick LLM model switching for Aleff/Moltbot
# ================================================================
# Usage: ./switch-model.sh <preset>
#
# Presets:
#   cheap    - DeepSeek Chat (~$0.14/1M tokens, 99% savings)
#   best     - Claude Opus 4.5 (highest quality)
#   fast     - Claude Haiku 3.5 (fast responses)
#   local    - Ollama local (free, offline)
#   think    - DeepSeek Reasoner R1 (reasoning tasks)
#   fallback - Enable full fallback chain
#   status   - Show current configuration
#
# Example:
#   ./switch-model.sh cheap    # Switch to DeepSeek for cost savings
#   ./switch-model.sh status   # Check current model
# ================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config file path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../data/moltbot.json"

# Model presets
declare -A MODELS=(
  ["cheap"]="deepseek/deepseek-chat"
  ["best"]="anthropic/claude-opus-4-5"
  ["fast"]="anthropic/claude-haiku-3-5"
  ["local"]="ollama/llama3.3"
  ["think"]="deepseek/deepseek-reasoner"
)

# Cost info (per 1M tokens)
declare -A COSTS=(
  ["deepseek/deepseek-chat"]="$0.14 input / $0.28 output"
  ["deepseek/deepseek-reasoner"]="$0.55 input / $2.19 output"
  ["anthropic/claude-opus-4-5"]="$15.00 input / $75.00 output"
  ["anthropic/claude-haiku-3-5"]="$0.80 input / $4.00 output"
  ["ollama/llama3.3"]="FREE (local)"
)

# Required env vars per provider
declare -A ENV_VARS=(
  ["deepseek"]="DEEPSEEK_API_KEY"
  ["anthropic"]="ANTHROPIC_API_KEY"
  ["ollama"]="OLLAMA_API_KEY"
  ["openrouter"]="OPENROUTER_API_KEY"
)

print_header() {
  echo ""
  echo -e "${BLUE}================================================================${NC}"
  echo -e "${BLUE}  Aleff Multi-LLM Switcher${NC}"
  echo -e "${BLUE}================================================================${NC}"
  echo ""
}

print_usage() {
  echo "Usage: $0 <preset>"
  echo ""
  echo "Presets:"
  echo "  cheap    - DeepSeek Chat (~\$0.14/1M, 99% savings vs Claude)"
  echo "  best     - Claude Opus 4.5 (highest quality)"
  echo "  fast     - Claude Haiku 3.5 (fast responses)"
  echo "  local    - Ollama local (free, offline capable)"
  echo "  think    - DeepSeek Reasoner R1 (complex reasoning)"
  echo "  fallback - Enable automatic fallback chain"
  echo "  status   - Show current configuration"
  echo ""
  echo "Examples:"
  echo "  $0 cheap     # Switch to DeepSeek for cost savings"
  echo "  $0 fallback  # Enable fallback: Claude -> OpenRouter -> DeepSeek -> Ollama"
  echo "  $0 status    # Check current model and env vars"
}

check_env_var() {
  local provider="$1"
  local env_var="${ENV_VARS[$provider]}"

  if [[ -z "$env_var" ]]; then
    return 0
  fi

  if [[ -z "${!env_var}" ]]; then
    echo -e "${YELLOW}[WARN]${NC} $env_var not set"
    return 1
  else
    echo -e "${GREEN}[OK]${NC} $env_var is configured"
    return 0
  fi
}

get_provider() {
  local model="$1"
  echo "${model%%/*}"
}

show_status() {
  print_header

  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}[ERROR]${NC} Config file not found: $CONFIG_FILE"
    exit 1
  fi

  echo -e "${YELLOW}Current Configuration:${NC}"
  echo ""

  # Extract current model config using jq
  if command -v jq &> /dev/null; then
    local primary=$(jq -r '.agents.defaults.model.primary // "not configured"' "$CONFIG_FILE")
    local fallbacks=$(jq -r '.agents.defaults.model.fallbacks // [] | join(", ")' "$CONFIG_FILE")

    echo -e "  Primary model: ${GREEN}$primary${NC}"

    if [[ -n "$fallbacks" && "$fallbacks" != "" ]]; then
      echo -e "  Fallback chain: ${BLUE}$fallbacks${NC}"
    else
      echo -e "  Fallback chain: ${YELLOW}none${NC}"
    fi

    # Show cost for current model
    local cost="${COSTS[$primary]}"
    if [[ -n "$cost" ]]; then
      echo -e "  Cost: ${YELLOW}$cost${NC}"
    fi
  else
    echo -e "${YELLOW}[WARN]${NC} jq not installed, cannot parse config"
    grep -A5 '"model":' "$CONFIG_FILE" || true
  fi

  echo ""
  echo -e "${YELLOW}Environment Variables:${NC}"
  echo ""

  for provider in "${!ENV_VARS[@]}"; do
    check_env_var "$provider"
  done

  echo ""
}

switch_model() {
  local preset="$1"
  local model="${MODELS[$preset]}"

  if [[ -z "$model" ]]; then
    echo -e "${RED}[ERROR]${NC} Unknown preset: $preset"
    print_usage
    exit 1
  fi

  local provider=$(get_provider "$model")

  print_header
  echo -e "Switching to: ${GREEN}$model${NC} (preset: $preset)"
  echo ""

  # Check env var
  if ! check_env_var "$provider"; then
    echo ""
    echo -e "${YELLOW}[WARN]${NC} Provider may not work without API key"
    echo ""
  fi

  # Update config using jq
  if command -v jq &> /dev/null; then
    local tmp_file=$(mktemp)
    jq --arg model "$model" '.agents.defaults.model.primary = $model' "$CONFIG_FILE" > "$tmp_file"
    mv "$tmp_file" "$CONFIG_FILE"

    echo -e "${GREEN}[SUCCESS]${NC} Updated primary model to: $model"

    # Show cost info
    local cost="${COSTS[$model]}"
    if [[ -n "$cost" ]]; then
      echo -e "  Cost: ${YELLOW}$cost${NC}"
    fi
  else
    echo -e "${RED}[ERROR]${NC} jq is required for config updates"
    echo "Install with: apt-get install jq"
    exit 1
  fi

  echo ""
  echo -e "${BLUE}[INFO]${NC} Restart container to apply changes:"
  echo "  docker restart aleffai"
  echo ""
}

enable_fallback() {
  print_header
  echo -e "Enabling full fallback chain..."
  echo ""

  local fallback_chain='["openrouter/anthropic/claude-sonnet-4-5","deepseek/deepseek-chat","ollama/llama3.3"]'

  if command -v jq &> /dev/null; then
    local tmp_file=$(mktemp)
    jq --argjson fallbacks "$fallback_chain" '.agents.defaults.model.fallbacks = $fallbacks' "$CONFIG_FILE" > "$tmp_file"
    mv "$tmp_file" "$CONFIG_FILE"

    echo -e "${GREEN}[SUCCESS]${NC} Fallback chain enabled:"
    echo ""
    echo "  Primary: anthropic/claude-opus-4-5"
    echo "     ↓ (error/rate-limit/timeout)"
    echo "  Fallback 1: openrouter/anthropic/claude-sonnet-4-5"
    echo "     ↓"
    echo "  Fallback 2: deepseek/deepseek-chat"
    echo "     ↓"
    echo "  Fallback 3: ollama/llama3.3 (local)"
  else
    echo -e "${RED}[ERROR]${NC} jq is required for config updates"
    exit 1
  fi

  echo ""
  echo -e "${YELLOW}Environment check:${NC}"
  for provider in anthropic openrouter deepseek ollama; do
    check_env_var "$provider"
  done

  echo ""
  echo -e "${BLUE}[INFO]${NC} Restart container to apply changes:"
  echo "  docker restart aleffai"
  echo ""
}

# Main
case "${1:-}" in
  cheap|best|fast|local|think)
    switch_model "$1"
    ;;
  fallback)
    enable_fallback
    ;;
  status)
    show_status
    ;;
  -h|--help|"")
    print_header
    print_usage
    ;;
  *)
    echo -e "${RED}[ERROR]${NC} Unknown command: $1"
    print_usage
    exit 1
    ;;
esac

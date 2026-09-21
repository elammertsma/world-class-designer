#!/usr/bin/env bash
# Installs the world-class-designer skill and its three agents (design-critic, design-brief-writer, design-spot-check) into Claude Code.
#   ./install.sh            -> personal install (~/.claude), available in every project
#   ./install.sh --project  -> project install (./.claude in the current directory), commit to share with a team
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${1:-}" == "--project" ]]; then
  ROOT="$(pwd)/.claude"
else
  ROOT="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
fi

SKILLS="$ROOT/skills"
AGENTS="$ROOT/agents"
mkdir -p "$SKILLS" "$AGENTS"

rm -rf "$SKILLS/designer"
cp -R "$HERE/skills/designer" "$SKILLS/designer"
cp "$HERE"/agents/*.md "$AGENTS/"

echo "Installed:"
echo "  skill  -> $SKILLS/designer/SKILL.md"
echo "  agents -> $AGENTS/design-critic.md, design-brief-writer.md, design-spot-check.md"
echo
echo "Environment check:"
node "$SKILLS/designer/scripts/check-env.mjs" || true
echo
echo "Next: open Claude Code in a project and run  /designer landing page for <your product>"

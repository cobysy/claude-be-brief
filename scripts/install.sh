#!/usr/bin/env bash
# Copies the hooks into ~/.claude/hooks and registers them in ~/.claude/settings.json.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"

command -v node >/dev/null || { echo "node is required" >&2; exit 1; }

mkdir -p "$CLAUDE_DIR/hooks"
cp "$REPO_DIR/hooks/brief-comments.js" "$REPO_DIR/hooks/brief-reply.js" "$CLAUDE_DIR/hooks/"
chmod +x "$CLAUDE_DIR/hooks/brief-comments.js" "$CLAUDE_DIR/hooks/brief-reply.js"

[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
cp "$SETTINGS" "$SETTINGS.bak"

node - "$SETTINGS" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const settings = JSON.parse(fs.readFileSync(path, 'utf8'));
const hooks = (settings.hooks ??= {});

// An existing entry is left alone: the user may have tuned the matcher or chained commands.
function register(event, matcher, command) {
    const entries = (hooks[event] ??= []);
    const already = JSON.stringify(entries).includes(command);

    if (already) {
        console.log(`  ${event}: already registered`);
        return;
    }

    entries.push({
        ...(matcher ? { matcher } : {}),
        hooks: [{ type: 'command', command }]
    });
    console.log(`  ${event}: registered`);
}

register('PostToolUse', 'Edit|Write', 'node $HOME/.claude/hooks/brief-comments.js');
register('Stop', null, 'node $HOME/.claude/hooks/brief-reply.js');

fs.writeFileSync(path, JSON.stringify(settings, null, 2) + '\n');
NODE

echo "Installed. Backup at $SETTINGS.bak"

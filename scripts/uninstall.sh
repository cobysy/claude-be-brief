#!/usr/bin/env bash
# Removes the hook entries from ~/.claude/settings.json and deletes the copied hook files.
set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"

[ -f "$SETTINGS" ] || { echo "no settings at $SETTINGS" >&2; exit 1; }
cp "$SETTINGS" "$SETTINGS.bak"

node - "$SETTINGS" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const settings = JSON.parse(fs.readFileSync(path, 'utf8'));
const hooks = settings.hooks ?? {};

for (const [event, entries] of Object.entries(hooks)) {
    if (!Array.isArray(entries)) continue;

    hooks[event] = entries.filter(
        (entry) => !JSON.stringify(entry).includes('/hooks/brief-')
    );
}

fs.writeFileSync(path, JSON.stringify(settings, null, 2) + '\n');
NODE

rm -f "$CLAUDE_DIR/hooks/brief-comments.js" "$CLAUDE_DIR/hooks/brief-reply.js"
echo "Removed. Backup at $SETTINGS.bak"

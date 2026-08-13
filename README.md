<h1 align="center">claude-be-brief</h1>

<p align="center">
  Two hooks that stop Claude Code writing five paragraphs<br>
  where three sentences would do.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license">
  <img src="https://img.shields.io/badge/Claude%20Code-hooks-6f42c1" alt="Claude Code hooks">
</p>

---

A brevity rule in `CLAUDE.md` is a suggestion. Claude follows it for a while, then drifts —
matching a verbose file's comment style, or letting a reply sprawl fifteen tool calls into a
long turn. The rule is still in context. It just stopped winning.

These hooks make it win, by blocking instead of reminding.

| Hook | Fires on | Blocks when |
| --- | --- | --- |
| `brief-comments.js` | `PostToolUse` — `Edit`, `Write` | The text just written contains a comment block over 2 prose lines |
| `brief-reply.js` | `Stop` | The reply Claude just finished is over 3 sentences |

Both exit `2`, so the message goes back to Claude as an instruction and it rewrites. You see the
corrected version, not the block.

## Install

```bash
git clone https://github.com/cobysy/claude-be-brief.git ~/.claude/claude-be-brief
~/.claude/claude-be-brief/scripts/install.sh
```

The installer copies the hooks to `~/.claude/hooks/` and registers them in
`~/.claude/settings.json`. It backs the file up first and refuses to touch existing entries.

Then paste [`references/rule.md`](references/rule.md) into your `~/.claude/CLAUDE.md` — the hooks
enforce the ceilings, that file explains what to write instead.

## What it does not catch

`brief-comments.js` reads only the text of the current edit, so long comments already in a file
never trip it. `brief-reply.js` sees only the final assistant message of a turn, and counts
sentences with a regex — code fences, inline code, links and common abbreviations are stripped
first, but an unusual reply can still be miscounted by one.

Both are guards against drift, not proof of brevity.

## Uninstall

```bash
~/.claude/claude-be-brief/scripts/uninstall.sh
```

## License

MIT

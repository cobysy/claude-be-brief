#!/usr/bin/env node
// PostToolUse guard for the "Be Brief" comment ceiling: 2 lines per code comment.
// Only inspects text written by THIS edit, so legacy comments never trip it.

'use strict';

const MAX_COMMENT_LINES = 2;
const SKIP_EXTENSIONS = ['.md', '.mdx', '.txt', '.json', '.lock'];

const COMMENT_LINE = /^\s*(\/\/|#|--|\*|\/\*|<!--)/;
// Block delimiters and bare `*` carry no prose, so they do not count towards the ceiling.
const DELIMITER_ONLY = /^\s*(\/\*+|\*+\/|\*|<!--|-->)\s*$/;

function readStdin() {
    try {
        return require('fs').readFileSync(0, 'utf8');
    } catch {
        return '';
    }
}

function newText(payload) {
    const input = payload.tool_input ?? {};

    return input.new_string ?? input.content ?? '';
}

// Longest run of consecutive comment lines, counting prose lines only.
function longestCommentRun(text) {
    let longest = 0;
    let current = 0;

    for (const line of text.split('\n')) {
        if (!COMMENT_LINE.test(line)) {
            current = 0;
            continue;
        }

        if (!DELIMITER_ONLY.test(line)) {
            current += 1;
        }

        longest = Math.max(longest, current);
    }

    return longest;
}

const raw = readStdin();

if (!raw.trim()) {
    process.exit(0);
}

let payload;

try {
    payload = JSON.parse(raw);
} catch {
    process.exit(0);
}

const filePath = payload.tool_input?.file_path ?? '';

if (SKIP_EXTENSIONS.some((extension) => filePath.endsWith(extension))) {
    process.exit(0);
}

const run = longestCommentRun(newText(payload));

if (run > MAX_COMMENT_LINES) {
    process.stderr.write(
        `Be Brief: a ${run}-line comment block was just written to ${filePath}. Ceiling is ${MAX_COMMENT_LINES} lines — cut it to what the code cannot say, then move on.\n`
    );
    process.exit(2);
}

process.exit(0);

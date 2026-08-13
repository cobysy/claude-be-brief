#!/usr/bin/env node
// Stop guard for the "Be Brief" chat ceiling: 3 sentences per reply.
'use strict';

const fs = require('fs');

const MAX_SENTENCES = 3;
const ABBREVIATIONS = /\b(e\.g|i\.e|vs|etc|approx|no|fig|dr|mr|ms|inc|ltd)\./gi;

function lastAssistantText(transcriptPath) {
    let lines;

    try {
        lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    } catch {
        return '';
    }

    for (let i = lines.length - 1; i >= 0; i -= 1) {
        let entry;

        try {
            entry = JSON.parse(lines[i]);
        } catch {
            continue;
        }

        if (entry.type !== 'assistant') {
            continue;
        }

        const content = entry.message?.content ?? [];
        const text = content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n')
            .trim();

        if (text) {
            return text;
        }
    }

    return '';
}

// Code, paths and abbreviations own most of the dots in a technical reply, so they are
// removed before anything is counted as a sentence end.
function stripNonProse(text) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(ABBREVIATIONS, ' ');
}

function countSentences(text) {
    const prose = stripNonProse(text);
    const terminated = prose.match(/[.!?]+(\s|$)/g) ?? [];
    // A bullet without a full stop is still a statement the ceiling has to see.
    const openItems = prose
        .split('\n')
        .filter((line) => /^\s*([-*+]|\d+\.)\s+\S/.test(line))
        .filter((line) => !/[.!?]\s*$/.test(line));

    return terminated.length + openItems.length;
}

let payload;

try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
    process.exit(0);
}

// WHY: without this the block would re-fire on the rewrite and never let the turn end.
if (payload.stop_hook_active) {
    process.exit(0);
}

const reply = lastAssistantText(payload.transcript_path ?? '');
const sentences = countSentences(reply);

if (sentences > MAX_SENTENCES) {
    process.stderr.write(
        `Be Brief: that reply is ${sentences} sentences, ceiling is ${MAX_SENTENCES}. Say it again shorter — answer first, cut anything the diff, the code or the scrollback already carries.\n`
    );
    process.exit(2);
}

process.exit(0);

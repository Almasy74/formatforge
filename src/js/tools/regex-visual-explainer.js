import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout tool-layout-column">
            <div class="tool-row mb-20">
                <input type="text" id="input-regex" class="tool-input-regex" placeholder="Regular expression (example: ^[a-z0-9_-]{3,16}$)" />
                <input type="text" id="input-flags" class="tool-input-flags" placeholder="Flags" value="g" />
            </div>

            <div class="tool-flex-row-wrap">
                <div class="tool-panel tool-input-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label for="input-text">Test String</label>
                        <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                    </div>
                    <textarea id="input-text" class="tool-textarea-fill tool-textarea-code-nowrap" placeholder="Paste test text here..."></textarea>
                </div>

                <div class="tool-panel tool-output-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label>Live Matches</label>
                        <button id="btn-copy" class="btn primary btn-sm">Copy Matches</button>
                    </div>
                    <pre id="match-output" class="tool-pre-output"></pre>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column tool-mt-20">
                <label>Regex Visual Explanation</label>
                <pre id="explain-output" class="tool-pre-output"></pre>
            </div>
        </div>
    `;
}

const inRegex = $('#input-regex');
const inFlags = $('#input-flags');
const inText = $('#input-text');
const matchOutput = $('#match-output');
const explainOutput = $('#explain-output');
const btnCopy = $('#btn-copy');

const tokenDictionary = {
    '\\d': 'Digit (0-9)',
    '\\D': 'Not a digit',
    '\\w': 'Word character (a-z, A-Z, 0-9, underscore)',
    '\\W': 'Not a word character',
    '\\s': 'Whitespace character',
    '\\S': 'Not whitespace',
    '\\b': 'Word boundary',
    '\\B': 'Not a word boundary',
    '.': 'Any character (except newline by default)',
    '^': 'Start of line/string anchor',
    '$': 'End of line/string anchor',
    '*': 'Repeat previous token 0 or more times',
    '+': 'Repeat previous token 1 or more times',
    '?': 'Previous token optional (0 or 1)',
    '|': 'Alternation (OR)',
    '()': 'Capturing group',
    '(?:)': 'Non-capturing group',
    '[]': 'Character class',
    '{}': 'Quantifier range'
};

const explainRegex = (pattern) => {
    const lines = [];
    let i = 0;

    while (i < pattern.length) {
        const ch = pattern[i];
        const next = pattern[i + 1] || '';

        if (ch === '\\') {
            const esc = `\\${next}`;
            lines.push(`- ${esc}: ${tokenDictionary[esc] || 'Escaped literal or token'}`);
            i += 2;
            continue;
        }

        if (ch === '(' && pattern.slice(i, i + 3) === '(?:') {
            lines.push(`- (?: ): ${tokenDictionary['(?:)']}`);
            i += 3;
            continue;
        }

        if (ch === '(' || ch === ')') {
            lines.push(`- ${ch}: ${tokenDictionary['()']}`);
            i += 1;
            continue;
        }

        if (ch === '[') {
            const close = pattern.indexOf(']', i + 1);
            const cls = close > -1 ? pattern.slice(i, close + 1) : pattern.slice(i);
            lines.push(`- ${cls}: ${tokenDictionary['[]']}`);
            i = close > -1 ? close + 1 : pattern.length;
            continue;
        }

        if (ch === '{') {
            const close = pattern.indexOf('}', i + 1);
            const q = close > -1 ? pattern.slice(i, close + 1) : '{...}';
            lines.push(`- ${q}: ${tokenDictionary['{}']}`);
            i = close > -1 ? close + 1 : pattern.length;
            continue;
        }

        if (tokenDictionary[ch]) {
            lines.push(`- ${ch}: ${tokenDictionary[ch]}`);
        } else {
            lines.push(`- ${ch}: Literal character '${ch}'`);
        }
        i += 1;
    }

    return lines.join('\n');
};

const process = () => {
    const pattern = inRegex.value;
    const flags = inFlags.value;
    const text = inText.value;

    if (!pattern) {
        matchOutput.textContent = 'Enter a regex pattern to start.';
        explainOutput.textContent = 'Regex explanation appears here.';
        return;
    }

    explainOutput.textContent = explainRegex(pattern);

    try {
        const regex = new RegExp(pattern, flags);
        const results = [];

        if (regex.global) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                results.push(`Match "${match[0]}" at index ${match.index}`);
                if (match.length > 1) {
                    const groups = match.slice(1).map((g, idx) => `  Group ${idx + 1}: ${g}`);
                    results.push(...groups);
                }
                if (match.index === regex.lastIndex) regex.lastIndex++;
            }
        } else {
            const match = regex.exec(text);
            if (match) {
                results.push(`Match "${match[0]}" at index ${match.index}`);
                if (match.length > 1) {
                    const groups = match.slice(1).map((g, idx) => `  Group ${idx + 1}: ${g}`);
                    results.push(...groups);
                }
            }
        }

        matchOutput.textContent = results.length ? results.join('\n') : 'No matches found.';
    } catch (err) {
        matchOutput.textContent = `Invalid regex: ${err.message}`;
    }
};

on(inRegex, 'input', process);
on(inFlags, 'input', process);
on(inText, 'input', process);

on(btnCopy, 'click', () => {
    if (!matchOutput.textContent) return;
    copyToClipboard(matchOutput.textContent, btnCopy);
});

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => inText, { onPaste: () => process() });

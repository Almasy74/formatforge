import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-row mb-20">
                <input type="text" id="input-regex" class="tool-input-regex" placeholder="Regular expression (e.g. \\\\d+)">
                <input type="text" id="input-flags" class="tool-input-flags" placeholder="Flags (e.g. g, i, m)" value="g">
            </div>
            <div class="tool-label-row">
                <label>Test String</label>
                <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
            </div>
            <textarea id="input-text" class="tool-textarea-lg" placeholder="Test string..."></textarea>
            <div class="output-wrapper">
                <div class="tool-label-row">
                    <h3 class="tool-subheading">Matches</h3>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Matches</button>
                </div>
                <pre id="regex-output" class="tool-pre-output"></pre>
            </div>
        </div>
    `;
}

const inRegex = $('#input-regex');
const inFlags = $('#input-flags');
const inText = $('#input-text');
const outRegex = $('#regex-output');

const processRegex = () => {
    try {
        outRegex.style.color = '#333';
        if (!inRegex.value) {
            outRegex.textContent = 'Enter a regular expression above.';
            return;
        }
        const regex = new RegExp(inRegex.value, inFlags.value);
        const text = inText.value;

        let match;
        let results = [];

        if (regex.global) {
            while ((match = regex.exec(text)) !== null) {
                results.push(`Found '${match[0]}' at position ${match.index}`);
                if (match.index === regex.lastIndex) regex.lastIndex++; // prevent infinite loops
            }
        } else {
            match = regex.exec(text);
            if (match) results.push(`Found '${match[0]}' at position ${match.index}`);
        }

        if (results.length > 0) {
            outRegex.textContent = results.join('\n');
        } else {
            outRegex.textContent = 'No matches found.';
        }
    } catch (e) {
        outRegex.style.color = 'red';
        outRegex.textContent = 'Invalid Regular Expression: ' + e.message;
    }
};

on(inRegex, 'input', processRegex);
on(inFlags, 'input', processRegex);
on(inText, 'input', processRegex);

const outCopyBtn = $('#btn-copy');
if (outCopyBtn) {
    on(outCopyBtn, 'click', () => {
        if (!outRegex.textContent) return;
        copyToClipboard(outRegex.textContent, outCopyBtn);
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

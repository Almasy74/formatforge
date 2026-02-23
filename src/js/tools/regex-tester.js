import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="input-regex" placeholder="Regular expression (e.g. \\\\d+)" style="flex:1; padding:10px; font-family:monospace;">
                <input type="text" id="input-flags" placeholder="Flags (e.g. g, i, m)" value="g" style="width:100px; padding:10px; font-family:monospace;">
            </div>
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label style="font-weight: bold;">Test String</label>
                <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
            </div>
            <textarea id="input-text" placeholder="Test string..." style="width:100%; height:150px; padding:10px; font-family:monospace; margin-bottom: 20px;"></textarea>
            <div class="output-wrapper">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <h3 style="margin: 0; font-size:16px;">Matches</h3>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Matches</button>
                </div>
                <pre id="regex-output" style="background:#f4f4f4; padding:15px; min-height:100px; font-family:monospace;"></pre>
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
            outRegex.textContent = results.join('\\n');
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
        navigator.clipboard.writeText(outRegex.textContent);
        const originalText = outCopyBtn.textContent;
        outCopyBtn.textContent = 'Copied!';
        setTimeout(() => outCopyBtn.textContent = originalText, 2000);
    });
}

// Automatic Paste Binding
setTimeout(() => {

    const btnPaste = $('#btn-paste');
    if (btnPaste) {
        on(btnPaste, 'click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const input = $('#input-data') || $('#input-text') || document.querySelector('textarea');
                if (input) {
                    input.value = text;
                    input.dispatchEvent(new Event('input'));
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
            }
        });
    }

}, 100);

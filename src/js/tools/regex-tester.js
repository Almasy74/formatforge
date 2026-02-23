import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="input-regex" placeholder="Regular expression (e.g. \\\\d+)" style="flex:1; padding:10px; font-family:monospace;">
                <input type="text" id="input-flags" placeholder="Flags (e.g. g, i, m)" value="g" style="width:100px; padding:10px; font-family:monospace;">
            </div>
            <textarea id="input-text" placeholder="Test string..." style="width:100%; height:150px; padding:10px; font-family:monospace; margin-bottom: 20px;"></textarea>
            <div class="output-wrapper">
                <h3>Matches:</h3>
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
                results.push(\`Found '\${match[0]}' at position \${match.index}\`);
                if (match.index === regex.lastIndex) regex.lastIndex++; // prevent infinite loops
            }
        } else {
            match = regex.exec(text);
            if (match) results.push(\`Found '\${match[0]}' at position \${match.index}\`);
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

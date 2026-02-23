import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: Text to Convert</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste text you want to convert..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Select Case</h3>
                    
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                        <input type="radio" name="mode" value="lower" checked>
                        <span>lowercase</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="upper">
                        <span>UPPERCASE</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="title">
                        <span>Title Case</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="sentence">
                        <span>Sentence case</span>
                    </label>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                        <input type="radio" name="mode" value="camel">
                        <span>camelCase</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="snake">
                        <span>snake_case</span>
                    </label>
                     <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="kebab">
                        <span>kebab-case</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="pascal">
                        <span>PascalCase</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output: Converted Result</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Text</button>
                </div>
                <textarea id="output-data" readonly placeholder="Output will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const modeRadios = Array.from(document.querySelectorAll('input[name="mode"]'));

    // Text Transformation functions
    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/\\b[a-z](?=[a-z]{2})/g, function (letter) {
            return letter.toUpperCase();
        });
    };

    const toSentenceCase = (str) => {
        // Simple sentence case: Capitalize very first letter, and first letter after a dot, exclamation, or question mark.
        return str.toLowerCase().replace(/(^\\s*|[.!?]\\s+)([a-z])/g, (match) => {
            return match.toUpperCase();
        });
    };

    // Words tokenizer for programming cases
    const getWords = (str) =>
        str.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .split(/\s+/);

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
    const convertCase = () => {
        let text = inputData.value;
        if (!text) {
            outputData.value = '';
            return;
        }

        const mode = document.querySelector('input[name="mode"]:checked').value;
        let result = '';

        if (mode === 'lower') {
            result = text.toLowerCase();
        } else if (mode === 'upper') {
            result = text.toUpperCase();
        } else if (mode === 'title') {
            // Simplified Title Case
            result = toTitleCase(text);
        } else if (mode === 'sentence') {
            result = toSentenceCase(text);
        } else if (mode === 'camel' || mode === 'snake' || mode === 'kebab' || mode === 'pascal') {
            // Programming cases apply line by line usually, or across the whole text if it's one block.
            // Let's do it per line to respect user's multi-line inputs
            const lines = text.split(/\\r?\\n/);
            const transformedLines = lines.map(line => {
                if (!line.trim()) return '';
                const words = getWords(line);
                if (words.length === 0) return '';

                if (mode === 'camel') {
                    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                } else if (mode === 'pascal') {
                    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                } else if (mode === 'snake') {
                    return words.map(w => w.toLowerCase()).join('_');
                } else if (mode === 'kebab') {
                    return words.map(w => w.toLowerCase()).join('-');
                }
            });
            result = transformedLines.join('\\n');
        }

        outputData.value = result;
    };

    // Instant output reactivity
    on(inputData, 'input', convertCase);

    // Process when options change
    modeRadios.forEach(radio => on(radio, 'change', convertCase));

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value);
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => btnCopy.textContent = originalText, 2000);
    });
}

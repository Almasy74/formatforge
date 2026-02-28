import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: Text to Convert</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill" autofocus placeholder="Paste text you want to convert..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Select Case</h3>
                    
                    <label class="option-row">
                        <input type="radio" name="mode" value="lower" checked>
                        <span>lowercase</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="upper">
                        <span>UPPERCASE</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="title">
                        <span>Title Case</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="sentence">
                        <span>Sentence case</span>
                    </label>
                    <hr class="tool-divider">
                    <label class="option-row">
                        <input type="radio" name="mode" value="camel">
                        <span>camelCase</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="snake">
                        <span>snake_case</span>
                    </label>
                     <label class="option-row">
                        <input type="radio" name="mode" value="kebab">
                        <span>kebab-case</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="pascal">
                        <span>PascalCase</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output: Converted Result</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Text</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output" readonly placeholder="Output will appear here instantly..."></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const modeRadios = Array.from(document.querySelectorAll('input[name="mode"]'));

    // Text Transformation functions
    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/\b[a-z](?=[a-z]{2})/g, function (letter) {
            return letter.toUpperCase();
        });
    };

    const toSentenceCase = (str) => {
        // Simple sentence case: Capitalize very first letter, and first letter after a dot, exclamation, or question mark.
        return str.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (match) => {
            return match.toUpperCase();
        });
    };

    // Words tokenizer for programming cases
    const getWords = (str) =>
        str.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .split(/\s+/);

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
            const lines = text.split(/\r?\n/);
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
            result = transformedLines.join('\n');
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
        copyToClipboard(outputData.value, btnCopy);
    });
}

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

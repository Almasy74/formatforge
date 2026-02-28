import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: Messy Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill" autofocus placeholder="Paste text with unwanted line breaks here..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Options</h3>
                    <label class="option-row option-row-first">
                        <input type="radio" name="mode" value="all" checked>
                        <span>Remove All Line Breaks</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="paragraphs">
                        <span>Preserve Paragraphs</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output: Clean Text</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Text</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output" readonly placeholder="Cleaned text will appear here instantly..."></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const modeRadios = Array.from(document.querySelectorAll('input[name="mode"]'));

    const processText = () => {
        let text = inputData.value;
        if (!text) {
            outputData.value = '';
            return;
        }

        const mode = document.querySelector('input[name="mode"]:checked').value;

        if (mode === 'all') {
            // Replace all line breaks with a single space
            // Also reduce multiple spaces to a single space
            outputData.value = text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        } else if (mode === 'paragraphs') {
            // Replace single line breaks with a space, but preserve double line breaks
            // 1. Standardize line breaks
            let normalized = text.replace(/\r\n/g, '\n');
            // 2. Temporarily protect double+ line breaks
            normalized = normalized.replace(/\n{2,}/g, '___PARAGRAPH_BREAK___');
            // 3. Replace single line breaks with spaces
            normalized = normalized.replace(/\n/g, ' ');
            // 4. Clean up multiple spaces
            normalized = normalized.replace(/ {2,}/g, ' ');
            // 5. Restore paragraphs
            outputData.value = normalized.replace(/___PARAGRAPH_BREAK___/g, '\n\n').trim();
        }
    };

    // Instant output reactivity
    on(inputData, 'input', processText);

    // Process when options change
    modeRadios.forEach(radio => on(radio, 'change', processText));

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value, btnCopy);
    });
}

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

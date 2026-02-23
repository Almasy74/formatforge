import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: Messy Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste text with unwanted line breaks here..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Options</h3>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                        <input type="radio" name="mode" value="all" checked>
                        <span>Remove All Line Breaks</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="radio" name="mode" value="paragraphs">
                        <span>Preserve Paragraphs</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output: Clean Text</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Text</button>
                </div>
                <textarea id="output-data" readonly placeholder="Cleaned text will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
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
        copyToClipboard(outputData.value);
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => btnCopy.textContent = originalText, 2000);
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

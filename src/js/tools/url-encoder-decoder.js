import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill tool-text-md" autofocus placeholder="Paste the text or URL you want to encode or decode here..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Action</h3>
                    
                    <label class="option-row tool-text-md">
                        <input type="radio" name="url-action" value="encode" checked>
                        <span>Encode</span>
                    </label>
                    <label class="option-row tool-text-md">
                        <input type="radio" name="url-action" value="decode">
                        <span>Decode</span>
                    </label>
                </div>

                <div id="error-msg" class="tool-alert"></div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Result</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output tool-text-md" readonly placeholder="Result will appear here instantly..."></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const errorMsg = $('#error-msg');

    // NodeList of radio buttons
    const radios = document.querySelectorAll('input[name="url-action"]');

    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        outputData.value = '';
    };

    const hideError = () => {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
    };

    const processURL = () => {
        let text = inputData.value;
        hideError();

        if (!text) {
            outputData.value = '';
            return;
        }

        let action = 'encode';
        radios.forEach(r => {
            if (r.checked) action = r.value;
        });

        try {
            if (action === 'encode') {
                // We use encodeURIComponent to escape all parameters securely
                outputData.value = encodeURIComponent(text);
            } else {
                outputData.value = decodeURIComponent(text);
            }
        } catch (err) {
            showError("Error processing URL: " + err.message);
        }
    };

    // Instant reactivity
    on(inputData, 'input', processURL);

    // Process when options change
    radios.forEach(r => on(r, 'change', processURL));

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value, btnCopy);
    });
}

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

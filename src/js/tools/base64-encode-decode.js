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
                <textarea id="input-data" class="tool-textarea-fill tool-text-md" autofocus placeholder="Paste the text or Base64 string you want to convert here..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Action</h3>
                    
                    <label class="option-row tool-text-md">
                        <input type="radio" name="b64-action" value="encode" checked>
                        <span>Encode to Base64</span>
                    </label>
                    <label class="option-row tool-text-md">
                        <input type="radio" name="b64-action" value="decode">
                        <span>Decode from Base64</span>
                    </label>
                </div>

                <div id="error-msg" class="tool-alert"></div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Result</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output tool-text-md tool-output-break-anywhere" readonly placeholder="Result will appear here instantly..."></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const errorMsg = $('#error-msg');

    // NodeList of radio buttons
    const radios = document.querySelectorAll('input[name="b64-action"]');

    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        outputData.value = '';
    };

    const hideError = () => {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
    };

    // Helper functions for UTF-8 Base64 encoding/decoding
    const encodeUTF8Base64 = (str) => {
        return btoa(unescape(encodeURIComponent(str)));
    };

    const decodeUTF8Base64 = (str) => {
        // Handle URL safe base64
        let bstr = str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with =
        while (bstr.length % 4) {
            bstr += '=';
        }
        return decodeURIComponent(escape(atob(bstr)));
    };

    const processBase64 = () => {
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
                outputData.value = encodeUTF8Base64(text);
            } else {
                // Ensure text has no extra whitespaces when decoding base64
                text = text.replace(/\s/g, '');
                outputData.value = decodeUTF8Base64(text);
            }
        } catch (err) {
            showError("Error processing Base64: Invalid Input Data");
        }
    };

    // Instant reactivity
    on(inputData, 'input', processBase64);

    // Process when options change
    radios.forEach(r => on(r, 'change', processBase64));

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value, btnCopy);
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

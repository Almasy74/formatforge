import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste the text or URL you want to encode or decode here..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px; font-size: 15px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Action</h3>
                    
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 15px; cursor: pointer; margin-bottom: 8px;">
                        <input type="radio" name="url-action" value="encode" checked>
                        <span>Encode</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 15px; cursor: pointer;">
                        <input type="radio" name="url-action" value="decode">
                        <span>Decode</span>
                    </label>
                </div>

                <div id="error-msg" style="display: none; background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; font-size: 13px; border-left: 3px solid #c62828;"></div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Result</button>
                </div>
                <textarea id="output-data" readonly placeholder="Result will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; font-size: 15px; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
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

import { $, on, show, hide } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-controls">
            <button id="btn-format" class="btn primary text-sm" style="padding: 8px 16px; font-size: 14px;">Format JSON</button>
            <button id="btn-minify" class="btn secondary text-sm" style="padding: 8px 16px; font-size: 14px; margin-top: 0; width: auto;">Minify JSON</button>
        </div>
        <div class="tool-layout-split" style="display:flex; flex-direction:column; gap:20px;">
            <div style="width: 100%; display: flex; flex-direction: column;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label style="font-weight: bold;">Input JSON</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center; margin-top: 0;">Paste JSON</button>
                </div>
                <textarea id="input-json" placeholder="Paste your JSON here..." style="width:100%; height:300px; padding:10px; font-family:monospace; margin-bottom: 20px;"></textarea>
            </div>
            <div class="output-wrapper" style="width:100%; position:relative; display: flex; flex-direction: column;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label style="font-weight: bold;">Output JSON</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy JSON</button>
                </div>
                <pre id="output-json" style="background:#f4f4f4; padding:15px; min-height:300px; overflow-x:auto; margin-top:0; border: 1px solid #ccc; border-radius:4px;"></pre>
                <div id="error-msg" class="error hidden" style="color:red; margin-top:10px;"></div>
            </div>
        </div>
    `;
}

const input = $('#input-json');
const output = $('#output-json');
const errorMsg = $('#error-msg');
const btnFormat = $('#btn-format');
const btnMinify = $('#btn-minify');
const btnCopy = $('#btn-copy');

const processJson = (space) => {
    try {
        hide(errorMsg);
        if (!input.value.trim()) {
            output.textContent = '';
            return;
        }
        const parsed = JSON.parse(input.value);
        output.textContent = JSON.stringify(parsed, null, space);
    } catch (e) {
        show(errorMsg);
        errorMsg.textContent = "Invalid JSON: " + e.message;
    }
};

on(btnFormat, 'click', () => processJson(2));
on(btnMinify, 'click', () => processJson(0));

on(btnCopy, 'click', () => {
    if (output.textContent) {
        copyToClipboard(output.textContent, btnCopy);
    }
});

// Automatic Paste Binding
setTimeout(() => {

    const btnPaste = $('#btn-paste');
    if (btnPaste) {
        on(btnPaste, 'click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const input = $('#input-json');
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

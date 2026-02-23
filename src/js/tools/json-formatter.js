import { $, on, show, hide } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-controls">
            <button id="btn-format" class="btn primary">Format JSON</button>
            <button id="btn-minify" class="btn">Minify JSON</button>
            <button id="btn-copy" class="btn secondary">Copy Output</button>
        </div>
        <div class="tool-layout-split">
            <textarea id="input-json" placeholder="Paste your JSON here..." style="width:100%; height:300px; padding:10px; font-family:monospace; margin-bottom: 20px;"></textarea>
            <div class="output-wrapper" style="width:100%; position:relative;">
                <pre id="output-json" style="background:#f4f4f4; padding:15px; min-height:300px; overflow-x:auto;"></pre>
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

import { $, on, show, hide } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="workshop-status">
            <div class="status-group">
                <div class="status-item">
                    <span id="status-indicator" class="status-indicator"></span>
                    <span class="status-label">System:</span>
                    <span id="status-text" class="status-value">IDLE</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Nodes:</span>
                    <span id="metric-nodes" class="status-value">0</span>
                </div>
            </div>
            <div class="status-group">
                <div class="status-item">
                    <span class="status-label">Payload:</span>
                    <span id="metric-size" class="status-value">0 B</span>
                </div>
            </div>
        </div>

        <div class="tool-controls">
            <button id="btn-format" class="btn primary btn-md-inline">Format JSON</button>
            <button id="btn-minify" class="btn secondary btn-md-inline">Minify JSON</button>
        </div>
        <div class="tool-layout-split tool-stack-20">
            <div class="tool-column">
                <div class="tool-label-row">
                    <label>Input JSON</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste JSON</button>
                </div>
                <textarea id="input-json" class="tool-textarea-lg" placeholder="Paste your JSON here..."></textarea>
            </div>
            <div class="output-wrapper tool-column">
                <div class="tool-label-row">
                    <label>Output JSON</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy JSON</button>
                </div>
                <pre id="output-json" class="json-output-pre"></pre>
                <div id="error-msg" class="error hidden tool-error-danger"></div>
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

const statusIndicator = $('#status-indicator');
const statusText = $('#status-text');
const metricNodes = $('#metric-nodes');
const metricSize = $('#metric-size');

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const countNodes = (obj) => {
    let count = 0;
    const traverse = (o) => {
        count++;
        if (o && typeof o === 'object') {
            Object.values(o).forEach(traverse);
        }
    };
    traverse(obj);
    return count;
};

const updateStatus = (state, msg) => {
    statusIndicator.className = 'status-indicator ' + state;
    statusText.textContent = msg.toUpperCase();
};

const processJson = (space) => {
    try {
        hide(errorMsg);
        if (!input.value.trim()) {
            output.textContent = '';
            updateStatus('', 'IDLE');
            metricNodes.textContent = '0';
            metricSize.textContent = '0 B';
            return;
        }

        updateStatus('active', 'VALIDATING...');
        const parsed = JSON.parse(input.value);
        const result = JSON.stringify(parsed, null, space);

        output.textContent = result;

        // Metrics
        metricNodes.textContent = countNodes(parsed);
        metricSize.textContent = formatBytes(new Blob([result]).size);
        updateStatus('active', space === 0 ? 'MINIFIED' : 'FORMATTED');

    } catch (e) {
        show(errorMsg);
        errorMsg.textContent = "Invalid JSON: " + e.message;
        updateStatus('error', 'SYSTEM ERROR');
        metricNodes.textContent = 'ERROR';
    }
};

on(btnFormat, 'click', () => processJson(2));
on(btnMinify, 'click', () => processJson(0));

on(btnCopy, 'click', () => {
    if (output.textContent) {
        copyToClipboard(output.textContent, btnCopy);
    }
});

// Real-time validation trigger
on(input, 'input', () => {
    if (!input.value.trim()) {
        updateStatus('', 'IDLE');
        metricNodes.textContent = '0';
        metricSize.textContent = '0 B';
    } else {
        updateStatus('active', 'WAITING...');
    }
});


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => input, { onPaste: () => processJson(2) });

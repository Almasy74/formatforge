import { $, on, show, hide } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

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
                    <span class="status-label">Mode:</span>
                    <span id="metric-mode" class="status-value">AUTO</span>
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
            <button id="btn-convert" class="btn primary">Convert Now</button>
            <button id="btn-clear" class="btn secondary" style="width: auto;">Clear</button>
        </div>
        <div class="tool-layout-split">
            <div class="input-panel">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label>Input (CSV or JSON)</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center; margin-top: 0;">Paste</button>
                </div>
                <textarea id="input-data" placeholder="Paste CSV or JSON here..."></textarea>
            </div>
            <div class="output-panel">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label>Output</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy</button>
                </div>
                <textarea id="output-data" readonly placeholder="Result will appear here..."></textarea>
            </div>
        </div>
        <div id="error-msg" class="error hidden" style="margin-top:15px; font-family:monospace; font-size:13px;"></div>
    `;
}

const inputData = $('#input-data');
const outputData = $('#output-data');
const btnConvert = $('#btn-convert');
const btnClear = $('#btn-clear');
const btnCopy = $('#btn-copy');
const errorMsg = $('#error-msg');

const statusIndicator = $('#status-indicator');
const statusText = $('#status-text');
const metricMode = $('#metric-mode');
const metricSize = $('#metric-size');

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const updateStatus = (state, msg) => {
    statusIndicator.className = 'status-indicator ' + state;
    statusText.textContent = msg.toUpperCase();
};

function csvToJson(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
}

function jsonToCsv(json) {
    try {
        const arr = typeof json === 'string' ? JSON.parse(json) : json;
        if (!Array.isArray(arr) || arr.length === 0) return '';
        const headers = Object.keys(arr[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        for (const row of arr) {
            const values = headers.map(header => {
                const val = row[header] === null ? '' : row[header];
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    } catch (e) {
        throw new Error('Invalid JSON structure for CSV conversion');
    }
}

function process() {
    const value = inputData.value.trim();
    if (!value) {
        outputData.value = '';
        updateStatus('', 'IDLE');
        metricMode.textContent = 'AUTO';
        metricSize.textContent = '0 B';
        return;
    }

    try {
        hide(errorMsg);
        updateStatus('active', 'PROCESSING...');

        let result = '';
        if (value.startsWith('[') || value.startsWith('{')) {
            metricMode.textContent = 'JSON → CSV';
            result = jsonToCsv(value);
        } else {
            metricMode.textContent = 'CSV → JSON';
            const json = csvToJson(value);
            result = JSON.stringify(json, null, 2);
        }

        outputData.value = result;
        metricSize.textContent = formatBytes(new Blob([result]).size);
        updateStatus('active', 'SUCCESS');
    } catch (e) {
        show(errorMsg);
        errorMsg.textContent = 'Error: ' + e.message;
        updateStatus('error', 'SYSTEM ERROR');
        metricMode.textContent = 'ERROR';
    }
}

on(btnConvert, 'click', process);
on(btnClear, 'click', () => {
    inputData.value = '';
    outputData.value = '';
    hide(errorMsg);
    updateStatus('', 'IDLE');
    metricMode.textContent = 'AUTO';
    metricSize.textContent = '0 B';
});

on(btnCopy, 'click', () => {
    if (outputData.value) {
        copyToClipboard(outputData.value, btnCopy);
    }
});

// Real-time listener
on(inputData, 'input', () => {
    if (!inputData.value.trim()) {
        updateStatus('', 'IDLE');
    } else {
        updateStatus('active', 'DETECTING...');
    }
});

// Automatic Paste Binding
setTimeout(() => {
    const btnPaste = $('#btn-paste');
    if (btnPaste) {
        on(btnPaste, 'click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (inputData) {
                    inputData.value = text;
                    process();
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
            }
        });
    }
}, 100);

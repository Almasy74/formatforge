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
            <button id="btn-clear" class="btn secondary btn-auto">Clear</button>
        </div>
        <div class="tool-layout-split">
            <div class="input-panel">
                <div class="tool-label-row">
                    <label>Input (CSV or JSON)</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste</button>
                </div>
                <textarea id="input-data" class="tool-textarea-lg" placeholder="Paste CSV or JSON here..."></textarea>
            </div>
            <div class="output-panel">
                <div class="tool-label-row">
                    <label>Output</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy</button>
                </div>
                <textarea id="output-data" class="tool-textarea-lg" readonly placeholder="Result will appear here..."></textarea>
            </div>
        </div>
        <div id="error-msg" class="error hidden tool-error-inline"></div>
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
    const rows = parseCsvRows(csv);
    if (rows.length === 0) return [];

    const headerRow = rows[0];
    const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), headerRow.length);
    const headers = Array.from({ length: maxColumns }, (_, i) => {
        const rawHeader = (headerRow[i] ?? '').trim();
        return rawHeader || `column_${i + 1}`;
    });

    return rows
        .slice(1)
        .filter(row => row.some(cell => cell !== ''))
        .map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] ?? '';
            });
            return obj;
        });
}

function jsonToCsv(json) {
    try {
        const arr = typeof json === 'string' ? JSON.parse(json) : json;
        if (!Array.isArray(arr)) {
            throw new Error('Expected a JSON array');
        }
        if (arr.length === 0) return '';

        const headers = [];
        const seen = new Set();
        arr.forEach(item => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                throw new Error('Each row must be an object');
            }
            Object.keys(item).forEach(key => {
                if (!seen.has(key)) {
                    seen.add(key);
                    headers.push(key);
                }
            });
        });

        const csvRows = [];
        csvRows.push(headers.map(escapeCsvField).join(','));
        for (const row of arr) {
            const values = headers.map(header => {
                const val = row[header];
                return escapeCsvField(val);
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    } catch (e) {
        throw new Error(`Invalid JSON structure for CSV conversion: ${e.message}`);
    }
}

function parseCsvRows(csv, delimiter = ',') {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const input = String(csv).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '"') {
            if (inQuotes && input[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === delimiter && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }

        if (char === '\n' && !inQuotes) {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            continue;
        }

        field += char;
    }

    if (inQuotes) {
        throw new Error('Malformed CSV: unmatched quote detected');
    }

    row.push(field);
    rows.push(row);

    if (rows.length > 0 && rows[rows.length - 1].every(cell => cell === '')) {
        rows.pop();
    }

    return rows;
}

function escapeCsvField(value) {
    if (value === null || value === undefined) return '';

    let str = value;
    if (typeof value === 'object') {
        str = JSON.stringify(value);
    }
    str = String(str);

    const needsQuotes =
        str.includes('"') ||
        str.includes(',') ||
        str.includes('\n') ||
        str.includes('\r') ||
        /^\s/.test(str) ||
        /\s$/.test(str);

    if (!needsQuotes) return str;
    return `"${str.replace(/"/g, '""')}"`;
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


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => inputData, { onPaste: () => process() });

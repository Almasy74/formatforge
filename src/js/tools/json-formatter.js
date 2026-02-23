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
                <div id="error-msg" class="error hidden" style="color:red; margin-top:10px; font-family: monospace; font-size: 13px;"></div>
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

// Automatic Paste Binding
setTimeout(() => {
    const btnPaste = $('#btn-paste');
    if (btnPaste) {
        on(btnPaste, 'click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (input) {
                    input.value = text;
                    processJson(2); // Auto format on paste
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
            }
        });
    }
}, 100);

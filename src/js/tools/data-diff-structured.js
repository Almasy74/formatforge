import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout tool-layout-column">
            <div class="tool-flex-row-wrap">
                <div class="tool-panel tool-input-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label for="input-left">Input A (JSON or CSV)</label>
                        <button id="btn-paste-left" class="btn secondary btn-sm">Paste A</button>
                    </div>
                    <textarea id="input-left" class="tool-textarea-fill tool-textarea-code-nowrap" placeholder="Paste first dataset..."></textarea>
                </div>
                <div class="tool-panel tool-input-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label for="input-right">Input B (JSON or CSV)</label>
                        <button id="btn-paste-right" class="btn secondary btn-sm">Paste B</button>
                    </div>
                    <textarea id="input-right" class="tool-textarea-fill tool-textarea-code-nowrap" placeholder="Paste second dataset..."></textarea>
                </div>
            </div>

            <div class="tool-controls tool-mt-20">
                <div class="settings-group">
                    <h3 class="settings-title">Diff Options</h3>
                    <label class="option-row option-row-first">
                        <input type="checkbox" id="opt-ignore-order" />
                        <span>Ignore array order (best effort)</span>
                    </label>
                    <button id="btn-compare" class="btn primary">Compare Structures</button>
                    <button id="btn-copy" class="btn secondary">Copy Diff Report</button>
                </div>
            </div>

            <div id="error-msg" class="tool-alert tool-mt-20"></div>

            <div class="tool-panel tool-output-panel tool-panel-column tool-mt-20">
                <label>Structured Diff Report</label>
                <pre id="diff-output" class="tool-pre-output"></pre>
            </div>
        </div>
    `;
}

const inputLeft = $('#input-left');
const inputRight = $('#input-right');
const optIgnoreOrder = $('#opt-ignore-order');
const btnCompare = $('#btn-compare');
const btnCopy = $('#btn-copy');
const btnPasteLeft = $('#btn-paste-left');
const btnPasteRight = $('#btn-paste-right');
const errorMsg = $('#error-msg');
const diffOutput = $('#diff-output');

const showError = (msg) => {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
};

const hideError = () => {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
};

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

const parseCsvRows = (csv, delimiter = ',') => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const input = String(csv).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        if (ch === '"') {
            if (inQuotes && input[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (ch === delimiter && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }

        if (ch === '\n' && !inQuotes) {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            continue;
        }

        field += ch;
    }

    if (inQuotes) throw new Error('Malformed CSV: unmatched quote');
    row.push(field);
    rows.push(row);
    if (rows.length > 0 && rows[rows.length - 1].every(c => c === '')) rows.pop();
    return rows;
};

const parseInput = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('One of the inputs is empty');
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const rows = parseCsvRows(trimmed);
    if (!rows.length) return [];
    const headers = rows[0];
    return rows.slice(1).map((r) => {
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = r[i] ?? '';
        });
        return obj;
    });
};

const stableSort = (arr) => {
    return [...arr].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
};

const diffValues = (a, b, path, changes, ignoreOrder) => {
    if (a === b) return;

    if (Array.isArray(a) && Array.isArray(b)) {
        const left = ignoreOrder ? stableSort(a) : a;
        const right = ignoreOrder ? stableSort(b) : b;
        const max = Math.max(left.length, right.length);
        for (let i = 0; i < max; i++) {
            const p = `${path}[${i}]`;
            if (i >= left.length) {
                changes.push({ type: 'added', path: p, after: right[i] });
            } else if (i >= right.length) {
                changes.push({ type: 'removed', path: p, before: left[i] });
            } else {
                diffValues(left[i], right[i], p, changes, ignoreOrder);
            }
        }
        return;
    }

    if (isObject(a) && isObject(b)) {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        keys.forEach((k) => {
            const p = path ? `${path}.${k}` : k;
            if (!Object.prototype.hasOwnProperty.call(a, k)) {
                changes.push({ type: 'added', path: p, after: b[k] });
            } else if (!Object.prototype.hasOwnProperty.call(b, k)) {
                changes.push({ type: 'removed', path: p, before: a[k] });
            } else {
                diffValues(a[k], b[k], p, changes, ignoreOrder);
            }
        });
        return;
    }

    changes.push({ type: 'changed', path: path || '(root)', before: a, after: b });
};

const formatChange = (change) => {
    if (change.type === 'added') return `+ ${change.path}: ${JSON.stringify(change.after)}`;
    if (change.type === 'removed') return `- ${change.path}: ${JSON.stringify(change.before)}`;
    return `~ ${change.path}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`;
};

const process = () => {
    hideError();
    diffOutput.textContent = '';

    try {
        const left = parseInput(inputLeft.value);
        const right = parseInput(inputRight.value);
        const changes = [];
        diffValues(left, right, '', changes, optIgnoreOrder.checked);

        if (changes.length === 0) {
            diffOutput.textContent = 'No structural differences found.';
            return;
        }

        const added = changes.filter(c => c.type === 'added').length;
        const removed = changes.filter(c => c.type === 'removed').length;
        const changed = changes.filter(c => c.type === 'changed').length;

        const lines = [
            `Summary: ${added} added, ${removed} removed, ${changed} changed`,
            '',
            ...changes.map(formatChange)
        ];
        diffOutput.textContent = lines.join('\n');
    } catch (err) {
        showError(`Error: ${err.message}`);
    }
};

on(btnCompare, 'click', process);
on(optIgnoreOrder, 'change', process);

on(btnCopy, 'click', () => {
    if (!diffOutput.textContent) return;
    copyToClipboard(diffOutput.textContent, btnCopy);
});

on(inputLeft, 'input', () => {
    hideError();
});
on(inputRight, 'input', () => {
    hideError();
});

bindPasteButton(btnPasteLeft, () => inputLeft, { onPaste: () => process() });
bindPasteButton(btnPasteRight, () => inputRight, { onPaste: () => process() });

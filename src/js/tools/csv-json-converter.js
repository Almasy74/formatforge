import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input (CSV or JSON)</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                    <span id="detected-format" style="font-size: 12px; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: #e0e0e0; color: #555;">Waiting for input...</span>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste CSV text or a JSON array here... The format is detected automatically." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 400px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Options</h3>
                    
                    <div id="json-options" style="display: none;">
                        <span style="font-size:12px; font-weight:bold; color:#666; display:block; margin-bottom:5px;">JSON Options</span>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                            <input type="checkbox" id="opt-minify-json" value="minify">
                            <span>Minify output</span>
                        </label>
                    </div>

                    <div id="csv-options" style="display: none;">
                        <span style="font-size:12px; font-weight:bold; color:#666; display:block; margin-bottom:5px;">CSV Options</span>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                            <select id="opt-delimiter" style="padding: 2px;">
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="\\t">Tab (\\t)</option>
                                <option value="|">Pipe (|)</option>
                            </select>
                            <span>Delimiter</span>
                        </label>
                    </div>

                    <div id="options-placeholder" style="font-size: 13px; color: #777; font-style: italic;">
                        Options will appear once format is detected.
                    </div>
                </div>

                <div id="error-msg" style="display: none; background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; font-size: 13px; border-left: 3px solid #c62828;"></div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Output</button>
                </div>
                <textarea id="output-data" readonly placeholder="Converted data will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 400px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const detectedFormatLabel = $('#detected-format');
    const errorMsg = $('#error-msg');

    const jsonOptions = $('#json-options');
    const csvOptions = $('#csv-options');
    const optionsPlaceholder = $('#options-placeholder');

    const optMinifyJson = $('#opt-minify-json');
    const optDelimiter = $('#opt-delimiter');

    // Simple robust CSV parser handling quotes
    const parseCSVRows = (text, delimiter = ',') => {
        let rows = [];
        let currentRow = [];
        let curStr = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            let nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    curStr += '"';
                    i++; // skip escaped quote
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    curStr += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === delimiter) {
                    currentRow.push(curStr);
                    curStr = '';
                } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                    if (char === '\r') i++; // skip \n of \r\n
                    currentRow.push(curStr);
                    curStr = '';
                    rows.push(currentRow);
                    currentRow = [];
                } else {
                    curStr += char;
                }
            }
        }

        // flush remaining
        if (curStr !== '' || text[text.length - 1] === delimiter) {
            currentRow.push(curStr);
        }
        if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
            rows.push(currentRow);
        }

        return rows;
    };

    // Simple robust CSV stringifier
    const stringifyToCSV = (rows, delimiter = ',') => {
        return rows.map(row => {
            return row.map(cell => {
                let cellStr = cell === null || cell === undefined ? '' : String(cell);
                if (cellStr.includes('"') || cellStr.includes(delimiter) || cellStr.includes('\\n') || cellStr.includes('\\r')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(delimiter);
        }).join('\\n');
    };

    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        outputData.value = '';
        btnCopy.disabled = true;
    };

    const hideError = () => {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
    };

    const updateFormatUI = (format) => {
        optionsPlaceholder.style.display = 'none';
        if (format === 'JSON') {
            detectedFormatLabel.textContent = 'Detected: JSON';
            detectedFormatLabel.style.background = '#e3f2fd'; // Blue
            detectedFormatLabel.style.color = '#1565c0';

            jsonOptions.style.display = 'none'; // Only applies to CSV->JSON
            csvOptions.style.display = 'block'; // Applies to JSON->CSV

        } else if (format === 'CSV') {
            detectedFormatLabel.textContent = 'Detected: CSV';
            detectedFormatLabel.style.background = '#e8f5e9'; // Green
            detectedFormatLabel.style.color = '#2e7d32';

            jsonOptions.style.display = 'block'; // Applies to CSV->JSON
            csvOptions.style.display = 'block'; // To choose which delimiter it's parsing
        } else {
            detectedFormatLabel.textContent = 'Waiting for input...';
            detectedFormatLabel.style.background = '#e0e0e0';
            detectedFormatLabel.style.color = '#555';

            jsonOptions.style.display = 'none';
            csvOptions.style.display = 'none';
            optionsPlaceholder.style.display = 'block';
        }
    };

    const processData = () => {
        const text = inputData.value.trim();
        hideError();

        if (!text) {
            outputData.value = '';
            updateFormatUI('NONE');
            btnCopy.disabled = true;
            return;
        }

        // Auto-detect format
        const firstChar = text.charAt(0);
        let detected = 'CSV';
        if (firstChar === '[' || firstChar === '{') {
            detected = 'JSON';
        }

        updateFormatUI(detected);

        try {
            if (detected === 'JSON') {
                // Convert JSON to CSV
                const jsonObj = JSON.parse(text);

                let arr = [];
                if (Array.isArray(jsonObj)) {
                    arr = jsonObj;
                } else if (typeof jsonObj === 'object' && jsonObj !== null) {
                    arr = [jsonObj];
                } else {
                    throw new Error("JSON must be an object or an array of objects.");
                }

                if (arr.length === 0) {
                    outputData.value = '';
                    btnCopy.disabled = false;
                    return;
                }

                // Extract all unique headers across all objects
                const headersSet = new Set();
                arr.forEach(obj => {
                    if (typeof obj === 'object' && obj !== null) {
                        Object.keys(obj).forEach(k => headersSet.add(k));
                    }
                });

                const headers = Array.from(headersSet);

                const rows = [];
                rows.push(headers); // Header row

                arr.forEach(obj => {
                    const row = [];
                    headers.forEach(header => {
                        let val = obj[header];
                        // Convert objects/arrays to JSON strings to fit in cell
                        if (typeof val === 'object' && val !== null) {
                            val = JSON.stringify(val);
                        }
                        row.push(val);
                    });
                    rows.push(row);
                });

                const delimiter = optDelimiter.value === '\\t' ? '\\t' : optDelimiter.value;
                outputData.value = stringifyToCSV(rows, delimiter);
                btnCopy.disabled = false;

            } else {
                // Convert CSV to JSON
                const delimiter = optDelimiter.value === '\\t' ? '\\t' : optDelimiter.value;
                const rows = parseCSVRows(text, delimiter);

                if (rows.length < 2) {
                    throw new Error("CSV must have at least a header row and one data row.");
                }

                const headers = rows[0];
                const jsonArr = [];

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue; // skip empty rows

                    const obj = {};
                    for (let j = 0; j < headers.length; j++) {
                        let header = headers[j] ? headers[j].trim() : `Column_${j + 1}`;
                        let val = row[j] !== undefined ? row[j] : "";
                        obj[header] = val;
                    }
                    jsonArr.push(obj);
                }

                const indent = optMinifyJson.checked ? 0 : 2;
                outputData.value = JSON.stringify(jsonArr, null, indent);
                btnCopy.disabled = false;
            }
        } catch (err) {
            showError("Error parsing " + detected + ": " + err.message);
        }
    };

    // Instant reactivity
    on(inputData, 'input', processData);

    // Process when options change
    on(optMinifyJson, 'change', processData);
    on(optDelimiter, 'change', processData);

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value || btnCopy.disabled) return;
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

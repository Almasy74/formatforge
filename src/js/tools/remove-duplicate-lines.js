import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: List with Duplicates</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste list containing duplicate items, one per line..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Options</h3>
                    
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                        <input type="checkbox" id="option-sort" value="sort">
                        <span>Sort alphabetically</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="checkbox" id="option-ignore-case" value="ignore-case">
                        <span>Case-insensitive deduplication</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;">
                        <input type="checkbox" id="option-trim" value="trim" checked>
                        <span>Trim whitespace</span>
                    </label>
                </div>

                <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 12px; color: #555; text-transform: uppercase;">Removed</span>
                    <div id="stat-removed" style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #d32f2f;">0</div>
                </div>
                <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 12px; color: #555; text-transform: uppercase;">Unique Remaining</span>
                    <div id="stat-unique" style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #388e3c;">0</div>
                </div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output: Unique List</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy List</button>
                </div>
                <textarea id="output-data" readonly placeholder="Unique lines will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');

    const optSort = $('#option-sort');
    const optIgnoreCase = $('#option-ignore-case');
    const optTrim = $('#option-trim');

    const statRemoved = $('#stat-removed');
    const statUnique = $('#stat-unique');

    const dedupeList = () => {
        let text = inputData.value;
        if (!text) {
            outputData.value = '';
            statRemoved.textContent = '0';
            statUnique.textContent = '0';
            return;
        }

        let lines = text.split(/\r?\n/);
        const originalCount = lines.length;

        const shouldTrim = optTrim.checked;
        const ignoreCase = optIgnoreCase.checked;
        const shouldSort = optSort.checked;

        let uniqueMap = new Map();

        lines.forEach(line => {
            let processedLine = line;
            if (shouldTrim) {
                processedLine = processedLine.trim();
            }

            // Skip empty lines in deduplication or let them be? 
            // Better to include them if they want it, but usually people want to remove empty duplicates.

            let key = processedLine;
            if (ignoreCase) {
                key = processedLine.toLowerCase();
            }

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, processedLine); // Keep original casing even if matched case-insensitively
            }
        });

        let uniqueLines = Array.from(uniqueMap.values());

        if (shouldSort) {
            uniqueLines.sort((a, b) => a.localeCompare(b));
        }

        outputData.value = uniqueLines.join('\n');

        // Update stats
        const uniqueCount = uniqueLines.length;
        statUnique.textContent = uniqueCount.toLocaleString();
        statRemoved.textContent = (originalCount - uniqueCount).toLocaleString();
    };

    // Instant reactivity
    on(inputData, 'input', dedupeList);

    // Process when options change
    on(optSort, 'change', dedupeList);
    on(optIgnoreCase, 'change', dedupeList);
    on(optTrim, 'change', dedupeList);

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

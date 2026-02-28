import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: List with Duplicates</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill" autofocus placeholder="Paste list containing duplicate items, one per line..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Options</h3>
                    
                    <label class="option-row">
                        <input type="checkbox" id="option-sort" value="sort">
                        <span>Sort alphabetically</span>
                    </label>
                    <label class="option-row">
                        <input type="checkbox" id="option-ignore-case" value="ignore-case">
                        <span>Case-insensitive deduplication</span>
                    </label>
                    <label class="option-row">
                        <input type="checkbox" id="option-trim" value="trim" checked>
                        <span>Trim whitespace</span>
                    </label>
                </div>

                <div class="stat-card">
                    <span class="stat-label">Removed</span>
                    <div id="stat-removed" class="stat-value stat-value-danger">0</div>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Unique Remaining</span>
                    <div id="stat-unique" class="stat-value stat-value-success">0</div>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output: Unique List</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy List</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output" readonly placeholder="Unique lines will appear here instantly..."></textarea>
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
        copyToClipboard(outputData.value, btnCopy);
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

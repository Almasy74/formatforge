import { $, on } from '../core/dom.js';
import { bindPasteButton } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout tool-layout-column">
            <div class="tool-flex-row-wrap">
                <div class="tool-panel tool-input-panel tool-panel-column tool-min-w-300">
                    <label for="input-original">Original Text</label>
                    <textarea id="input-original" class="tool-textarea-fill tool-textarea-code-nowrap" placeholder="Paste the original text here..."></textarea>
                </div>

                <div class="tool-panel tool-input-panel tool-panel-column tool-min-w-300">
                    <label for="input-changed">Modified Text</label>
                    <textarea id="input-changed" class="tool-textarea-fill tool-textarea-code-nowrap" placeholder="Paste the changed text here..."></textarea>
                </div>
            </div>

            <div class="tool-controls diff-options">
                <span class="diff-options-title">Options:</span>
                <label class="option-row option-row-compact">
                    <input type="checkbox" id="opt-ignore-case"> Ignore Case
                </label>
                <label class="option-row option-row-compact">
                    <input type="checkbox" id="opt-trim-whitespace" checked> Ignore Leading/Trailing Whitespace
                </label>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column tool-mt-20">
                <label>Diff Output</label>
                <div id="diff-output" class="tool-output-scroll">
                    <div class="tool-output-placeholder">Diff will appear here instantly...</div>
                </div>
            </div>
        </div>
    `;

    const inputOriginal = $('#input-original');
    const inputChanged = $('#input-changed');
    const diffOutput = $('#diff-output');

    const optIgnoreCase = $('#opt-ignore-case');
    const optTrimWhitespace = $('#opt-trim-whitespace');

    // Debounce to prevent blocking the UI on large inputs while typing
    let debounceTimer;

    const computeDiff = () => {
        let oldStr = inputOriginal.value;
        let newStr = inputChanged.value;

        if (!oldStr && !newStr) {
            diffOutput.innerHTML = '<div class="tool-output-placeholder">Diff will appear here instantly...</div>';
            return;
        }

        let oldLines = oldStr.split('\n');
        let newLines = newStr.split('\n');

        // Hard cap to prevent memory exhaustion in simple LCS algorithm
        const MAX_LINES = 2500;
        if (oldLines.length > MAX_LINES || newLines.length > MAX_LINES) {
            diffOutput.innerHTML = `<div class="tool-error-strong">Error: File too large. The browser-based diff supports up to ${MAX_LINES} lines max to prevent crashing your tab.</div>`;
            return;
        }

        const ignoreCase = optIgnoreCase.checked;
        const trimWS = optTrimWhitespace.checked;

        const compare = (a, b) => {
            let strA = a;
            let strB = b;
            if (trimWS) {
                strA = strA.trim();
                strB = strB.trim();
            }
            if (ignoreCase) {
                strA = strA.toLowerCase();
                strB = strB.toLowerCase();
            }
            return strA === strB;
        };

        // LCS Matrix
        const memo = Array(oldLines.length + 1).fill(0).map(() => Array(newLines.length + 1).fill(0));

        for (let i = 1; i <= oldLines.length; i++) {
            for (let j = 1; j <= newLines.length; j++) {
                if (compare(oldLines[i - 1], newLines[j - 1])) {
                    memo[i][j] = memo[i - 1][j - 1] + 1;
                } else {
                    memo[i][j] = Math.max(memo[i - 1][j], memo[i][j - 1]);
                }
            }
        }

        const diff = [];
        let i = oldLines.length;
        let j = newLines.length;

        while (i > 0 && j > 0) {
            if (compare(oldLines[i - 1], newLines[j - 1])) {
                diff.unshift({ type: 'unchanged', text: newLines[j - 1] }); // Use new formatting if case was ignored
                i--; j--;
            } else if (memo[i - 1][j] > memo[i][j - 1]) {
                diff.unshift({ type: 'removed', text: oldLines[i - 1] });
                i--;
            } else {
                diff.unshift({ type: 'added', text: newLines[j - 1] });
                j--;
            }
        }

        while (i > 0) {
            diff.unshift({ type: 'removed', text: oldLines[i - 1] });
            i--;
        }
        while (j > 0) {
            diff.unshift({ type: 'added', text: newLines[j - 1] });
            j--;
        }

        // Render HTML
        let htmlSnippet = '';
        diff.forEach(item => {
            // Escape HTML
            let escapedText = item.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (escapedText === "") escapedText = " "; // keep empty lines visible

            if (item.type === 'added') {
                htmlSnippet += `<div class="diff-line diff-line-added"><span class="diff-sign diff-sign-added">+</span>${escapedText}</div>`;
            } else if (item.type === 'removed') {
                htmlSnippet += `<div class="diff-line diff-line-removed"><span class="diff-sign diff-sign-removed">-</span>${escapedText}</div>`;
            } else {
                htmlSnippet += `<div class="diff-line diff-line-unchanged"><span class="diff-sign diff-sign-unchanged"> </span>${escapedText}</div>`;
            }
        });

        diffOutput.innerHTML = htmlSnippet;
    };

    const scheduleDiff = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(computeDiff, 200); // 200ms debounce
    };

    on(inputOriginal, 'input', scheduleDiff);
    on(inputChanged, 'input', scheduleDiff);

    on(optIgnoreCase, 'change', computeDiff);
    on(optTrimWhitespace, 'change', computeDiff);
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout" style="flex-direction: column;">
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column; min-width: 300px;">
                    <label for="input-original" style="font-weight: bold; margin-bottom: 5px;">Original Text</label>
                    <textarea id="input-original" placeholder="Paste the original text here..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 250px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>
                </div>

                <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column; min-width: 300px;">
                    <label for="input-changed" style="font-weight: bold; margin-bottom: 5px;">Modified Text</label>
                    <textarea id="input-changed" placeholder="Paste the changed text here..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 250px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>
                </div>
            </div>

            <div class="tool-controls" style="display: flex; gap: 15px; margin-top: 20px; align-items: center; background: #f4f6f8; padding: 15px; border-radius: 8px;">
                <span style="font-weight: bold; font-size: 14px;">Options:</span>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                    <input type="checkbox" id="opt-ignore-case"> Ignore Case
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                    <input type="checkbox" id="opt-trim-whitespace" checked> Ignore Leading/Trailing Whitespace
                </label>
            </div>

            <div class="tool-panel tool-output-panel" style="margin-top: 20px; display: flex; flex-direction: column;">
                <label style="font-weight: bold; margin-bottom: 5px;">Diff Output</label>
                <div id="diff-output" style="border: 1px solid #ccc; border-radius: 4px; background: #fff; min-height: 300px; max-height: 600px; overflow-y: auto; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-all;">
                    <div style="padding: 15px; color: #777; font-style: italic;">Diff will appear here instantly...</div>
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
            diffOutput.innerHTML = '<div style="padding: 15px; color: #777; font-style: italic;">Diff will appear here instantly...</div>';
            return;
        }

        let oldLines = oldStr.split('\\n');
        let newLines = newStr.split('\\n');

        // Hard cap to prevent memory exhaustion in simple LCS algorithm
        const MAX_LINES = 2500;
        if (oldLines.length > MAX_LINES || newLines.length > MAX_LINES) {
            diffOutput.innerHTML = `<div style="padding: 15px; color: #c62828; font-weight: bold;">Error: File too large. The browser-based diff supports up to ${MAX_LINES} lines max to prevent crashing your tab.</div>`;
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
                htmlSnippet += `<div style="background-color: #e6ffed; padding: 2px 10px; border-left: 4px solid #388e3c;"><span style="color: #388e3c; margin-right: 10px; user-select: none;">+</span>${escapedText}</div>`;
            } else if (item.type === 'removed') {
                htmlSnippet += `<div style="background-color: #ffeef0; padding: 2px 10px; border-left: 4px solid #c62828;"><span style="color: #c62828; margin-right: 10px; user-select: none;">-</span>${escapedText}</div>`;
            } else {
                htmlSnippet += `<div style="padding: 2px 10px; color: #555;"><span style="color: #eee; margin-right: 10px; user-select: none;"> </span>${escapedText}</div>`;
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

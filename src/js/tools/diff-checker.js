import { $, on } from '../core/dom.js';
import { bindPasteButton } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-controls mb-20">
            <button id="btn-compare" class="btn primary">Compare Text</button>
        </div>
        <div class="tool-layout-split compare-input-grid">
            <textarea id="input-original" class="tool-textarea-lg" placeholder="Original text..."></textarea>
            <textarea id="input-modified" class="tool-textarea-lg" placeholder="Modified text..."></textarea>
        </div>
        <div class="output-wrapper">
            <h3>Differences:</h3>
            <div id="diff-output" class="diff-viewer tool-pre-output tool-min-h-200"></div>
        </div>
    `;
}

const btnCompare = $('#btn-compare');
const inOriginal = $('#input-original');
const inModified = $('#input-modified');
const outDiff = $('#diff-output');

on(btnCompare, 'click', () => {
    const origLines = inOriginal.value.split('\n');
    const modLines = inModified.value.split('\n');

    let html = '';
    const maxLen = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < maxLen; i++) {
        const oLine = origLines[i] !== undefined ? origLines[i] : null;
        const mLine = modLines[i] !== undefined ? modLines[i] : null;

        if (oLine === mLine) {
            html += `<div class="diff-line diff-line-unchanged">  ${oLine}</div>`;
        } else {
            if (oLine !== null) html += `<div class="diff-line diff-line-removed"><span class="diff-sign diff-sign-removed">-</span>${oLine}</div>`;
            if (mLine !== null) html += `<div class="diff-line diff-line-added"><span class="diff-sign diff-sign-added">+</span>${mLine}</div>`;
        }
    }
    outDiff.innerHTML = html;
});


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

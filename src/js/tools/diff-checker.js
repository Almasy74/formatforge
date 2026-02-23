import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-controls" style="margin-bottom: 20px;">
            <button id="btn-compare" class="btn primary">Compare Text</button>
        </div>
        <div class="tool-layout-split" style="display:flex; gap:20px; margin-bottom: 20px;">
            <textarea id="input-original" placeholder="Original text..." style="width:50%; height:300px; padding:10px; font-family:monospace;"></textarea>
            <textarea id="input-modified" placeholder="Modified text..." style="width:50%; height:300px; padding:10px; font-family:monospace;"></textarea>
        </div>
        <div class="output-wrapper">
            <h3>Differences:</h3>
            <div id="diff-output" class="diff-viewer" style="background:#f4f4f4; padding:15px; min-height:200px; font-family:monospace;"></div>
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
            html += `<div style="color:#666;">  ${oLine}</div>`;
        } else {
            if (oLine !== null) html += `<div style="color:#d32f2f; background:#ffebee;">- ${oLine}</div>`;
            if (mLine !== null) html += `<div style="color:#2e7d32; background:#e8f5e9;">+ ${mLine}</div>`;
        }
    }
    outDiff.innerHTML = html;
});

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

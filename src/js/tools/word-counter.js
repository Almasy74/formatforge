import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <textarea id="input-text" placeholder="Type or paste your text here..." style="width:100%; height:200px; padding:10px; font-family:sans-serif; margin-bottom: 20px;"></textarea>
            <div class="stats-grid" style="display:flex; gap:20px; font-size:1.2em; background:#f9f9f9; padding:20px; border-radius:8px;">
                <div class="stat-box"><strong>Words:</strong> <span id="stat-words">0</span></div>
                <div class="stat-box"><strong>Characters:</strong> <span id="stat-chars">0</span></div>
                <div class="stat-box"><strong>Characters (no spaces):</strong> <span id="stat-chars-no-space">0</span></div>
                <div class="stat-box"><strong>Reading Time:</strong> <span id="stat-read-time">0 min</span></div>
            </div>
        </div>
    `;
}

const input = $('#input-text');
const stWords = $('#stat-words');
const stChars = $('#stat-chars');
const stCharsNoSpace = $('#stat-chars-no-space');
const stReadTime = $('#stat-read-time');

on(input, 'input', () => {
    const text = input.value;
    const chars = text.length;
    const charsNoSpace = text.replace(/\\s+/g, '').length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\\s+/).length;
    const readTimeMinutes = Math.ceil(words / 200);

    stChars.textContent = chars;
    stCharsNoSpace.textContent = charsNoSpace;
    stWords.textContent = words;
    stReadTime.textContent = readTimeMinutes + ' min';
});

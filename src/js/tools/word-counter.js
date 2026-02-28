import { $, on } from '../core/dom.js';
import { bindPasteButton } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <textarea id="input-text" class="word-counter-input" placeholder="Type or paste your text here to see real-time statistics..."></textarea>
            <div class="stats-grid word-counter-stats">
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

if (input) {
    on(input, 'input', () => {
        const text = input.value;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s+/g, '').length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const readTimeMinutes = Math.ceil(words / 200);

        stChars.textContent = chars.toLocaleString();
        stCharsNoSpace.textContent = charsNoSpace.toLocaleString();
        stWords.textContent = words.toLocaleString();
        stReadTime.textContent = readTimeMinutes + ' min';
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

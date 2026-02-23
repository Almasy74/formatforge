import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <textarea id="input-text" placeholder="Type or paste your text here to see real-time statistics..." style="width:100%; height:300px; padding:10px; font-family:sans-serif; margin-bottom: 20px;"></textarea>
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

// Automatic Paste Binding
setTimeout(() => {
    const btnPaste = $('#btn-paste');
    if (btnPaste) {
        on(btnPaste, 'click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const targetInput = $('#input-data') || $('#input-text') || document.querySelector('textarea');
                if (targetInput) {
                    targetInput.value = text;
                    targetInput.dispatchEvent(new Event('input'));
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
            }
        });
    }
}, 100);

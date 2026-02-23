import { $, on } from '../core/dom.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: Text to Analyze</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste or type your text here to see real-time statistics..." style="flex: 1; padding: 10px; font-family: sans-serif; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 400px; font-size: 16px; line-height: 1.5;"></textarea>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; max-width: 350px;">
                <h3 style="margin-top: 0; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Text Statistics</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 13px; color: #555; text-transform: uppercase;">Words</span>
                        <div id="stat-words" style="font-size: 28px; font-weight: bold; margin-top: 5px; color: #111;">0</div>
                    </div>
                    <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 13px; color: #555; text-transform: uppercase;">Characters</span>
                        <div id="stat-chars" style="font-size: 28px; font-weight: bold; margin-top: 5px; color: #111;">0</div>
                    </div>
                    <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 13px; color: #555; text-transform: uppercase;">Sentences</span>
                        <div id="stat-sentences" style="font-size: 28px; font-weight: bold; margin-top: 5px; color: #111;">0</div>
                    </div>
                    <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 13px; color: #555; text-transform: uppercase;">Paragraphs</span>
                        <div id="stat-paragraphs" style="font-size: 28px; font-weight: bold; margin-top: 5px; color: #111;">0</div>
                    </div>
                </div>

                <div style="margin-top: 25px;">
                    <h4 style="font-size: 14px; margin-bottom: 10px; color: #333;">Detailed Analysis</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #555;">
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>Characters (no spaces)</span>
                            <strong id="stat-chars-nospace" style="color: #111;">0</strong>
                        </li>
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>Avg. Sentence Length</span>
                            <strong id="stat-avg-sentence" style="color: #111;">0 words</strong>
                        </li>
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>Reading Time (225 wpm)</span>
                            <strong id="stat-reading-time" style="color: #111;">0s</strong>
                        </li>
                        <li style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span>Speaking Time (130 wpm)</span>
                            <strong id="stat-speaking-time" style="color: #111;">0s</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    const inputData = $('#input-data');

    const uiWords = $('#stat-words');
    const uiChars = $('#stat-chars');
    const uiSentences = $('#stat-sentences');
    const uiParagraphs = $('#stat-paragraphs');

    const uiCharsNoSpace = $('#stat-chars-nospace');
    const uiAvgSentence = $('#stat-avg-sentence');
    const uiReadingTime = $('#stat-reading-time');
    const uiSpeakingTime = $('#stat-speaking-time');

    const formatTime = (seconds) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const analyzeText = () => {
        const text = inputData.value;
        const trimmedText = text.trim();

        if (!trimmedText) {
            uiWords.textContent = '0';
            uiChars.textContent = '0';
            uiSentences.textContent = '0';
            uiParagraphs.textContent = '0';
            uiCharsNoSpace.textContent = '0';
            uiAvgSentence.textContent = '0 words';
            uiReadingTime.textContent = '0s';
            uiSpeakingTime.textContent = '0s';
            return;
        }

        // Characters
        const charCount = text.length;
        const charsNoSpaceCount = text.replace(/\s/g, '').length;

        // Words
        const words = trimmedText.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        // Sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const sentenceCount = sentences.length;

        // Paragraphs
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        const paragraphCount = paragraphs.length;

        // Averages
        const avgSentenceLength = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0;

        // Times (Reading = 225 wpm, Speaking = 130 wpm)
        const readingSeconds = (wordCount / 225) * 60;
        const speakingSeconds = (wordCount / 130) * 60;

        // Update UI
        uiWords.textContent = wordCount.toLocaleString();
        uiChars.textContent = charCount.toLocaleString();
        uiSentences.textContent = sentenceCount.toLocaleString();
        uiParagraphs.textContent = paragraphCount.toLocaleString();

        uiCharsNoSpace.textContent = charsNoSpaceCount.toLocaleString();
        uiAvgSentence.textContent = `${avgSentenceLength} words`;
        uiReadingTime.textContent = formatTime(readingSeconds);
        uiSpeakingTime.textContent = formatTime(speakingSeconds);
    };

    // Instant reactivity
    on(inputData, 'input', analyzeText);
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

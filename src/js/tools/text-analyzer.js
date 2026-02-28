import { $, on } from '../core/dom.js';
import { bindPasteButton } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: Text to Analyze</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill tool-textarea-human" autofocus placeholder="Paste or type your text here to see real-time statistics..."></textarea>
            </div>

            <div class="tool-panel tool-output-panel tool-output-narrow">
                <h3 class="tool-heading-sm">Text Statistics</h3>
                
                <div class="stats-grid-2">
                    <div class="stat-card">
                        <span class="stat-label">Words</span>
                        <div id="stat-words" class="stat-value stat-value-lg">0</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Characters</span>
                        <div id="stat-chars" class="stat-value stat-value-lg">0</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Sentences</span>
                        <div id="stat-sentences" class="stat-value stat-value-lg">0</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Paragraphs</span>
                        <div id="stat-paragraphs" class="stat-value stat-value-lg">0</div>
                    </div>
                </div>

                <div class="analysis-section">
                    <h4 class="analysis-heading">Detailed Analysis</h4>
                    <ul class="analysis-list">
                        <li class="analysis-list-item">
                            <span>Characters (no spaces)</span>
                            <strong id="stat-chars-nospace">0</strong>
                        </li>
                        <li class="analysis-list-item">
                            <span>Avg. Sentence Length</span>
                            <strong id="stat-avg-sentence">0 words</strong>
                        </li>
                        <li class="analysis-list-item">
                            <span>Reading Time (225 wpm)</span>
                            <strong id="stat-reading-time">0s</strong>
                        </li>
                        <li class="analysis-list-item">
                            <span>Speaking Time (130 wpm)</span>
                            <strong id="stat-speaking-time">0s</strong>
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


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

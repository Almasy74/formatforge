import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: Title or Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill tool-text-lg" autofocus placeholder="Type or paste your text here to generate a slug..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Slug Options</h3>
                    
                    <label class="option-row">
                        <select id="opt-separator" class="tool-select-sm">
                            <option value="-">Hyphen (-)</option>
                            <option value="_">Underscore (_)</option>
                        </select>
                        <span>Word Separator</span>
                    </label>

                    <label class="option-row">
                        <input type="checkbox" id="opt-remove-stopwords" value="true" checked>
                        <span>Remove Stop Words</span>
                    </label>
                    <p class="tool-help-text">Removes words like 'a', 'the', 'and', 'or', 'in'.</p>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output: URL Slug</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Slug</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output tool-text-lg" readonly placeholder="your-generated-slug-appears-here"></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');

    const optSeparator = $('#opt-separator');
    const optRemoveStopwords = $('#opt-remove-stopwords');

    const stopWords = new Set([
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
    ]);

    const generateSlug = () => {
        let text = inputData.value;
        const separator = optSeparator.value;
        const removeStopWords = optRemoveStopwords.checked;

        if (!text) {
            outputData.value = '';
            return;
        }

        // 1. Normalize and transliterate to remove accents (diacritics)
        let slug = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // 2. Convert to lowercase
        slug = slug.toLowerCase();

        // 3. Replace apostrophes and quotes with nothing so words join properly (e.g. don't -> dont)
        slug = slug.replace(/[''"]/g, '');

        // 4. Replace non-alphanumeric characters with spaces to separate words
        slug = slug.replace(/[^a-z0-9]+/g, ' ');

        // 5. Split into words
        let words = slug.split(' ').filter(word => word.length > 0);

        // 6. Optionally filter stop words
        if (removeStopWords) {
            words = words.filter(word => !stopWords.has(word));
        }

        // 7. Join with separator
        slug = words.join(separator);

        outputData.value = slug;
    };

    // Instant reactivity
    on(inputData, 'input', generateSlug);

    // Process when options change
    on(optSeparator, 'change', generateSlug);
    on(optRemoveStopwords, 'change', generateSlug);

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value, btnCopy);
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

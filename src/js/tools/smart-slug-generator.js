import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: Title or Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Type or paste your text here to generate a slug..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px; font-size: 16px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Slug Options</h3>
                    
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-bottom: 10px;">
                        <select id="opt-separator" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
                            <option value="-">Hyphen (-)</option>
                            <option value="_">Underscore (_)</option>
                        </select>
                        <span>Word Separator</span>
                    </label>

                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                        <input type="checkbox" id="opt-remove-stopwords" value="true" checked>
                        <span>Remove Stop Words</span>
                    </label>
                    <p style="font-size: 11px; color: #777; margin: 4px 0 0 24px;">Removes words like 'a', 'the', 'and', 'or', 'in'.</p>
                </div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output: URL Slug</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Slug</button>
                </div>
                <textarea id="output-data" readonly placeholder="your-generated-slug-appears-here" style="flex: 1; padding: 10px; font-family: monospace; font-size: 16px; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
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
        copyToClipboard(outputData.value);
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => btnCopy.textContent = originalText, 2000);
    });
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

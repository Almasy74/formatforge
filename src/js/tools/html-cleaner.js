import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input: Dirty HTML or Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Text</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill" autofocus placeholder="Paste messy HTML code or rich text from Word..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Cleaning Mode</h3>
                    <label class="option-row option-row-first">
                        <input type="radio" name="mode" value="remove-styles" checked>
                        <span>Remove Inline Styles & Classes</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="strip-tags">
                        <span>Strip All HTML Tags (Plain Text)</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="allowed-tags">
                        <span>Keep Only Basic Tags (&lt;p&gt;, &lt;b&gt;, &lt;a&gt;)</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output: Clean Result</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Text</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output" readonly placeholder="Cleaned output will appear here instantly..."></textarea>
            </div>
        </div>
    `;

    const inputData = $('#input-data');
    const outputData = $('#output-data');
    const btnCopy = $('#btn-copy');
    const modeRadios = Array.from(document.querySelectorAll('input[name="mode"]'));

    const cleanHTML = () => {
        let html = inputData.value;
        if (!html) {
            outputData.value = '';
            return;
        }

        // Pre-cleaning: Remove script and style tags completely (including their content)
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        const mode = document.querySelector('input[name="mode"]:checked').value;

        if (mode === 'strip-tags') {
            // Remove all HTML tags completely
            // 1. Convert <br> and <p> to newlines first for better plain text feeling
            let text = html.replace(/<br\s*\/?>/gi, '\n');
            text = text.replace(/<\/p>/gi, '\n\n');
            // 2. Remove all other tags
            text = text.replace(/<[^>]*>?/gm, '');
            // 3. Decode basic HTML entities
            text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            outputData.value = text.trim();
        } else if (mode === 'remove-styles') {
            // Keep tags, but remove attributes like style="", class="", id=""
            let cleaned = html.replace(/\s+(style|class|id|dir|lang|xml:lang)="[^"]*"/gi, '');
            // Fix double spaces inside tags that got left over
            cleaned = cleaned.replace(/<([a-z0-9]+)\s+>/gi, '<$1>');
            outputData.value = cleaned;
        } else if (mode === 'allowed-tags') {
            // Basic allowed tags: p, b, strong, i, em, a, ul, ol, li, h1-h6
            // First clean styles
            let cleaned = html.replace(/\s+(style|class|id|dir|lang|xml:lang)="[^"]*"/gi, '');
            // Then strip disallowed tags
            const allowedTags = /<\/?(p|b|strong|i|em|a|ul|ol|li|h[1-6]|br)(?:\s+[^>]+)?>/gi;
            let finalHtml = '';
            let match;
            let lastIndex = 0;
            // We do a manual replacement to keep tag contents but remove the tag itself if disallowed
            cleaned = cleaned.replace(/<[^>]*>?/gi, (match) => {
                if (match.match(allowedTags)) {
                    return match;
                }
                return ''; // strip the tag
            });
            outputData.value = cleaned;
        }
    };

    // Instant output reactivity
    on(inputData, 'input', cleanHTML);

    // Process when options change
    modeRadios.forEach(radio => on(radio, 'change', cleanHTML));

    // Copy to clipboard
    on(btnCopy, 'click', () => {
        if (!outputData.value) return;
        copyToClipboard(outputData.value, btnCopy);
    });
}


const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => $('#input-data') || $('#input-text') || document.querySelector('textarea'));

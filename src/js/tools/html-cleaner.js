import { $, on } from '../core/dom.js';
import { copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input: Dirty HTML or Text</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste messy HTML code or rich text from Word..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 300px;"></textarea>
            </div>

            <div class="tool-controls" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; min-width: 200px;">
                <div class="settings-group" style="background: #f4f6f8; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 10px;">Cleaning Mode</h3>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin: 0;">
                        <input type="radio" name="mode" value="remove-styles" checked style="margin: 0;">
                        <span>Remove Inline Styles & Classes</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px; margin-bottom: 0;">
                        <input type="radio" name="mode" value="strip-tags" style="margin: 0;">
                        <span>Strip All HTML Tags (Plain Text)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; margin-top: 8px; margin-bottom: 0;">
                        <input type="radio" name="mode" value="allowed-tags" style="margin: 0;">
                        <span>Keep Only Basic Tags (&lt;p&gt;, &lt;b&gt;, &lt;a&gt;)</span>
                    </label>
                </div>
            </div>

            <div class="tool-panel tool-output-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="output-data" style="font-weight: bold;">Output: Clean Result</label>
                    <button id="btn-copy" class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy Text</button>
                </div>
                <textarea id="output-data" readonly placeholder="Cleaned output will appear here instantly..." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; min-height: 300px;"></textarea>
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

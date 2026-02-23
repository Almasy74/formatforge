const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, '../src/js/tools');
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(toolsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace the input label with a flex container and paste button
    // We look for a label with "Input:" or "for='input...'" 
    content = content.replace(
        /<label for="([^"]+)"[^>]*>(Input:?[^<]*)<\/label>/gi,
        `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="$1" style="font-weight: bold; margin-top: 0;">$2</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>`
    );

    // 2. Shrink the copy button
    content = content.replace(
        /class="btn primary"[^>]*>Copy/gi,
        `class="btn primary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Copy`
    );

    // 3. Inject paste logic at the end of the setup block
    if (!content.includes('btnPaste')) {
        const pasteLogic = `
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
`;

        // Find the last closing brace and insert before it. 
        // This is tricky. Let's look for standard patterns: `on(btnCopy, ...)` or just insert before the end of the file
        // To be safe, we insert right after btn-copy is set up, or just before `root` closes.
        content += `\n// Automatic Paste Binding\nsetTimeout(() => {\n    ${pasteLogic}\n}, 100);\n`;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
});

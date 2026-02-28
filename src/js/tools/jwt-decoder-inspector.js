import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout tool-layout-column">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-token">JWT Token</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste Token</button>
                </div>
                <textarea id="input-token" class="tool-textarea-fill tool-textarea-code-nowrap" autofocus placeholder="Paste JWT token here..."></textarea>
            </div>

            <div class="tool-controls tool-mt-20">
                <div class="settings-group">
                    <h3 class="settings-title">Security Note</h3>
                    <p class="tool-help-text" style="margin-left:0;">This tool decodes JWT locally and does not verify signatures.</p>
                </div>
            </div>

            <div id="error-msg" class="tool-alert tool-mt-20"></div>

            <div class="tool-flex-row-wrap tool-mt-20">
                <div class="tool-panel tool-output-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label>Header</label>
                        <button id="btn-copy-header" class="btn primary btn-sm">Copy Header</button>
                    </div>
                    <pre id="out-header" class="tool-pre-output"></pre>
                </div>

                <div class="tool-panel tool-output-panel tool-panel-column tool-min-w-300">
                    <div class="tool-label-row">
                        <label>Payload</label>
                        <button id="btn-copy-payload" class="btn primary btn-sm">Copy Payload</button>
                    </div>
                    <pre id="out-payload" class="tool-pre-output"></pre>
                </div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column tool-mt-20">
                <label>Claims Inspector</label>
                <pre id="out-claims" class="tool-pre-output"></pre>
            </div>
        </div>
    `;
}

const inputToken = $('#input-token');
const errorMsg = $('#error-msg');
const outHeader = $('#out-header');
const outPayload = $('#out-payload');
const outClaims = $('#out-claims');
const btnCopyHeader = $('#btn-copy-header');
const btnCopyPayload = $('#btn-copy-payload');

const showError = (msg) => {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
};

const hideError = () => {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
};

const decodeBase64Url = (part) => {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
};

const formatEpoch = (seconds) => {
    if (typeof seconds !== 'number') return 'n/a';
    const date = new Date(seconds * 1000);
    return `${date.toISOString()} (${date.toLocaleString()})`;
};

const process = () => {
    hideError();
    outHeader.textContent = '';
    outPayload.textContent = '';
    outClaims.textContent = '';

    const token = inputToken.value.trim();
    if (!token) return;

    const parts = token.split('.');
    if (parts.length < 2) {
        showError('Invalid JWT format: expected at least header.payload');
        return;
    }

    try {
        const header = JSON.parse(decodeBase64Url(parts[0]));
        const payload = JSON.parse(decodeBase64Url(parts[1]));

        outHeader.textContent = JSON.stringify(header, null, 2);
        outPayload.textContent = JSON.stringify(payload, null, 2);

        const claimLines = [
            `alg: ${header.alg ?? 'n/a'}`,
            `typ: ${header.typ ?? 'n/a'}`,
            `iss: ${payload.iss ?? 'n/a'}`,
            `sub: ${payload.sub ?? 'n/a'}`,
            `aud: ${Array.isArray(payload.aud) ? payload.aud.join(', ') : (payload.aud ?? 'n/a')}`,
            `iat: ${formatEpoch(payload.iat)}`,
            `nbf: ${formatEpoch(payload.nbf)}`,
            `exp: ${formatEpoch(payload.exp)}`
        ];

        if (typeof payload.exp === 'number') {
            const now = Math.floor(Date.now() / 1000);
            claimLines.push(`expired: ${payload.exp <= now ? 'yes' : 'no'}`);
        }

        claimLines.push('');
        claimLines.push('Note: Signature is NOT verified in this tool.');
        outClaims.textContent = claimLines.join('\n');
    } catch (err) {
        showError(`Decode error: ${err.message}`);
    }
};

on(inputToken, 'input', process);

on(btnCopyHeader, 'click', () => {
    if (!outHeader.textContent) return;
    copyToClipboard(outHeader.textContent, btnCopyHeader);
});

on(btnCopyPayload, 'click', () => {
    if (!outPayload.textContent) return;
    copyToClipboard(outPayload.textContent, btnCopyPayload);
});

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => inputToken, { onPaste: () => process() });

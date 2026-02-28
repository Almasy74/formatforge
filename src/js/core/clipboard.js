import { on } from './dom.js';

// Shared clipboard utilities
export const copyToClipboard = async (text, buttonElement = null) => {
    try {
        await navigator.clipboard.writeText(text);
        if (buttonElement) {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('success-state');
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('success-state');
            }, 2000);
        }
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        if (buttonElement) {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Error';
            buttonElement.classList.add('error-state');
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('error-state');
            }, 2000);
        }
        return false;
    }
};

export const readClipboardText = async () => {
    return navigator.clipboard.readText();
};

export const bindPasteButton = (buttonElement, getTargetInput, options = {}) => {
    on(buttonElement, 'click', async () => {
        try {
            const text = await readClipboardText();
            const targetInput = typeof getTargetInput === 'function' ? getTargetInput() : getTargetInput;
            if (!targetInput) return false;

            targetInput.value = text;

            if (options.dispatchEvent !== false) {
                const eventName = options.eventName || 'input';
                targetInput.dispatchEvent(new Event(eventName));
            }

            if (typeof options.onPaste === 'function') {
                options.onPaste(text, targetInput);
            }

            return true;
        } catch (err) {
            console.error('Failed to read clipboard', err);
            return false;
        }
    });
};

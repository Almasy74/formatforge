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

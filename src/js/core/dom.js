// Shared DOM utilities
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

export const on = (element, event, handler) => {
    if (element) {
        element.addEventListener(event, handler);
    }
};

export const show = (element) => {
    if (element) element.classList.remove('hidden');
    if (element) element.style.display = '';
};

export const hide = (element) => {
    if (element) element.classList.add('hidden');
    if (element) element.style.display = 'none';
};

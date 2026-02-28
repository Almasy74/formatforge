import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input (XML or JSON)</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill tool-textarea-code-nowrap" autofocus placeholder="Paste XML or JSON here..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Conversion Mode</h3>
                    <label class="option-row option-row-first">
                        <input type="radio" name="mode" value="auto" checked />
                        <span>Auto detect</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="xml-to-json" />
                        <span>XML -> JSON</span>
                    </label>
                    <label class="option-row">
                        <input type="radio" name="mode" value="json-to-xml" />
                        <span>JSON -> XML</span>
                    </label>
                    <button id="btn-convert" class="btn primary">Convert</button>
                </div>

                <div id="error-msg" class="tool-alert"></div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">Output</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy Output</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output tool-textarea-code-nowrap" readonly placeholder="Converted data appears here..."></textarea>
            </div>
        </div>
    `;
}

const inputData = $('#input-data');
const outputData = $('#output-data');
const btnConvert = $('#btn-convert');
const btnCopy = $('#btn-copy');
const errorMsg = $('#error-msg');

const showError = (msg) => {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
};

const hideError = () => {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
};

const xmlEscape = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const xmlNodeToObject = (node) => {
    const obj = {};

    if (node.attributes && node.attributes.length > 0) {
        obj['@attributes'] = {};
        Array.from(node.attributes).forEach(attr => {
            obj['@attributes'][attr.name] = attr.value;
        });
    }

    const elementChildren = Array.from(node.childNodes).filter(n => n.nodeType === 1);
    const textNodes = Array.from(node.childNodes).filter(n => n.nodeType === 3).map(n => n.nodeValue.trim()).filter(Boolean);

    if (elementChildren.length === 0) {
        if (textNodes.length === 0) return Object.keys(obj).length ? obj : '';
        if (Object.keys(obj).length === 0) return textNodes.join(' ');
        obj['#text'] = textNodes.join(' ');
        return obj;
    }

    elementChildren.forEach(child => {
        const val = xmlNodeToObject(child);
        if (Object.prototype.hasOwnProperty.call(obj, child.nodeName)) {
            if (!Array.isArray(obj[child.nodeName])) {
                obj[child.nodeName] = [obj[child.nodeName]];
            }
            obj[child.nodeName].push(val);
        } else {
            obj[child.nodeName] = val;
        }
    });

    if (textNodes.length) {
        obj['#text'] = textNodes.join(' ');
    }

    return obj;
};

const xmlToJson = (xmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
        throw new Error('Invalid XML input');
    }

    const rootElement = doc.documentElement;
    if (!rootElement) throw new Error('No XML root element found');

    const result = {
        [rootElement.nodeName]: xmlNodeToObject(rootElement)
    };
    return JSON.stringify(result, null, 2);
};

const objectToXml = (value, nodeName) => {
    if (value === null || value === undefined) {
        return `<${nodeName}></${nodeName}>`;
    }

    if (typeof value !== 'object') {
        return `<${nodeName}>${xmlEscape(value)}</${nodeName}>`;
    }

    if (Array.isArray(value)) {
        return value.map(v => objectToXml(v, nodeName)).join('');
    }

    let attrs = '';
    let text = '';
    let children = '';

    Object.keys(value).forEach((key) => {
        const val = value[key];
        if (key === '@attributes' && val && typeof val === 'object') {
            Object.keys(val).forEach((attrKey) => {
                attrs += ` ${attrKey}="${xmlEscape(val[attrKey])}"`;
            });
            return;
        }
        if (key === '#text') {
            text += xmlEscape(val);
            return;
        }
        children += objectToXml(val, key);
    });

    return `<${nodeName}${attrs}>${text}${children}</${nodeName}>`;
};

const prettyXml = (xml) => {
    const normalized = xml.replace(/>(\s*)</g, '><').replace(/</g, '\n<').trim();
    const lines = normalized.split('\n').filter(Boolean);
    let indent = 0;
    const out = [];

    lines.forEach((line) => {
        if (line.match(/^<\/.+>/)) indent = Math.max(indent - 1, 0);
        out.push(`${'  '.repeat(indent)}${line}`);
        if (line.match(/^<[^!?/][^>]*[^/]>/) && !line.includes('</')) indent += 1;
    });

    return out.join('\n');
};

const jsonToXml = (jsonString) => {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON root must be an object');
    }

    const rootKeys = Object.keys(parsed);
    if (rootKeys.length === 0) throw new Error('JSON object is empty');

    const rootName = rootKeys[0];
    const xml = objectToXml(parsed[rootName], rootName);
    return prettyXml(xml);
};

const detectMode = (value) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('<')) return 'xml-to-json';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json-to-xml';
    return 'xml-to-json';
};

const process = () => {
    hideError();
    const value = inputData.value.trim();
    if (!value) {
        outputData.value = '';
        return;
    }

    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const mode = selectedMode === 'auto' ? detectMode(value) : selectedMode;

    try {
        if (mode === 'xml-to-json') {
            outputData.value = xmlToJson(value);
        } else {
            outputData.value = jsonToXml(value);
        }
    } catch (err) {
        outputData.value = '';
        showError(`Error: ${err.message}`);
    }
};

on(btnConvert, 'click', process);
on(inputData, 'input', process);
document.querySelectorAll('input[name="mode"]').forEach(r => on(r, 'change', process));

on(btnCopy, 'click', () => {
    if (!outputData.value) return;
    copyToClipboard(outputData.value, btnCopy);
});

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => inputData, { onPaste: () => process() });

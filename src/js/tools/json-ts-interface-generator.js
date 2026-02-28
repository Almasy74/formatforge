import { $, on } from '../core/dom.js';
import { bindPasteButton, copyToClipboard } from '../core/clipboard.js';

const root = $('#tool-root');
if (root) {
    root.innerHTML = `
        <div class="tool-layout">
            <div class="tool-panel tool-input-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="input-data">Input JSON</label>
                    <button id="btn-paste" class="btn secondary btn-sm">Paste JSON</button>
                </div>
                <textarea id="input-data" class="tool-textarea-fill tool-textarea-code-nowrap" autofocus placeholder="Paste JSON here..."></textarea>
            </div>

            <div class="tool-controls tool-controls-side">
                <div class="settings-group">
                    <h3 class="settings-title">Generator Options</h3>
                    <label class="option-row option-row-first">
                        <span>Root Interface Name</span>
                    </label>
                    <input id="root-name" type="text" value="User" placeholder="User" />
                    <label class="option-row">
                        <input id="opt-strict-null" type="checkbox" checked />
                        <span>Use strict null typing</span>
                    </label>
                    <button id="btn-generate" class="btn primary">Generate Interfaces</button>
                </div>

                <div id="error-msg" class="tool-alert"></div>
            </div>

            <div class="tool-panel tool-output-panel tool-panel-column">
                <div class="tool-label-row">
                    <label for="output-data">TypeScript Output</label>
                    <button id="btn-copy" class="btn primary btn-sm">Copy TS</button>
                </div>
                <textarea id="output-data" class="tool-textarea-fill tool-textarea-output tool-textarea-code-nowrap" readonly placeholder="Generated TypeScript interfaces appear here..."></textarea>
            </div>
        </div>
    `;
}

const inputData = $('#input-data');
const outputData = $('#output-data');
const rootNameInput = $('#root-name');
const optStrictNull = $('#opt-strict-null');
const btnGenerate = $('#btn-generate');
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

const toPascalCase = (text) => {
    return String(text || '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') || 'Item';
};

const toTypeFieldName = (key) => {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
};

const dedupe = (arr) => [...new Set(arr)];

function generateInterfaces(jsonInput, rootName, strictNull) {
    const parsed = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;

    const interfaces = [];
    const interfaceMap = new Map();
    const usedNames = new Set();

    const ensureUniqueName = (name) => {
        let next = toPascalCase(name);
        if (!usedNames.has(next)) {
            usedNames.add(next);
            return next;
        }
        let i = 2;
        while (usedNames.has(`${next}${i}`)) i++;
        const finalName = `${next}${i}`;
        usedNames.add(finalName);
        return finalName;
    };

    const getType = (value, hint) => {
        if (value === null) return strictNull ? 'null' : 'any';

        const t = typeof value;
        if (t === 'string') return 'string';
        if (t === 'number') return Number.isInteger(value) ? 'number' : 'number';
        if (t === 'boolean') return 'boolean';

        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';

            const allObjects = value.every(v => v && typeof v === 'object' && !Array.isArray(v));
            if (allObjects) {
                const childName = ensureUniqueName(`${hint}Item`);
                registerInterfaceFromObjects(childName, value);
                return `${childName}[]`;
            }

            const itemTypes = dedupe(value.map(v => getType(v, `${hint}Item`)));
            if (itemTypes.length === 1) return `${itemTypes[0]}[]`;
            return `(${itemTypes.join(' | ')})[]`;
        }

        if (t === 'object') {
            const childName = ensureUniqueName(hint);
            registerInterfaceFromObject(childName, value);
            return childName;
        }

        return 'any';
    };

    const registerInterfaceFromObject = (name, obj) => {
        if (interfaceMap.has(name)) return;
        const fields = [];
        Object.keys(obj).forEach((key) => {
            const type = getType(obj[key], toPascalCase(key));
            fields.push({ key, type, optional: false });
        });
        interfaceMap.set(name, fields);
        interfaces.push(name);
    };

    const registerInterfaceFromObjects = (name, rows) => {
        if (interfaceMap.has(name)) return;

        const allKeys = dedupe(rows.flatMap(row => Object.keys(row)));
        const fields = allKeys.map((key) => {
            const presentValues = rows
                .filter(row => Object.prototype.hasOwnProperty.call(row, key))
                .map(row => row[key]);

            const types = dedupe(presentValues.map(v => getType(v, toPascalCase(key))));
            const optional = presentValues.length < rows.length;
            const finalType = types.length === 0 ? 'any' : types.join(' | ');
            return { key, type: finalType, optional };
        });

        interfaceMap.set(name, fields);
        interfaces.push(name);
    };

    const rootInterfaceName = ensureUniqueName(rootName || 'RootObject');
    let rootTypeDefinition = `interface ${rootInterfaceName} {}`;

    if (Array.isArray(parsed)) {
        if (parsed.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
            registerInterfaceFromObjects(rootInterfaceName, parsed);
            rootTypeDefinition = `type ${rootInterfaceName}List = ${rootInterfaceName}[];`;
        } else {
            const arrayType = getType(parsed, rootInterfaceName);
            rootTypeDefinition = `type ${rootInterfaceName} = ${arrayType};`;
        }
    } else if (parsed && typeof parsed === 'object') {
        registerInterfaceFromObject(rootInterfaceName, parsed);
    } else {
        const primitiveType = getType(parsed, rootInterfaceName);
        rootTypeDefinition = `type ${rootInterfaceName} = ${primitiveType};`;
    }

    const blocks = interfaces.map((name) => {
        const fields = interfaceMap.get(name) || [];
        const fieldLines = fields.map((f) => {
            const optional = f.optional ? '?' : '';
            return `  ${toTypeFieldName(f.key)}${optional}: ${f.type};`;
        });
        return `interface ${name} {\n${fieldLines.join('\n')}\n}`;
    });

    if (!blocks.length || !blocks[0].startsWith(`interface ${rootInterfaceName}`)) {
        blocks.unshift(rootTypeDefinition);
    } else if (rootTypeDefinition.startsWith('type ')) {
        blocks.push(rootTypeDefinition);
    }

    return blocks.join('\n\n');
}

const process = () => {
    hideError();
    const source = inputData.value.trim();
    if (!source) {
        outputData.value = '';
        return;
    }

    try {
        const ts = generateInterfaces(source, rootNameInput.value.trim() || 'RootObject', optStrictNull.checked);
        outputData.value = ts;
    } catch (err) {
        outputData.value = '';
        showError(`Error: ${err.message}`);
    }
};

on(btnGenerate, 'click', process);
on(inputData, 'input', process);
on(rootNameInput, 'input', process);
on(optStrictNull, 'change', process);

on(btnCopy, 'click', () => {
    if (!outputData.value) return;
    copyToClipboard(outputData.value, btnCopy);
});

const btnPaste = $('#btn-paste');
bindPasteButton(btnPaste, () => inputData, { onPaste: () => process() });

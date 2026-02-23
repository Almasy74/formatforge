const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../data/tools.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Add json-validator and json-minifier variants
const jsonFormatter = data.tools.find(t => t.id === 'json-formatter');

if (jsonFormatter && !data.tools.find(t => t.id === 'json-validator')) {
    const validator = JSON.parse(JSON.stringify(jsonFormatter));
    validator.id = 'json-validator';
    validator.path = '/json/json-validator/';
    validator.seo.h1 = 'JSON Validator';
    validator.seo.title = 'Free JSON Validator Online | FormatForge';
    validator.seo.canonical = '/json/json-validator/';
    validator.content.aeoDescription = 'This tool parses JSON string payloads and validates them against strict JSON syntax rules, highlighting errors block by block.';
    validator.flags.variantOf = 'json-formatter';

    // push after formatter
    const idx = data.tools.findIndex(t => t.id === 'json-formatter');
    data.tools.splice(idx + 1, 0, validator);
}

if (jsonFormatter && !data.tools.find(t => t.id === 'json-minifier')) {
    const minifier = JSON.parse(JSON.stringify(jsonFormatter));
    minifier.id = 'json-minifier';
    minifier.path = '/json/json-minifier/';
    minifier.seo.h1 = 'JSON Minifier & Compressor';
    minifier.seo.title = 'Free JSON Minifier Online | FormatForge';
    minifier.seo.canonical = '/json/json-minifier/';
    minifier.content.aeoDescription = 'This tool compresses JSON data by removing all unnecessary whitespace, newlines, and tabs, returning a minified string.';
    minifier.flags.variantOf = 'json-formatter';

    // push after validator
    const idx = data.tools.findIndex(t => t.id === 'json-validator');
    data.tools.splice(idx + 1, 0, minifier);
}

// 2. Add ioFormats to all tools
const ioMap = {
    'remove-line-breaks': { input: 'Raw Text', output: 'Formatted Text' },
    'html-cleaner': { input: 'HTML String', output: 'Clean HTML / Text' },
    'remove-duplicate-lines': { input: 'Text List (Newline separated)', output: 'Unique Text List' },
    'csv-json-converter': { input: 'CSV / JSON', output: 'JSON / CSV' },
    'json-formatter': { input: 'JSON String', output: 'Pretty JSON' },
    'json-validator': { input: 'JSON String', output: 'Validation Stream' },
    'json-minifier': { input: 'JSON Object / String', output: 'Minified JSON String' },
    'text-diff-checker': { input: 'Original Text + Edited Text', output: 'Diff Analysis' },
    'word-counter': { input: 'Raw Text', output: 'Metrics & Data' },
    'text-analyzer': { input: 'Raw Text', output: 'Statistical Data' },
    'case-converter': { input: 'Raw Text Strings', output: 'Formatted Case Strings' },
    'regex-tester': { input: 'Regex Pattern + Text', output: 'Match Data Array' },
    'base64-encode-decode': { input: 'UTF-8 String / Base64 Payload', output: 'Base64 Payload / UTF-8 String' },
    'url-encoder-decoder': { input: 'UTF-8 String / URL Encoded', output: 'URL Encoded / UTF-8 String' },
    'smart-slug-generator': { input: 'Raw Text Title', output: 'URL-safe Slug' }
};

data.tools.forEach(tool => {
    if (ioMap[tool.id]) {
        tool.content.ioFormats = ioMap[tool.id];
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 4));
console.log("Variant tools added and ioFormats injected.");

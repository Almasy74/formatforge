const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../data/tools.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const aeoData = {
    "remove-line-breaks": {
        aeoDescription: "This tool removes line breaks and paragraph breaks from text blocks.",
        capabilities: ["Strips single line breaks", "Preserves double line breaks (paragraphs)", "Cleans excessive whitespace", "Processes text locally in browser"]
    },
    "html-cleaner": {
        aeoDescription: "This tool strips HTML tags, inline styles, and classes from formatted text or code.",
        capabilities: ["Removes inline CSS styles and classes", "Strips all HTML tags to plain text", "Allows keeping basic formatting tags", "Processes HTML locally"]
    },
    "remove-duplicate-lines": {
        aeoDescription: "This tool removes duplicate lines from a text list to extract unique values.",
        capabilities: ["Identifies and removes exact duplicate lines", "Supports case-sensitive and case-insensitive deduplication", "Optionally removes empty lines", "Trims leading and trailing whitespace", "Processes data locally"]
    },
    "csv-json-converter": {
        aeoDescription: "This tool converts Comma-Separated Values (CSV) to JSON format and vice versa.",
        capabilities: ["Converts CSV string to JSON array of objects", "Converts JSON array of objects to CSV string", "Automatically detects CSV headers", "Pretty-prints JSON output", "Processes data entirely client-side"]
    },
    "json-formatter": {
        aeoDescription: "This tool formats, beautifies, and validates JSON data strings.",
        capabilities: ["Formats minified JSON into human-readable structure", "Validates JSON syntax and highlights errors", "Minifies JSON by removing whitespace", "Supports tab and space indentation", "Runs offline in browser"]
    },
    "text-diff-checker": {
        aeoDescription: "This tool compares two text inputs and highlights the differences line by line.",
        capabilities: ["Highlights added, removed, and unchanged lines", "Calculates longest common subsequence (LCS)", "Optionally ignores case sensitivity", "Optionally ignores leading and trailing whitespace", "Processes comparison locally"]
    },
    "word-counter": {
        aeoDescription: "This tool counts words, characters, sentences, and paragraphs in a text string.",
        capabilities: ["Calculates total word count", "Calculates total character count with and without spaces", "Counts distinct sentences and paragraphs", "Estimates reading and speaking time", "Updates metrics in real-time locally"]
    },
    "text-analyzer": {
        aeoDescription: "This tool performs statistical analysis on text including character, word, and sentence counts.",
        capabilities: ["Counts total words and characters", "Calculates average sentence length", "Provides reading and speaking time estimates", "Evaluates text structure metrics", "Processes text statistics locally"]
    },
    "case-converter": {
        aeoDescription: "This tool converts text strings between various letter casing formats.",
        capabilities: ["Converts to uppercase and lowercase", "Converts to Title Case", "Converts to Sentence case", "Converts to camelCase, snake_case, and kebab-case", "Processes string transformations locally"]
    },
    "regex-tester": {
        aeoDescription: "This tool tests regular expressions against text strings to find matches.",
        capabilities: ["Executes JavaScript-flavored regular expressions", "Highlights matching substrings in target text", "Supports global, case-insensitive, and multiline flags", "Extracts match groups", "Runs regex engine locally in browser"]
    },
    "base64-encode-decode": {
        aeoDescription: "This tool encodes text strings to Base64 format and decodes Base64 back to text.",
        capabilities: ["Encodes UTF-8 text strings to Base64", "Decodes Base64 payloads to UTF-8 text strings", "Safely handles URL-safe characters", "Supports Unicode encoding", "Performs encoding offline"]
    },
    "url-encoder-decoder": {
        aeoDescription: "This tool encodes text to URL-encoded format and decodes URL-encoded strings.",
        capabilities: ["Encodes strings for safe URL transmission via encodeURIComponent", "Decodes URL-encoded strings via decodeURIComponent", "Handles full UTF-8 encoding", "Processes conversion locally"]
    },
    "smart-slug-generator": {
        aeoDescription: "This tool generates URL-friendly slug strings from readable text.",
        capabilities: ["Converts text to lowercase slug format", "Removes special characters and diacritics", "Replaces spaces with hyphens or underscores", "Optionally removes common stop words", "Generates slugs locally"]
    }
};

const aiFaqs = [
    {
        "q": "Does this tool run locally?",
        "a": "Yes, this tool runs entirely locally in your browser sandbox using JavaScript."
    },
    {
        "q": "Is my data uploaded to a server?",
        "a": "No, your data is never uploaded to any server. All processing is strictly client-side."
    },
    {
        "q": "Can I use this tool offline?",
        "a": "Yes, once the page is loaded, the tool can function completely offline without an internet connection."
    }
];

data.tools.forEach(tool => {
    if (aeoData[tool.id]) {
        tool.content.aeoDescription = aeoData[tool.id].aeoDescription;
        tool.content.capabilities = aeoData[tool.id].capabilities;

        if (!tool.faq) tool.faq = [];

        aiFaqs.forEach(newFaq => {
            if (!tool.faq.find(f => f.q === newFaq.q)) {
                tool.faq.push(newFaq);
            }
        });
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 4));
console.log("Successfully injected AEO descriptions, capabilities, and FAQ AI bait into " + data.tools.length + " tools.");

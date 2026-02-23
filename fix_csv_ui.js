const fs = require('fs');
const path = 'src/js/tools/csv-json-converter.js';
let content = fs.readFileSync(path, 'utf8');

const jsReplacement = `    const updateFormatUI = (format) => {
        optionsPlaceholder.style.display = 'none';
        detectedFormatLabel.style.display = 'inline-block';
        if (format === 'JSON') {
            detectedFormatLabel.textContent = 'Detected: JSON';
            detectedFormatLabel.style.background = '#e3f2fd'; // Blue
            detectedFormatLabel.style.color = '#1565c0';

            jsonOptions.style.display = 'none'; // Only applies to CSV->JSON
            csvOptions.style.display = 'block'; // Applies to JSON->CSV

        } else if (format === 'CSV') {
            detectedFormatLabel.textContent = 'Detected: CSV';
            detectedFormatLabel.style.background = '#e8f5e9'; // Green
            detectedFormatLabel.style.color = '#2e7d32';

            jsonOptions.style.display = 'block'; // Applies to CSV->JSON
            csvOptions.style.display = 'block'; // To choose which delimiter it's parsing
        } else {
            detectedFormatLabel.style.display = 'none';

            jsonOptions.style.display = 'none';
            csvOptions.style.display = 'none';
            optionsPlaceholder.style.display = 'block';
        }
    };`;

// Use a regex that matches the function regardless of exact line breaks inside
const jsPattern = /const updateFormatUI = \(format\) => \{[\s\S]*?optionsPlaceholder\.style\.display = 'none';[\s\S]*?optionsPlaceholder\.style\.display = 'block';\s*\}\s*;/i;

if (jsPattern.test(content)) {
    content = content.replace(jsPattern, jsReplacement);
    console.log('JS logic updated.');
} else {
    console.log('JS pattern not found.');
}

fs.writeFileSync(path, content);
console.log('Done.');

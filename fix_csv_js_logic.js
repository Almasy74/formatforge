const fs = require('fs');
const path = 'src/js/tools/csv-json-converter.js';
let content = fs.readFileSync(path, 'utf8');

// The exact function code we want to replace
const functionCodeMatch = `    const updateFormatUI = (format) => {
        optionsPlaceholder.style.display = 'none';
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
            detectedFormatLabel.textContent = 'Waiting for input...';
            detectedFormatLabel.style.background = '#e0e0e0';
            detectedFormatLabel.style.color = '#555';

            jsonOptions.style.display = 'none';
            csvOptions.style.display = 'none';
            optionsPlaceholder.style.display = 'block';
        }
    };`;

const functionCodeReplacement = `    const updateFormatUI = (format) => {
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

if (content.includes(functionCodeMatch)) {
    content = content.replace(functionCodeMatch, functionCodeReplacement);
    console.log('Function updateFormatUI updated.');
} else {
    console.log('Function string not found exactly.');
    // Check for a smaller anchor to be sure
    if (content.includes("detectedFormatLabel.textContent = 'Waiting for input...';")) {
        console.log('Found the badge text, attempting regex replacement...');
        content = content.replace(/detectedFormatLabel\.textContent = 'Waiting for input\.\.\.';\s*detectedFormatLabel\.style\.background = '#e0e0e0';\s*detectedFormatLabel\.style\.color = '#555';/gs, "detectedFormatLabel.style.display = 'none';");
        // Also need to add display: inline-block in the other branches
        content = content.replace(/detectedFormatLabel\.style\.color = '#1565c0';/g, "detectedFormatLabel.style.color = '#1565c0';\n            detectedFormatLabel.style.display = 'inline-block';");
        content = content.replace(/detectedFormatLabel\.style\.color = '#2e7d32';/g, "detectedFormatLabel.style.color = '#2e7d32';\n            detectedFormatLabel.style.display = 'inline-block';");
        console.log('Regex replacements applied.');
    }
}

fs.writeFileSync(path, content);
console.log('Done.');

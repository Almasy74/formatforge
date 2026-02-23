const fs = require('fs');
let content = fs.readFileSync('src/js/tools/csv-json-converter.js', 'utf8');

const htmlMatch = `                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input (CSV or JSON)</label>
                    <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; align-self: center;">Paste Text</button>
                </div>
                    <span id="detected-format" style="font-size: 12px; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: #e0e0e0; color: #555;">Waiting for input...</span>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste CSV text or a JSON array here... The format is detected automatically." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 400px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>`;

const htmlReplacement = `                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label for="input-data" style="font-weight: bold; margin-top: 0;">Input (CSV or JSON)</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span id="detected-format" style="font-size: 12px; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: none;"></span>
                        <button id="btn-paste" class="btn secondary btn-sm" style="padding: 4px 12px; font-size: 13px; width: auto; margin: 0;">Paste Text</button>
                    </div>
                </div>
                <textarea id="input-data" autofocus placeholder="Paste CSV text or a JSON array here... The format is detected automatically." style="flex: 1; padding: 10px; font-family: monospace; resize: none; border: 1px solid #ccc; border-radius: 4px; min-height: 400px; margin-bottom: 15px; white-space: pre; overflow-wrap: normal; overflow-x: auto;"></textarea>`;

content = content.replace(htmlMatch, htmlReplacement);

const jsMatch = `    const updateFormatUI = (format) => {
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

content = content.replace(jsMatch, jsReplacement);
fs.writeFileSync('src/js/tools/csv-json-converter.js', content);
console.log('Update script finished successfully.');

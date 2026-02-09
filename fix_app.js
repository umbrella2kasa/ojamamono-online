const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'hi040', 'OneDrive', 'Desktop', 'お邪魔もの', 'client', 'src', 'App.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Remove lines 507 to 1164 (1-based index)
// Array index: 506 to 1163
if (lines.length < 1164) {
    console.error('File acts shorter than expected:', lines.length);
    process.exit(1);
}

// Verify line 506 (index) matches expected "flex items-center gap-4" logic
// Line 507 in editor is index 506.
console.log('Line 507 (to delete):', lines[506]);
console.log('Line 1164 (to delete):', lines[1163]);
console.log('Line 1165 (to keep):', lines[1164]);

// Logic check:
// Index 506 is the start of deletion.
// Index 1163 is the end of deletion.
// Splice count = 1163 - 506 + 1.
lines.splice(506, 1163 - 506 + 1);

const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully removed lines.');

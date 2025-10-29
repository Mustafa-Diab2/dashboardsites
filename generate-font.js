// Script to generate proper font file for jsPDF
const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'public', 'fonts', 'Amiri-Regular.ttf');
const outputPath = path.join(__dirname, 'src', 'lib', 'fonts', 'amiri-font-proper.ts');

// Read the font file
const fontBuffer = fs.readFileSync(fontPath);

// Convert to base64
const base64Font = fontBuffer.toString('base64');

// Create the TypeScript file
const content = `// Auto-generated Amiri font for jsPDF
export const amiriFont = '${base64Font}';
`;

fs.writeFileSync(outputPath, content);

console.log('Font file generated successfully!');
console.log(`Output: ${outputPath}`);
console.log(`Size: ${(base64Font.length / 1024).toFixed(2)} KB`);

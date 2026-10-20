import fs from 'fs';
const redPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const buffer = Buffer.from(redPngBase64, 'base64');

fs.writeFileSync('extension/icon16.png', buffer);
fs.writeFileSync('extension/icon48.png', buffer);
fs.writeFileSync('extension/icon128.png', buffer);
console.log('Generated extension icons successfully.');

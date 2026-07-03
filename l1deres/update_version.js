const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// Update package.json files
replaceInFile(path.join(__dirname, 'web', 'package.json'), /"version": "1.0.0"/g, '"version": "1.1.0"');
replaceInFile(path.join(__dirname, 'web', 'package-lock.json'), /"version": "1.0.0"/g, '"version": "1.1.0"');

// Update UI files
const files = [
  'web/src/app/page.tsx',
  'web/src/app/login/page.tsx',
  'web/src/app/lavadero/pedido/tracking/page.tsx',
  'web/src/app/lavadero/pedido/page.tsx',
  'web/src/app/lavadero/page.tsx',
  'web/src/app/admin/layout.tsx'
];

files.forEach(f => {
  replaceInFile(path.join(__dirname, f), /v1\.0/g, 'v1.1');
});

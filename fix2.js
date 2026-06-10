const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf-8');
content = content.replace(/ \}, active: true/g, ', active: true }');
fs.writeFileSync('app.js', content);

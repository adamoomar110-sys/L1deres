const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = original
        .replace(/Lavadero de Lujo/gi, 'Lavadero L1deres')
        .replace(/Lavadero VIP/gi, 'Lavadero L1deres');
    if (original !== updated) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

const files = [
    'index.html', 'index_fixed.html',
    'cliente.html', 'app_cliente.html',
    'tv_espera.html', 'tv_precios.html',
    'postular.html',
    'web/src/app/admin/lavadero/page.tsx',
    'AGENTS.md'
];

files.forEach(f => replaceInFile(path.join(process.cwd(), f)));

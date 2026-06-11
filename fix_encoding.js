const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const filesToFix = getAllFiles(__dirname);

const replacements = [
    { bad: /á/g, good: 'á' },
    { bad: /é/g, good: 'é' },
    { bad: /í/g, good: 'í' },
    { bad: /ó/g, good: 'ó' },
    { bad: /ú/g, good: 'ú' },
    { bad: /ñ/g, good: 'ñ' },
    { bad: /Ñ/g, good: 'Ñ' },
    { bad: /Á/g, good: 'Á' },
    { bad: /É/g, good: 'É' },
    { bad: /Á/g, good: 'Í' },
    { bad: /Ó/g, good: 'Ó' },
    { bad: /Ú/g, good: 'Ú' },
    { bad: /“/g, good: '“' },
    { bad: /”/g, good: '”' },
    { bad: /‘/g, good: '‘' },
    { bad: /’/g, good: '’' },
    { bad: /⚡/g, good: '⚡' },
    { bad: /📋/g, good: '📋' },
    { bad: /•/g, good: '•' },
    { bad: /✓/g, good: '✓' },
    { bad: /CÁMARA/g, good: 'CÁMARA' },
    { bad: //g, good: '' }
];

filesToFix.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;
    replacements.forEach(r => {
        content = content.replace(r.bad, r.good);
    });
    
    // Additional manual overrides
    content = content.replace(/Vehículo/g, 'Vehículo');
    content = content.replace(/Vehículo/g, 'Vehículo');
    content = content.replace(/Estética/g, 'Estética');
    content = content.replace(/Configuración/g, 'Configuración');
    content = content.replace(/Gestión/g, 'Gestión');
    content = content.replace(/Simulación/g, 'Simulación');
    content = content.replace(/Acción/g, 'Acción');
    content = content.replace(/Facturación/g, 'Facturación');
    content = content.replace(/Recaudación/g, 'Recaudación');
    content = content.replace(/Automático/g, 'Automático');
    content = content.replace(/más/g, 'más');
    content = content.replace(/Vacío/g, 'Vacío');
    content = content.replace(/Línea/g, 'Línea');
    content = content.replace(/diseño/g, 'diseño');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Fixed mojibake in', file);
    }
});

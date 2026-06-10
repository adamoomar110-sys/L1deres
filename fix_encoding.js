const fs = require('fs');

const filesToFix = ['index.html', 'app.js', 'cliente.html', 'style.css'];

const replacements = [
    { bad: /Ã¡/g, good: 'á' },
    { bad: /Ã©/g, good: 'é' },
    { bad: /Ã­/g, good: 'í' },
    { bad: /Ã³/g, good: 'ó' },
    { bad: /Ãº/g, good: 'ú' },
    { bad: /Ã±/g, good: 'ñ' },
    { bad: /Ã‘/g, good: 'Ñ' },
    { bad: /Ã/g, good: 'Á' },
    { bad: /Ã‰/g, good: 'É' },
    { bad: /Ã/g, good: 'Í' },
    { bad: /Ã“/g, good: 'Ó' },
    { bad: /Ãš/g, good: 'Ú' },
    { bad: /â€œ/g, good: '“' },
    { bad: /â€/g, good: '”' },
    { bad: /â€˜/g, good: '‘' },
    { bad: /â€™/g, good: '’' },
    { bad: /Â/g, good: '' } // A veces aparece un Â fantasma antes de espacios o símbolos
];

filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        let original = content;
        replacements.forEach(r => {
            content = content.replace(r.bad, r.good);
        });
        
        // Let's also do a pass for isolated 'í' issues that might be rendered as Ã
        // e.g., "VehÃ­culo"
        content = content.replace(/VehÃ-culo/g, 'Vehículo');
        content = content.replace(/VehÃculo/g, 'Vehículo');
        content = content.replace(/EstÃ©tica/g, 'Estética');
        content = content.replace(/ConfiguraciÃ³n/g, 'Configuración');
        content = content.replace(/GestiÃ³n/g, 'Gestión');
        content = content.replace(/SimulaciÃ³n/g, 'Simulación');
        content = content.replace(/AcciÃ³n/g, 'Acción');
        content = content.replace(/FacturaciÃ³n/g, 'Facturación');
        content = content.replace(/RecaudaciÃ³n/g, 'Recaudación');
        content = content.replace(/AutomÃ¡tico/g, 'Automático');
        content = content.replace(/mÃ¡s/g, 'más');
        content = content.replace(/VacÃo/g, 'Vacío');
        content = content.replace(/LÃnea/g, 'Línea');
        content = content.replace(/diseÃ±o/g, 'diseño');

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf-8');
            console.log('Fixed mojibake in', file);
        }
    }
});

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The section
const match = html.match(/<!-- SECCIÓN CLUB DE SOCIOS [\s\S]*?<\/section>/);
if (match) {
    let sectionHtml = match[0];
    
    // Remove from original position
    html = html.replace(sectionHtml, '');
    
    // Fix buttons
    sectionHtml = sectionHtml.replace(/<button class="btn btn-socio-black"([^>]*)>/g, '<button class="btn btn-socio-black"$1 onclick="window.location.href=\'cliente/\'">');
    sectionHtml = sectionHtml.replace(/<button class="btn btn-socio-gold"([^>]*)>/g, '<button class="btn btn-socio-gold"$1 onclick="window.location.href=\'cliente/\'">');
    
    // Insert after hero
    html = html.replace('<!-- SECCIÓN CIRCUITO ESPEJO EN TIEMPO REAL -->', sectionHtml + '\n\n    <!-- SECCIÓN CIRCUITO ESPEJO EN TIEMPO REAL -->');
    
    fs.writeFileSync('index.html', html);
    console.log('Successfully moved and updated buttons!');
} else {
    console.log('Could not find the section!');
}

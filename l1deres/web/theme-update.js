const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Backgrounds
            content = content.replace(/bg-\[\#020617\]/g, 'bg-orange-50');
            content = content.replace(/bg-\[\#030303\]/g, 'bg-orange-50');
            content = content.replace(/bg-slate-900\/40/g, 'bg-white/80');
            content = content.replace(/bg-black\/50/g, 'bg-white');
            content = content.replace(/bg-black\/20/g, 'bg-orange-100/50');
            content = content.replace(/bg-black/g, 'bg-white');
            content = content.replace(/bg-zinc-900\/20/g, 'bg-white');
            content = content.replace(/bg-zinc-900\/30/g, 'bg-white');
            content = content.replace(/bg-zinc-900/g, 'bg-orange-100');
            content = content.replace(/bg-zinc-800\/40/g, 'bg-orange-100');

            // Borders
            content = content.replace(/border-white\/5/g, 'border-orange-200');
            content = content.replace(/border-white\/10/g, 'border-orange-200');
            content = content.replace(/border-white\/20/g, 'border-orange-300');

            // Text Colors
            content = content.replace(/text-white/g, 'text-black');
            content = content.replace(/text-zinc-400/g, 'text-zinc-700');
            content = content.replace(/text-zinc-500/g, 'text-zinc-600');
            
            // Accents: Cyan -> Orange, Blue -> Green
            content = content.replace(/text-cyan-400/g, 'text-orange-600');
            content = content.replace(/text-cyan-500/g, 'text-orange-500');
            content = content.replace(/bg-cyan-500/g, 'bg-orange-400');
            content = content.replace(/border-cyan-500/g, 'border-orange-400');
            content = content.replace(/from-cyan-400/g, 'from-orange-300');
            content = content.replace(/to-blue-500/g, 'to-green-300');
            content = content.replace(/hover:from-cyan-300/g, 'hover:from-orange-200');
            content = content.replace(/hover:to-blue-400/g, 'hover:to-green-200');

            // Yellow (used in configuracion) -> Green
            content = content.replace(/text-yellow-500/g, 'text-green-600');
            content = content.replace(/bg-yellow-500/g, 'bg-green-400');
            content = content.replace(/border-yellow-500/g, 'border-green-400');
            content = content.replace(/from-yellow-500/g, 'from-green-400');
            content = content.replace(/to-yellow-600/g, 'to-green-500');
            content = content.replace(/focus:border-yellow-500/g, 'focus:border-green-400');

            // Specific strings
            content = content.replace(/'Spinaz Garage'/g, "'Lavadero VIP'");
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated theme in ${fullPath}`);
            }
        }
    }
}

processDir('src');

// Also update globals.css
const cssPath = 'src/app/globals.css';
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(/background: #000;/g, 'background: #fff7ed;'); // orange-50
    css = css.replace(/color: white;/g, 'color: black;');
    css = css.replace(/color-scheme: dark;/g, 'color-scheme: light;');
    fs.writeFileSync(cssPath, css);
    console.log('Updated globals.css');
}

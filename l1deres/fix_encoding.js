const fs = require('fs');
const path = require('path');

const map = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã‘': 'Ñ',
  'Â¡': '¡',
  'Â¿': '¿',
  'Ã¼': 'ü',
  'Ã°Å¸Å’â‚¬': '🌀',
  'Ã°Å¸Â â€ ': '🏆',
  'ðŸš—': '🚗',
  'Ã°Å¸â€™Â¨': '💨',
  'âš¡': '⚡',
  'Ã°Å¸â€“Â¨Ã¯Â¸': '🖨️',
  'Ã°Å¸â€œ': '📲',
  'Ã°Å¸â€“Â¨': '🖨'
};

const dir = 'c:/Users/trabajo ia/OneDrive/Escritorio/L1deres/l1deres';
const filesToFix = ['pwa_cliente.html', 'cliente.html', 'tv_espera.html', 'tv_precios.html', 'tablet_pista.html', 'app.js', 'sw.js', 'manifest-pwa_cliente.json', 'index.html'];

for(const file of filesToFix) {
  const p = path.join(dir, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    let changed = false;
    for (const [bad, good] of Object.entries(map)) {
      if (content.includes(bad)) {
        content = content.split(bad).join(good);
        changed = true;
      }
    }
    // Fix standalone 'Ã' followed by invisible char if any (like in VehÃ­culo)
    // Actually 'Ã­' catches it if it's Ã followed by soft hyphen
    if (changed) {
      fs.writeFileSync(p, content, 'utf8');
      console.log('Fixed', file);
    }
  }
}

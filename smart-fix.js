const fs = require('fs');
const win1252 = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
    0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
    0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
    0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
    0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};
const reverseMap = {};
for (let i = 0; i < 256; i++) reverseMap[i] = i;
for (const [k, v] of Object.entries(win1252)) reverseMap[v] = parseInt(k);

function fix(str) {
    const bytes = [];
    for(let i=0; i<str.length; i++) {
        const c = str.charCodeAt(i);
        if (!(c in reverseMap)) return str;
        bytes.push(reverseMap[c]);
    }
    try {
        const buf = Buffer.from(bytes);
        const decoded = buf.toString('utf8');
        // If the decode results in invalid characters (Replacement Character \uFFFD)
        // or if it doesn't change anything, or if it decodes to control characters
        if (decoded.includes('\uFFFD')) return str;
        return decoded;
    } catch(e) {
        return str;
    }
}

function fixFile(path) {
    if (!fs.existsSync(path)) return;
    let txt = fs.readFileSync(path, 'utf8');
    // Match consecutive sequences of characters that are >= 0x80
    // This perfectly captures double-encoded UTF-8 sequences.
    const newTxt = txt.replace(/[\x80-\uFFFF]+/g, match => {
        const fixed = fix(match);
        return fixed !== match ? fixed : match;
    });
    fs.writeFileSync(path, newTxt);
    console.log("Fixed", path);
}

fixFile('app.js');
fixFile('index.html');
fixFile('kiosko.html');
fixFile('tv_precios.html');
fixFile('tv_espera.html');
fixFile('tablet_taller.html');
fixFile('tablet_ingreso.html');
fixFile('presentacion.html');
fixFile('postular.html');
fixFile('pantalla_lavado/index.html');

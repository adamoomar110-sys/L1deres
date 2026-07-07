const fs = require('fs');
const cp1252ToByte = {};
for (let i = 0; i < 256; i++) cp1252ToByte[i] = i;
const win1252 = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
    0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
    0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
    0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
    0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};
for (const [byte, charCode] of Object.entries(win1252)) {
    cp1252ToByte[charCode] = parseInt(byte, 10);
}
function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const txt = fs.readFileSync(filePath, 'utf8');
    // If it doesn't contain Ã (C3) or Â (C2), it's probably fine
    if (!txt.includes('\u00C3') && !txt.includes('\u00C2')) {
        console.log("Skipping", filePath, "- looks fine");
        return;
    }
    const bytes = new Uint8Array(txt.length);
    for (let i = 0; i < txt.length; i++) {
        const code = txt.charCodeAt(i);
        if (code in cp1252ToByte) {
            bytes[i] = cp1252ToByte[code];
        } else {
            bytes[i] = code % 256;
        }
    }
    fs.writeFileSync(filePath, Buffer.from(bytes).toString('utf8'));
    console.log("Fixed", filePath);
}
fixFile('app.js');
fixFile('index.html');
fixFile('kiosko.html');
fixFile('tv_precios.html');
fixFile('tv_espera.html');
fixFile('tablet_taller.html');
fixFile('tablet_ingreso.html');

fixFile('postular.html');
fixFile('pantalla_lavado/index.html');

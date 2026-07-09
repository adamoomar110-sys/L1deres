const fs = require('fs');

const replacements = {
    "TAMAÃÂ±O": "TAMAÃ‘O",
    "TAMAÃƒÂ±O": "TAMAÃ‘O",
    "ÃƒÅ¸Ã‚â€”": "ðŸš—",
    "ÃƒÅ¸Ã‚â€Ã‚â€”": "ðŸ”—",
    "Ã°Å¸Å¡â€”": "ðŸš—",
    "Ã°Å¸â€â€”": "ðŸ”—"
};

function fixFile(path) {
    if (!fs.existsSync(path)) return;
    let txt = fs.readFileSync(path, 'utf8');
    
    for (const [bad, good] of Object.entries(replacements)) {
        txt = txt.split(bad).join(good);
    }

    fs.writeFileSync(path, txt);
    console.log("Fixed part 2", path);
}

fixFile('app.js');
fixFile('index.html');
fixFile('pwa_cliente.html');


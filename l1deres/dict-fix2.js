const fs = require('fs');

const replacements = {
    "TAMAÁ±O": "TAMAÑO",
    "TAMAÃ±O": "TAMAÑO",
    "ÃŸÂ—": "🚗",
    "ÃŸÂ”Â—": "🔗",
    "ðŸš—": "🚗",
    "ðŸ”—": "🔗"
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
fixFile('kiosko.html');

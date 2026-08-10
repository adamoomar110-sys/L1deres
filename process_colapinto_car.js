const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const srcPath = `C:/Users/trabajo ia/.gemini/antigravity-ide/brain/b4697e77-c2b5-4d16-a2e5-7ad41f80f21a/colapinto_f1_car_1786347087947.png`;

async function processCarImage() {
    try {
        console.log('Reading source image:', srcPath);
        const image = await Jimp.read(srcPath);

        // Turn pure black and dark background pixels to transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            
            // Background is black (#000000) or near-black dark threshold
            if (red < 20 && green < 20 && blue < 20) {
                this.bitmap.data[idx + 3] = 0; // alpha = 0 (transparent)
            } else if (red > 245 && green > 245 && blue > 245) {
                // If any white border/fringe pixel exists, make transparent too
                this.bitmap.data[idx + 3] = 0;
            }
        });

        // Crop outer transparent space
        image.autocrop();

        const targets = [
            'f1_car_top_down.png',
            'cliente/f1_car_top_down.png',
            'admin/f1_car_top_down.png'
        ];

        for (const target of targets) {
            const fullTarget = path.resolve('c:/Users/trabajo ia/OneDrive/Escritorio/lava2', target);
            await image.writeAsync(fullTarget);
            console.log('Saved transparent car asset to:', fullTarget);
        }

        console.log('✅ ALL COLAPINTO CAR ASSETS PROCESSED SUCCESSFULLY!');
    } catch (err) {
        console.error('Error processing car image:', err);
    }
}

processCarImage();

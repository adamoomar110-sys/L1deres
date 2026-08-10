const Jimp = require('jimp');

async function removeWhiteBackground() {
    try {
        const image = await Jimp.read('C:/Users/trabajo ia/.gemini/antigravity-ide/brain/9046234c-a3d2-46c3-a0fa-68a087d71808/colapinto_f1_top_down_1786323148408.png');
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            // idx is the index of the r, g, b, a values of the pixel
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // If the pixel is very close to white, make it transparent
            if (red > 240 && green > 240 && blue > 240) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0
            }
        });

        await image.writeAsync('f1_car_top_down.png');
        console.log('Background removed successfully!');
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

removeWhiteBackground();

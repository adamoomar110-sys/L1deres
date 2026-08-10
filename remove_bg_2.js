const Jimp = require('jimp');

async function removeWhiteBackground() {
    try {
        const image = await Jimp.read('C:/Users/trabajo ia/.gemini/antigravity-ide/brain/9046234c-a3d2-46c3-a0fa-68a087d71808/colapinto_f1_top_down_1786323148408.png');
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            if (red > 245 && green > 245 && blue > 245) {
                this.bitmap.data[idx + 3] = 0; // transparent
            }
        });

        await image.writeAsync('f1_car_top_down.png');
        console.log('Background removed successfully!');
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

removeWhiteBackground();

const fs = require('fs');
const { loadImage } = require('canvas');
const path = require('path');

async function checkTransparency() {
    const assetsDir = "/Users/majling/Development/its-just-fine/v2/public/assets/sprites/environment";

    // Check a few assets
    const testFiles = ["bush.png", "boulder.png", "dead_tree.png"];

    for (const file of testFiles) {
        const filePath = path.join(assetsDir, file);
        const img = await loadImage(filePath);

        console.log(`\n${file}:`);
        console.log(`  Size: ${img.width}x${img.height}`);

        // Check if image has alpha channel
        const canvas = require('canvas').createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        let hasTransparency = false;
        let transparentPixels = 0;
        let totalPixels = img.width * img.height;

        // Check for any transparent pixels (alpha < 255)
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
                hasTransparency = true;
                if (data[i] === 0) {
                    transparentPixels++;
                }
            }
        }

        console.log(`  Has transparency: ${hasTransparency}`);
        console.log(`  Fully transparent pixels: ${transparentPixels} / ${totalPixels} (${(transparentPixels/totalPixels*100).toFixed(2)}%)`);
    }
}

checkTransparency().catch(console.error);

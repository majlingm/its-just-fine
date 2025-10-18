const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function removeTileBackgrounds() {
    const tilesDir = "/Users/majling/Development/its-just-fine/v2/public/assets/textures/ground";

    // Get all PNG files in the directory
    const files = fs.readdirSync(tilesDir).filter(f => f.endsWith('.png'));

    console.log(`Processing ${files.length} tiles...`);

    for (const file of files) {
        const filePath = path.join(tilesDir, file);

        // Load the image
        const img = await loadImage(filePath);
        const width = img.width;
        const height = img.height;

        // Create canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sample the corner pixel as the background color (top-left corner)
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        console.log(`${file}: Background color sampled: RGB(${bgR}, ${bgG}, ${bgB})`);

        // Tolerance for color matching (adjust if needed)
        const tolerance = 30;

        // Make background transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if pixel is close to background color
            if (Math.abs(r - bgR) < tolerance &&
                Math.abs(g - bgG) < tolerance &&
                Math.abs(b - bgB) < tolerance) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }

        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);

        // Save the file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);

        console.log(`Processed: ${file}`);
    }

    console.log(`\nSuccessfully removed backgrounds from ${files.length} tiles!`);
}

removeTileBackgrounds().catch(console.error);

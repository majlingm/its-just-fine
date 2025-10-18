const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function removeAllBackgrounds() {
    const baseDir = "/Users/majling/Development/its-just-fine/v2/public/assets/sprites";
    const subdirs = ["props", "items", "equipment"];

    // Checkerboard colors (light gray and white)
    const checkerColors = [
        { r: 204, g: 204, b: 204 }, // Light gray
        { r: 255, g: 255, b: 255 }, // White
        { r: 192, g: 192, b: 192 }, // Another gray
        { r: 153, g: 153, b: 153 }  // Darker gray
    ];

    const tolerance = 15;

    for (const subdir of subdirs) {
        const dirPath = path.join(baseDir, subdir);

        if (!fs.existsSync(dirPath)) {
            console.log(`Skipping ${subdir} (directory doesn't exist)`);
            continue;
        }

        console.log(`\nProcessing ${subdir}/...`);

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));

        for (const file of files) {
            const filePath = path.join(dirPath, file);

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

            let removedCount = 0;

            // Make checkerboard transparent
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is close to any checkerboard color (and not too dark)
                for (const color of checkerColors) {
                    if (Math.abs(r - color.r) < tolerance &&
                        Math.abs(g - color.g) < tolerance &&
                        Math.abs(b - color.b) < tolerance &&
                        Math.abs(r - g) < 10 && Math.abs(g - b) < 10) { // grayscale check
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                        removedCount++;
                        break;
                    }
                }
            }

            // Put the modified image data back
            ctx.putImageData(imageData, 0, 0);

            // Save the file
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filePath, buffer);

            const percentage = (removedCount / (width * height) * 100).toFixed(2);
            console.log(`  ${file}: ${percentage}% transparent`);
        }
    }

    console.log(`\nSuccessfully removed backgrounds from all assets!`);
}

removeAllBackgrounds().catch(console.error);

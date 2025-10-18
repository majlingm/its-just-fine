const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function splitAssets() {
    // Load the asset sprite sheet
    const spriteSheetPath = "/Users/majling/openrouter-images/image-2025-10-18T15-23-38-579Z.png";
    const outputDir = "/Users/majling/Development/its-just-fine/v2/public/assets/sprites/environment";

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load the image
    const img = await loadImage(spriteSheetPath);
    const width = img.width;
    const height = img.height;

    // Calculate tile dimensions (4x4 grid)
    const tileWidth = Math.floor(width / 4);
    const tileHeight = Math.floor(height / 4);

    console.log(`Image size: ${width}x${height}`);
    console.log(`Tile size: ${tileWidth}x${tileHeight}`);

    // Asset names for each position in the 4x4 grid
    const assetNames = [
        ["bush", "boulder", "dead_tree", "flowers"],
        ["skull_pile", "small_rocks", "mushrooms", "grass_tuft"],
        ["wooden_crate", "barrel", "torch", "gravestone"],
        ["crystal", "bones_pile", "broken_pillar", "spiderweb"]
    ];

    // Split and save assets
    let assetIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            // Create canvas for this asset
            const canvas = createCanvas(tileWidth, tileHeight);
            const ctx = canvas.getContext('2d');

            // Calculate source position
            const sx = col * tileWidth;
            const sy = row * tileHeight;

            // Draw the asset portion (this preserves transparency)
            ctx.drawImage(img, sx, sy, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);

            // Save the asset
            const assetName = assetNames[row][col];
            const outputPath = path.join(outputDir, `${assetName}.png`);

            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);

            assetIndex++;
            console.log(`Saved: ${outputPath}`);
        }
    }

    console.log(`\nSuccessfully split sprite sheet into ${assetIndex} assets!`);
}

splitAssets().catch(console.error);

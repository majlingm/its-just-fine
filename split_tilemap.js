const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function splitTilemap() {
    // Load the tilemap
    const tileMapPath = "/Users/majling/openrouter-images/image-2025-10-18T14-08-11-931Z.png";
    const outputDir = "/Users/majling/Development/its-just-fine/v2/public/assets/textures/ground";

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load the image
    const img = await loadImage(tileMapPath);
    const width = img.width;
    const height = img.height;

    // Calculate tile dimensions (4x4 grid)
    const tileWidth = Math.floor(width / 4);
    const tileHeight = Math.floor(height / 4);

    console.log(`Image size: ${width}x${height}`);
    console.log(`Tile size: ${tileWidth}x${tileHeight}`);

    // Tile names for each position in the 4x4 grid
    const tileNames = [
        ["brick_wall", "cracked_stone", "bloodstained", "dirt_gravel"],
        ["mossy_stone", "rune_circle", "dark_vortex", "bones"],
        ["lava_cracks", "frozen_ice", "wooden_planks", "metal_grate"],
        ["spike_trap", "toxic_slime", "corrupted_stone", "dark_concrete"]
    ];

    // Split and save tiles
    let tileIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            // Create canvas for this tile
            const canvas = createCanvas(tileWidth, tileHeight);
            const ctx = canvas.getContext('2d');

            // Calculate source position
            const sx = col * tileWidth;
            const sy = row * tileHeight;

            // Draw the tile portion
            ctx.drawImage(img, sx, sy, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);

            // Save the tile
            const tileName = tileNames[row][col];
            const outputPath = path.join(outputDir, `tile_${tileName}.png`);

            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);

            tileIndex++;
            console.log(`Saved: ${outputPath}`);
        }
    }

    console.log(`\nSuccessfully split tilemap into ${tileIndex} tiles!`);
}

splitTilemap().catch(console.error);

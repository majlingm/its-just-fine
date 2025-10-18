const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function splitMultipleAssets() {
    // Define the sprite sheets to process
    const spriteSheets = [
        {
            path: "/Users/majling/openrouter-images/image-2025-10-18T16-57-32-580Z.png",
            outputSubDir: "props",
            names: [
                ["poison_mushrooms", "blood_pool", "broken_shield", "rusty_sword"],
                ["rune_stone", "summoning_circle", "skeleton_corpse", "spider_nest"],
                ["open_chest", "helmet", "gargoyle_statue", "iron_fence"],
                ["wooden_door", "stone_column", "hanging_chains", "brazier"]
            ]
        },
        {
            path: "/Users/majling/openrouter-images/image-2025-10-18T16-57-55-746Z.png",
            outputSubDir: "items",
            names: [
                ["glowing_potion", "health_potion", "mana_potion", "poison_potion"],
                ["key", "lockpicks", "torch_item", "lantern"],
                ["book", "scroll", "map", "gemstone"],
                ["ring", "amulet", "coins", "treasure_bag"]
            ]
        },
        {
            path: "/Users/majling/openrouter-images/image-2025-10-18T16-58-20-522Z.png",
            outputSubDir: "equipment",
            names: [
                ["longsword", "battle_axe", "war_hammer", "magic_dagger"],
                ["bow", "crossbow", "magic_staff", "mace"],
                ["chainmail_armor", "plate_armor", "leather_armor", "studded_armor"],
                ["demon_shield", "demon_helmet", "armored_boots", "armored_gauntlets"]
            ]
        }
    ];

    const baseOutputDir = "/Users/majling/Development/its-just-fine/v2/public/assets/sprites";

    for (const sheet of spriteSheets) {
        console.log(`\nProcessing: ${path.basename(sheet.path)}`);

        const outputDir = path.join(baseOutputDir, sheet.outputSubDir);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Load the image
        const img = await loadImage(sheet.path);
        const width = img.width;
        const height = img.height;

        // Calculate tile dimensions (4x4 grid)
        const tileWidth = Math.floor(width / 4);
        const tileHeight = Math.floor(height / 4);

        console.log(`  Image size: ${width}x${height}`);
        console.log(`  Tile size: ${tileWidth}x${tileHeight}`);

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
                const assetName = sheet.names[row][col];
                const outputPath = path.join(outputDir, `${assetName}.png`);

                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync(outputPath, buffer);

                assetIndex++;
                console.log(`  Saved: ${assetName}.png`);
            }
        }

        console.log(`  Split into ${assetIndex} assets`);
    }

    console.log(`\nSuccessfully processed all sprite sheets!`);
}

splitMultipleAssets().catch(console.error);

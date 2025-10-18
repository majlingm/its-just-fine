#!/usr/bin/env python3
from PIL import Image
import os

# Load the tilemap
tilemap_path = "/Users/majling/openrouter-images/image-2025-10-18T14-08-11-931Z.png"
output_dir = "/Users/majling/Development/its-just-fine/v2/public/assets/textures/ground"

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Load the image
img = Image.open(tilemap_path)
width, height = img.size

# Calculate tile dimensions (4x4 grid)
tile_width = width // 4
tile_height = height // 4

print(f"Image size: {width}x{height}")
print(f"Tile size: {tile_width}x{tile_height}")

# Tile names for each position in the 4x4 grid
tile_names = [
    ["brick_wall", "cracked_stone", "bloodstained", "dirt_gravel"],
    ["mossy_stone", "rune_circle", "dark_vortex", "bones"],
    ["lava_cracks", "frozen_ice", "wooden_planks", "metal_grate"],
    ["spike_trap", "toxic_slime", "corrupted_stone", "dark_concrete"]
]

# Split and save tiles
tile_index = 0
for row in range(4):
    for col in range(4):
        # Calculate crop box
        left = col * tile_width
        top = row * tile_height
        right = left + tile_width
        bottom = top + tile_height

        # Crop the tile
        tile = img.crop((left, top, right, bottom))

        # Save the tile
        tile_name = tile_names[row][col]
        output_path = os.path.join(output_dir, f"tile_{tile_name}.png")
        tile.save(output_path)

        tile_index += 1
        print(f"Saved: {output_path}")

print(f"\nSuccessfully split tilemap into {tile_index} tiles!")

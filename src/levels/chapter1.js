// Chapter 1: The Awakening - First story level
import { getAssetPath } from '../utils/assetPath.js';

export const chapter1Level = {
  name: 'Chapter 1: The Awakening',
  description: 'Your journey begins in the cursed void',
  groundType: 'void',
  music: getAssetPath('/assets/music/risinginferno.mp3'),

  // Ground platform dimensions (tunnel shape)
  groundSize: {
    width: 20,
    length: 1000
  },

  lighting: {
    background: 0x0a0a1a, // Dark void background
    ambient: { color: 0x4444ff, intensity: 0.3 },
    sun: {
      color: 0x8888ff,
      intensity: 0.8,
      position: { x: 20, y: 40, z: 15 }
    },
    fill: { color: 0x4444aa, intensity: 0.2 },
    hemisphere: {
      sky: 0x222244,
      ground: 0x000000,
      intensity: 0.4
    }
  },

  spawnBoundaries: {
    minX: -10,
    maxX: 10,
    minZ: -500,
    maxZ: 500
  },

  // Wave configuration - Chapter 1 (introductory difficulty)
  waves: [
    // Wave 1 - Easy introduction
    {
      enemyCount: 30,
      spawnInterval: 2.0,
      spawnBatchSize: 2,
      groupSpawnChance: 0.5,
      enemyTypes: [
        { type: 'normal', weight: 10 }
      ]
    },
    // Wave 2 - Introduce variety
    {
      enemyCount: 50,
      spawnInterval: 1.5,
      spawnBatchSize: 3,
      groupSpawnChance: 0.6,
      enemyTypes: [
        { type: 'normal', weight: 8 },
        { type: 'fast', weight: 2 }
      ]
    },
    // Wave 3 - First challenge
    {
      enemyCount: 70,
      spawnInterval: 1.2,
      spawnBatchSize: 4,
      groupSpawnChance: 0.5,
      enemyTypes: [
        { type: 'normal', weight: 6 },
        { type: 'fast', weight: 3 },
        { type: 'elite', weight: 1 }
      ]
    },
    // Wave 4 - Final push
    {
      enemyCount: 90,
      spawnInterval: 1.0,
      spawnBatchSize: 5,
      groupSpawnChance: 0.7,
      enemyTypes: [
        { type: 'normal', weight: 5 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 1 }
      ]
    }
  ],

  // Boss configuration
  boss: {
    type: 'zombieLord',
    health: 3500,
    damage: 35,
    speed: 2.5
  },

  // Enemy behavior settings
  enemySettings: {
    rangedEnemies: [],
    elitesCanShoot: true,
    eliteShootChance: 0.4,
    shootRange: 12,
    shootCooldown: { min: 4.5, max: 7.0 },
    projectileSpeed: 6,
    projectileDamage: 10
  },

  objects: [
    // Border cliffs - create canyon walls
    // North wall
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -60, y: 0, z: -75, scale: 2, rotation: { y: 0 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -30, y: 0, z: -75, scale: 2, rotation: { y: 0 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 0, y: 0, z: -75, scale: 2, rotation: { y: 0 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 30, y: 0, z: -75, scale: 2, rotation: { y: 0 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 60, y: 0, z: -75, scale: 2, rotation: { y: 0 } },

    // South wall
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -60, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -30, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 0, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 30, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 60, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },

    // West wall
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -75, y: 0, z: -45, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -75, y: 0, z: -15, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -75, y: 0, z: 15, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -75, y: 0, z: 45, scale: 2, rotation: { y: Math.PI / 2 } },

    // East wall
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 75, y: 0, z: -45, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 75, y: 0, z: -15, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 75, y: 0, z: 15, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 75, y: 0, z: 45, scale: 2, rotation: { y: -Math.PI / 2 } },

    // Corner rocks
    { model: getAssetPath('/models/nature-kit/cliff_cornerLarge_stone.glb'), x: -75, y: 0, z: -75, scale: 2 },
    { model: getAssetPath('/models/nature-kit/cliff_cornerLarge_stone.glb'), x: 75, y: 0, z: -75, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_cornerLarge_stone.glb'), x: -75, y: 0, z: 75, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: getAssetPath('/models/nature-kit/cliff_cornerLarge_stone.glb'), x: 75, y: 0, z: 75, scale: 2, rotation: { y: Math.PI } },

    // Central rock formations - cover
    { model: getAssetPath('/models/nature-kit/cliff_large_rock.glb'), x: -25, y: 0, z: -20, scale: 2.5, rotation: { y: 0.5 } },
    { model: getAssetPath('/models/nature-kit/cliff_large_rock.glb'), x: 25, y: 0, z: 20, scale: 2.5, rotation: { y: -0.8 } },
    { model: getAssetPath('/models/nature-kit/cliff_large_rock.glb'), x: -15, y: 0, z: 30, scale: 2.2, rotation: { y: 1.2 } },
    { model: getAssetPath('/models/nature-kit/cliff_large_rock.glb'), x: 35, y: 0, z: -25, scale: 2.3, rotation: { y: -1.5 } },

    // Scattered rocks
    { model: getAssetPath('/models/nature-kit/rock_tallH.glb'), x: -40, y: 0, z: -35, scale: 2.0, rotation: { y: 0.3 } },
    { model: getAssetPath('/models/nature-kit/rock_tallI.glb'), x: 40, y: 0, z: 35, scale: 1.9, rotation: { y: -0.7 } },
    { model: getAssetPath('/models/nature-kit/rock_tallJ.glb'), x: -50, y: 0, z: 20, scale: 1.8, rotation: { y: 1.1 } },
    { model: getAssetPath('/models/nature-kit/rock_tallH.glb'), x: 45, y: 0, z: -40, scale: 2.1, rotation: { y: -0.4 } },

    // Small decorative stones
    { model: getAssetPath('/models/nature-kit/stone_smallFlatA.glb'), x: -10, y: 0, z: -10, scale: 1.5, rotation: { y: 0.2 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/stone_smallFlatB.glb'), x: 15, y: 0, z: 5, scale: 1.5, rotation: { y: -0.3 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/stone_smallFlatC.glb'), x: -5, y: 0, z: 25, scale: 1.5, rotation: { y: 1.0 }, collidable: false },

    // Desert vegetation
    { model: getAssetPath('/models/nature-kit/plant_bush.glb'), x: -45, y: 0, z: -10, scale: 1.6, rotation: { y: 0.3 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/plant_bushDetailed.glb'), x: 42, y: 0, z: 8, scale: 1.5, rotation: { y: -0.8 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/plant_bushTriangle.glb'), x: -38, y: 0, z: 30, scale: 1.4, rotation: { y: 1.2 }, collidable: false },

    // Palm oasis - Northwest
    { model: getAssetPath('/models/nature-kit/grass_large.glb'), x: -55, y: -0.1, z: -50, scale: 5, rotation: { y: 0 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/tree_palmTall.glb'), x: -58, y: 0, z: -53, scale: 3.5, rotation: { y: 0.3 } },
    { model: getAssetPath('/models/nature-kit/tree_palmDetailedTall.glb'), x: -52, y: 0, z: -55, scale: 3.2, rotation: { y: -0.8 } },
    { model: getAssetPath('/models/nature-kit/tree_palm.glb'), x: -60, y: 0, z: -47, scale: 3.0, rotation: { y: 1.2 } },

    // Palm oasis - Southeast
    { model: getAssetPath('/models/nature-kit/grass_large.glb'), x: 52, y: -0.1, z: 55, scale: 4.5, rotation: { y: 0.7 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/tree_palmDetailedShort.glb'), x: 50, y: 0, z: 58, scale: 2.8, rotation: { y: 0.9 } },
    { model: getAssetPath('/models/nature-kit/tree_palmBend.glb'), x: 55, y: 0, z: 53, scale: 3.0, rotation: { y: -0.5 } },
  ]
};
